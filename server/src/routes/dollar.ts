import { Router } from 'express';
import db from '../db/database';

const router = Router();

// GET /api/dollar/latest
router.get('/latest', (_req, res) => {
  const row = db.prepare('SELECT * FROM dollar_history ORDER BY date DESC LIMIT 1').get() as any;
  if (row) {
    res.json(row);
  } else {
    res.json({ date: new Date().toISOString().split('T')[0], rate: 913.83, high52w: 1008.36, low52w: 850.90, position_pct: 40, signal: 'NEUTRAL' });
  }
});

// GET /api/dollar/history?range=1M
router.get('/history', (req, res) => {
  const range = req.query.range as string || '1M';
  const days: Record<string, number> = { '1S': 5, '1M': 22, '3M': 66, '6M': 132, '1A': 252, '5A': 1260 };
  const limit = days[range] || 22;
  const rows = db.prepare('SELECT * FROM dollar_history ORDER BY date DESC LIMIT ?').all(limit);
  res.json(rows.reverse());
});

export default router;
