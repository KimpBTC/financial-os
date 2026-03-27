import { Router } from 'express';
import db from '../db/database';

const router = Router();

// GET /api/snapshots?range=6M
router.get('/', (req, res) => {
  const range = req.query.range as string || '6M';
  const months: Record<string, number> = { '3M': 3, '6M': 6, '1A': 12, '2A': 24, '5A': 60 };
  const limit = months[range] || 6;
  const rows = db.prepare('SELECT * FROM snapshots ORDER BY month DESC LIMIT ?').all(limit);
  res.json(rows.reverse());
});

// POST /api/snapshots — Create snapshot of current portfolio state
router.post('/', (_req, res) => {
  const month = new Date().toISOString().slice(0, 7); // YYYY-MM

  const stocks = db.prepare(`
    SELECT p.*, ph.price, ph.high52w, ph.low52w
    FROM portfolio p
    LEFT JOIN price_history ph ON p.ticker = ph.ticker
      AND ph.date = (SELECT MAX(date) FROM price_history WHERE ticker = p.ticker)
    WHERE p.active = 1
  `).all() as any[];

  const dollar = db.prepare('SELECT rate FROM dollar_history ORDER BY date DESC LIMIT 1').get() as any;
  const rate = dollar?.rate || 913;

  const totalWealth = stocks.reduce((sum: number, s: any) => {
    return sum + (s.owned_quantity || 0) * (s.price || 0) * rate;
  }, 150000); // +150k fondo emergencia

  const prevSnapshot = db.prepare('SELECT total_wealth_clp, total_contributions_clp FROM snapshots ORDER BY month DESC LIMIT 1').get() as any;
  const budget = parseInt((db.prepare("SELECT value FROM config WHERE key = 'monthly_budget'").get() as any)?.value || '350000');
  const totalContributions = (prevSnapshot?.total_contributions_clp || 0) + budget;
  const netGain = totalWealth - totalContributions;
  const roi = totalContributions > 0 ? (netGain / totalContributions) * 100 : 0;

  try {
    db.prepare(`
      INSERT OR REPLACE INTO snapshots (month, total_wealth_clp, total_contributions_clp, net_gain_clp, roi_pct, exchange_rate, portfolio_json)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(month, Math.round(totalWealth), totalContributions, Math.round(netGain), roi, rate, JSON.stringify(stocks));

    res.json({ success: true, month, total_wealth_clp: Math.round(totalWealth), roi_pct: roi });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
