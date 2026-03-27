import { Router } from 'express';
import db from '../db/database';

const router = Router();

// GET /api/market/latest — Latest market data
router.get('/latest', (_req, res) => {
  const signal = db.prepare('SELECT * FROM market_signals ORDER BY date DESC LIMIT 1').get();
  if (signal) {
    res.json(signal);
  } else {
    // Return mock data if no real data yet
    res.json({
      date: new Date().toISOString().split('T')[0],
      vix: 18.2, fear_greed: 62, sp500_drawdown: -3.2,
      market_score: 8, market_action: 'NORMAL',
      dollar_rate: 913.83, dollar_signal: 'NEUTRAL'
    });
  }
});

// GET /api/market/history?range=1M
router.get('/history', (req, res) => {
  const range = req.query.range as string || '1M';
  const days: Record<string, number> = { '1S': 5, '1M': 22, '3M': 66, '6M': 132, '1A': 252, '5A': 1260 };
  const limit = days[range] || 22;
  const rows = db.prepare('SELECT * FROM market_signals ORDER BY date DESC LIMIT ?').all(limit);
  res.json(rows.reverse());
});

// GET /api/market/signal — Current market signal
router.get('/signal', (_req, res) => {
  const signal = db.prepare('SELECT * FROM market_signals ORDER BY date DESC LIMIT 1').get() as any;
  const score = signal?.market_score || 8;

  let label, action, color, multiplier;
  if (score >= 75) { label = 'ALL-IN'; action = 'Invierte todo lo que puedas'; color = '#e63946'; multiplier = 4; }
  else if (score >= 55) { label = 'AGRESIVO'; action = 'Invierte el triple'; color = '#f4a261'; multiplier = 3; }
  else if (score >= 35) { label = 'REFORZADO'; action = 'Invierte el doble'; color = '#e9c46a'; multiplier = 2; }
  else if (score >= 15) { label = 'LEVE'; action = 'Invierte un poco más'; color = '#4cc9f0'; multiplier = 1.5; }
  else { label = 'NORMAL'; action = 'Inversión mensual regular'; color = '#06d6a0'; multiplier = 1; }

  res.json({ score, label, action, color, multiplier, ...(signal || {}) });
});

export default router;
