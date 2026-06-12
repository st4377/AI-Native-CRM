import express from 'express';
import { pool } from '../db.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM customer_stats ORDER BY id');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM customer_stats WHERE id = $1', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Customer not found' });

    const { rows: orders } = await pool.query(
      'SELECT * FROM orders WHERE customer_id = $1 ORDER BY order_date DESC',
      [req.params.id]
    );

    res.json({ ...rows[0], orders });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;