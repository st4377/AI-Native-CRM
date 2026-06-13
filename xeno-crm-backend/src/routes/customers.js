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

// POST /api/customers - add a new customer, optionally with their first order
router.post('/', async (req, res) => {
  try {
    const { name, email, phone, order } = req.body;
    if (!name || !email) return res.status(400).json({ error: 'name and email are required' });

    const { rows } = await pool.query(
      `INSERT INTO customers (name, email, phone, total_spent) VALUES ($1, $2, $3, 0) RETURNING *`,
      [name, email, phone || null]
    );
    const customer = rows[0];

    if (order && order.amount) {
      await pool.query(
        `INSERT INTO orders (customer_id, amount, order_date, items, created_at)
         VALUES ($1, $2, $3, $4, now())`,
        [customer.id, order.amount, order.date || new Date().toISOString(), order.items || '']
      );
      await pool.query(`UPDATE customers SET total_spent = total_spent + $1 WHERE id = $2`, [order.amount, customer.id]);
    }

    res.status(201).json(customer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;