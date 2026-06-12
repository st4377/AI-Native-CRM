import express from 'express';
import axios from 'axios';
import { pool } from '../db.js';
import { generateJSON, generateText } from '../gemini.js';
import { buildWhereClause } from '../lib/segmentQueryBuilder.js';

const router = express.Router();

router.post('/draft-messages', async (req, res) => {
  try {
    const { segmentId, channel, goal } = req.body;
    if (!segmentId || !channel || !goal) return res.status(400).json({ error: 'segmentId, channel, goal required' });

    const { rows: segRows } = await pool.query('SELECT * FROM segments WHERE id = $1', [segmentId]);
    if (!segRows.length) return res.status(404).json({ error: 'Segment not found' });

    const prompt = `You are a marketing copywriter for a D2C consumer brand's CRM.
Write 3 short ${channel} message variants for this campaign goal: "${goal}".
Target audience: "${segRows[0].name}", rules: ${JSON.stringify(segRows[0].rules)}.
Each message under 300 characters, friendly on-brand tone, include {{name}} once for personalization.
Vary the angle across the 3 (urgency, value, warmth).
Return ONLY a JSON array of 3 strings.`;

    const variants = await generateJSON(prompt);
    res.json({ variants });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  const client = await pool.connect();
  try {
    const { segmentId, message, channel } = req.body;
    if (!segmentId || !message || !channel) return res.status(400).json({ error: 'segmentId, message, channel required' });

    const { rows: segRows } = await client.query('SELECT * FROM segments WHERE id = $1', [segmentId]);
    if (!segRows.length) return res.status(404).json({ error: 'Segment not found' });

    const { clause, params } = buildWhereClause(segRows[0].rules);
    const { rows: customers } = await client.query(`SELECT * FROM customer_stats WHERE ${clause}`, params);

    await client.query('BEGIN');

    const { rows: campaignRows } = await client.query(
      `INSERT INTO campaigns (segment_id, message, channel, status, audience_size, created_at)
       VALUES ($1, $2, $3, 'sending', $4, now()) RETURNING *`,
      [segmentId, message, channel, customers.length]
    );
    const campaign = campaignRows[0];

    const logs = [];
    for (const cust of customers) {
      const { rows: logRows } = await client.query(
        `INSERT INTO communication_logs (campaign_id, customer_id, status, sent_at, updated_at)
         VALUES ($1, $2, 'pending', now(), now()) RETURNING id`,
        [campaign.id, cust.id]
      );
      logs.push({ id: logRows[0].id, customer: cust });
    }

    await client.query('COMMIT');

    for (const { id, customer } of logs) {
      const personalized = message.replaceAll('{{name}}', customer.name);
      axios.post(`${process.env.CHANNEL_SERVICE_URL}/send`, {
        communication_id: id, recipient: customer.email, message: personalized, channel,
      }).catch((e) => console.error(`channel send failed for log ${id}:`, e.message));
    }

    await pool.query(`UPDATE campaigns SET status = 'sent' WHERE id = $1`, [campaign.id]);
    res.status(201).json({ ...campaign, status: 'sent', audience_size: customers.length });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        c.*,
        s.name AS segment_name,
        count(l.id) AS total_count,
        count(l.id) FILTER (WHERE l.status IN ('delivered','opened','clicked')) AS delivered_count,
        count(l.id) FILTER (WHERE l.status = 'failed')                          AS failed_count,
        count(l.id) FILTER (WHERE l.status IN ('opened','clicked'))             AS opened_count,
        count(l.id) FILTER (WHERE l.status = 'clicked')                         AS clicked_count
      FROM campaigns c
      LEFT JOIN communication_logs l ON l.campaign_id = c.id
      LEFT JOIN segments s ON s.id = c.segment_id
      GROUP BY c.id, s.name
      ORDER BY c.created_at DESC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { rows: campRows } = await pool.query('SELECT * FROM campaigns WHERE id = $1', [req.params.id]);
    if (!campRows.length) return res.status(404).json({ error: 'Campaign not found' });

    const { rows: logs } = await pool.query(
      `SELECT l.*, c.name AS customer_name, c.email FROM communication_logs l
       JOIN customers c ON c.id = l.customer_id WHERE l.campaign_id = $1 ORDER BY l.id`,
      [req.params.id]
    );
    res.json({ campaign: campRows[0], logs });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id/summary', async (req, res) => {
  try {
    const { rows: campRows } = await pool.query('SELECT * FROM campaigns WHERE id = $1', [req.params.id]);
    if (!campRows.length) return res.status(404).json({ error: 'Campaign not found' });

    const { rows: statRows } = await pool.query(
      `SELECT status, count(*) FROM communication_logs WHERE campaign_id = $1 GROUP BY status`,
      [req.params.id]
    );

    const prompt = `You are a marketing analyst reviewing one campaign's results.
Campaign: ${JSON.stringify(campRows[0])}
Delivery status breakdown: ${JSON.stringify(statRows)}
Write a 2-3 sentence performance summary for the marketer, ending with one actionable suggestion. No markdown.`;

    const summary = await generateText(prompt);
    res.json({ campaign: campRows[0], stats: statRows, summary });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;