import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import customersRouter from './routes/customers.js';
import segmentsRouter from './routes/segments.js';
import campaignsRouter from './routes/campaigns.js';
import communicationsRouter from './routes/communications.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api/customers', customersRouter);
app.use('/api/segments', segmentsRouter);
app.use('/api/campaigns', campaignsRouter);
app.use('/api/communications', communicationsRouter);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Xeno CRM backend running on port ${PORT}`));