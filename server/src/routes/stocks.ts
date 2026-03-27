import { Router } from 'express';
import db from '../db/database';

const router = Router();

// GET /api/stocks/scores — All stock scores
router.get('/scores', (_req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const scores = db.prepare('SELECT * FROM stock_scores WHERE date = ? ORDER BY opportunity_score DESC').all(today);
  if (scores.length) {
    res.json(scores);
  } else {
    // Calculate from portfolio if no scores saved
    const stocks = db.prepare('SELECT * FROM portfolio WHERE active = 1').all() as any[];
    const prices = stocks.map(s => {
      const latest = db.prepare('SELECT * FROM price_history WHERE ticker = ? ORDER BY date DESC LIMIT 1').get(s.ticker) as any;
      const price = latest?.price || 0;
      const high52 = latest?.high52w || price * 1.15;
      const low52 = latest?.low52w || price * 0.7;
      const dd = price && high52 ? ((price - high52) / high52) * 100 : 0;
      const fl = price && low52 ? ((price - low52) / low52) * 100 : 0;
      const score = Math.min(100, Math.max(0, Math.round(Math.abs(dd) * 2 + (100 - fl) * 0.3)));
      return { ticker: s.ticker, drawdown_pct: dd, from_low_pct: fl, opportunity_score: score };
    });
    res.json(prices);
  }
});

// GET /api/stocks/:ticker — Stock data
router.get('/:ticker', (req, res) => {
  const { ticker } = req.params;
  const stock = db.prepare('SELECT * FROM portfolio WHERE ticker = ? AND active = 1').get(ticker);
  const latestPrice = db.prepare('SELECT * FROM price_history WHERE ticker = ? ORDER BY date DESC LIMIT 1').get(ticker);
  res.json({ stock, latestPrice });
});

// GET /api/stocks/:ticker/history?range=1M
router.get('/:ticker/history', (req, res) => {
  const { ticker } = req.params;
  const range = req.query.range as string || '1M';
  const days: Record<string, number> = { '1S': 5, '1M': 22, '3M': 66, '6M': 132, '1A': 252, '5A': 1260 };
  const limit = days[range] || 22;
  const rows = db.prepare('SELECT * FROM price_history WHERE ticker = ? ORDER BY date DESC LIMIT ?').all(ticker, limit);
  res.json(rows.reverse());
});

export default router;
