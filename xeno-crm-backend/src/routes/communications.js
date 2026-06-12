import express from 'express';
import { pool } from '../db.js';

const router = express.Router();
const VALID_STATUSES = ['pending', 'sent', 'delivered', 'failed', 'opened', 'clicked'];

router.post('/receipt', async (req, res) => {
  try {
    const { communication_id, status } = req.body;
    if (!communication_id || !VALID_STATUSES.includes(status)) {
      return res.status(400).json({ error: 'communication_id and valid status required' });
    }

    const { rows } = await pool.query(
      `UPDATE communication_logs SET status = $1, updated_at = now() WHERE id = $2 RETURNING *`,
      [status, communication_id]
    );
    if (!rows.length) return res.status(404).json({ error: 'communication_log not found' });

    res.json({ ok: true, log: rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;