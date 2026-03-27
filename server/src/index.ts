import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import portfolioRoutes from './routes/portfolio';
import marketRoutes from './routes/market';
import stockRoutes from './routes/stocks';
import dollarRoutes from './routes/dollar';
import telegramRoutes from './routes/telegram';
import transactionRoutes from './routes/transactions';
import snapshotRoutes from './routes/snapshots';
import { startCronJobs } from './services/cronService';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const IS_PROD = process.env.NODE_ENV === 'production';

// Middleware
// En producción el frontend se sirve desde el mismo origen → no se necesita CORS
app.use(cors({ origin: IS_PROD ? false : '*' }));
app.use(express.json());

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), version: '3.0.0' });
});

// Routes
app.use('/api/config', portfolioRoutes);
app.use('/api/market', marketRoutes);
app.use('/api/stocks', stockRoutes);
app.use('/api/dollar', dollarRoutes);
app.use('/api/telegram', telegramRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/snapshots', snapshotRoutes);

// Simulator (inline — simple calculation)
app.post('/api/simulator/project', (req, res) => {
  const { monthly, returnRate, years } = req.body;
  const r = returnRate / 100 / 12;
  const n = years * 12;
  const futureValue = Math.round(monthly * (((1 + r) ** n - 1) / r));
  const totalContributed = monthly * 12 * years;
  res.json({
    futureValue,
    totalContributed,
    gain: futureValue - totalContributed,
    roi: ((futureValue - totalContributed) / totalContributed * 100).toFixed(1),
  });
});

// ── Serve frontend (always when client/dist exists) ───────────────────────────
const clientDist = path.resolve(__dirname, '..', '..', 'client', 'dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  // SPA fallback — any non-API route returns index.html (Express 5 uses app.use)
  app.use((_req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
  console.log(`  📦 Serving frontend from ${clientDist}`);
} else {
  console.warn('  ⚠️  client/dist not found — run `npm run build:client` first');
}

// Start server
app.listen(PORT, () => {
  console.log(`\n  🚀 Financial OS API running on http://localhost:${PORT}`);
  console.log(`  📊 Health check: http://localhost:${PORT}/api/health\n`);

  // Start cron jobs
  startCronJobs();
});

export default app;
