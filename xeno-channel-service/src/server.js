import express from 'express';
import cors from 'cors';
import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const CRM_RECEIPT_URL = process.env.CRM_RECEIPT_URL || 'http://localhost:4000/api/communications/receipt';

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.post('/send', (req, res) => {
  const { communication_id, recipient, message, channel } = req.body;
  if (!communication_id || !recipient || !message || !channel) {
    return res.status(400).json({ error: 'communication_id, recipient, message, channel required' });
  }
  console.log(`[send] #${communication_id} via ${channel} -> ${recipient}`);
  res.status(202).json({ status: 'queued', communication_id });

  simulateLifecycle(communication_id).catch((err) => console.error('lifecycle error', err.message));
});

async function simulateLifecycle(id) {
  await wait(200, 1000);
  await reportStatus(id, 'sent');

  await wait(1000, 4000);
  const delivered = Math.random() < 0.92;
  await reportStatus(id, delivered ? 'delivered' : 'failed');
  if (!delivered) return;

  await wait(1000, 6000);
  if (Math.random() < 0.55) {
    await reportStatus(id, 'opened');
    await wait(500, 4000);
    if (Math.random() < 0.35) await reportStatus(id, 'clicked');
  }
}

async function reportStatus(communication_id, status) {
  try {
    await axios.post(CRM_RECEIPT_URL, { communication_id, status });
    console.log(`[receipt] #${communication_id} -> ${status}`);
  } catch (err) {
    console.error(`[receipt failed] #${communication_id} -> ${status}:`, err.message);
  }
}

function wait(minMs, maxMs) {
  return new Promise((r) => setTimeout(r, minMs + Math.random() * (maxMs - minMs)));
}

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Channel service running on port ${PORT}`));