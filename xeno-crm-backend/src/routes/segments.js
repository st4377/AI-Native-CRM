import express from 'express';
import { pool } from '../db.js';
import { generateJSON } from '../gemini.js';
import { buildWhereClause, ALLOWED_FIELDS, ALLOWED_OPS } from '../lib/segmentQueryBuilder.js';

const router = express.Router();

const RULES_PROMPT = `You convert a marketer's natural-language description of an audience
into a structured JSON rules object used to filter a customer database.

Available fields (use ONLY these exact names):
- total_spend (number, lifetime amount spent by the customer)
- order_count (number, total number of orders placed)
- days_since_last_order (number, days since the customer's most recent order)

Allowed operators (use ONLY these): ${ALLOWED_OPS.join(', ')}

Return ONLY valid JSON, no markdown, no explanation, in exactly this shape:
{
  "operator": "AND" | "OR",
  "conditions": [
    { "field": "total_spend", "op": ">", "value": 5000 }
  ]
}

If the description mentions a relative time (e.g. "in the last 30 days"),
convert it to a days_since_last_order condition.

Marketer's description: `;

router.post('/preview', async (req, res) => {
  try {
    const { description, rules: providedRules } = req.body;
    let rules = providedRules;
    let aiGenerated = false;

    if (!rules) {
      if (!description) return res.status(400).json({ error: 'Provide description or rules' });
      rules = await generateJSON(RULES_PROMPT + description);
      aiGenerated = true;
    }

    const { clause, params } = buildWhereClause(rules);
    const { rows } = await pool.query(`SELECT * FROM customer_stats WHERE ${clause} ORDER BY id`, params);

    res.json({ rules, ai_generated: aiGenerated, count: rows.length, customers: rows });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const { rows: segments } = await pool.query('SELECT * FROM segments ORDER BY id DESC');
    const withCounts = await Promise.all(
      segments.map(async (seg) => {
        try {
          const { clause, params } = buildWhereClause(seg.rules);
          const { rows } = await pool.query(`SELECT count(*) FROM customer_stats WHERE ${clause}`, params);
          return { ...seg, current_count: Number(rows[0].count) };
        } catch {
          return { ...seg, current_count: null };
        }
      })
    );
    res.json(withCounts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, rules } = req.body;
    if (!name || !rules) return res.status(400).json({ error: 'name and rules required' });
    buildWhereClause(rules); // validate before saving
    const { rows } = await pool.query(
      'INSERT INTO segments (name, rules, created_at) VALUES ($1, $2, now()) RETURNING *',
      [name, rules]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/:id/customers', async (req, res) => {
  try {
    const { rows: segRows } = await pool.query('SELECT * FROM segments WHERE id = $1', [req.params.id]);
    if (!segRows.length) return res.status(404).json({ error: 'Segment not found' });
    const { clause, params } = buildWhereClause(segRows[0].rules);
    const { rows } = await pool.query(`SELECT * FROM customer_stats WHERE ${clause} ORDER BY id`, params);
    res.json({ segment: segRows[0], count: rows.length, customers: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/meta/fields', (req, res) => {
  res.json({ fields: ALLOWED_FIELDS, operators: ALLOWED_OPS });
});

export default router;