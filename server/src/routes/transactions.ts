import { Router } from 'express';
import db from '../db/database';

const router = Router();

// GET /api/transactions
router.get('/', (req, res) => {
  const limit = parseInt(req.query.limit as string) || 50;
  const rows = db.prepare('SELECT * FROM transactions ORDER BY date DESC, created_at DESC LIMIT ?').all(limit);
  res.json(rows);
});

// POST /api/transactions
router.post('/', (req, res) => {
  const { date, ticker, type, quantity, price_usd, exchange_rate, total_clp, notes } = req.body;
  if (!ticker || !type) return res.status(400).json({ error: 'ticker and type are required' });

  const result = db.prepare(`
    INSERT INTO transactions (date, ticker, type, quantity, price_usd, exchange_rate, total_clp, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    date || new Date().toISOString().split('T')[0],
    ticker, type, quantity || 0, price_usd || 0, exchange_rate || 0,
    total_clp || (quantity || 0) * (price_usd || 0) * (exchange_rate || 1),
    notes || null
  );

  // Update owned_quantity in portfolio
  if (type === 'BUY') {
    db.prepare('UPDATE portfolio SET owned_quantity = owned_quantity + ? WHERE ticker = ?').run(quantity || 0, ticker);
  } else if (type === 'SELL') {
    db.prepare('UPDATE portfolio SET owned_quantity = MAX(0, owned_quantity - ?) WHERE ticker = ?').run(quantity || 0, ticker);
  }

  res.json({ id: result.lastInsertRowid, success: true });
});

// DELETE /api/transactions/:id
router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM transactions WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

export default router;
