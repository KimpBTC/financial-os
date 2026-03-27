import { Router } from 'express';
import db from '../db/database';

const router = Router();

// GET /api/config/portfolio — Get all active stocks
router.get('/portfolio', (_req, res) => {
  const stocks = db.prepare('SELECT * FROM portfolio WHERE active = 1 ORDER BY id').all();
  res.json(stocks);
});

// POST /api/config/portfolio — Add new stock
router.post('/portfolio', (req, res) => {
  const { ticker, name, category, color, allocation } = req.body;
  try {
    const result = db.prepare(
      'INSERT INTO portfolio (ticker, name, category, color, allocation) VALUES (?, ?, ?, ?, ?)'
    ).run(ticker, name || ticker, category || 'Growth', color || '#4cc9f0', allocation || 0);
    res.json({ id: result.lastInsertRowid, ticker, name, category, color, allocation });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

// PUT /api/config/portfolio/:id — Update allocation
router.put('/portfolio/:id', (req, res) => {
  const { allocation, name, category } = req.body;
  const updates: string[] = [];
  const values: any[] = [];
  if (allocation !== undefined) { updates.push('allocation = ?'); values.push(allocation); }
  if (name !== undefined) { updates.push('name = ?'); values.push(name); }
  if (category !== undefined) { updates.push('category = ?'); values.push(category); }
  values.push(req.params.id);
  db.prepare(`UPDATE portfolio SET ${updates.join(', ')} WHERE id = ?`).run(...values);
  res.json({ success: true });
});

// DELETE /api/config/portfolio/:id — Remove stock
router.delete('/portfolio/:id', (req, res) => {
  db.prepare('UPDATE portfolio SET active = 0 WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// GET /api/config/budget — Get monthly budget
router.get('/budget', (_req, res) => {
  const row = db.prepare("SELECT value FROM config WHERE key = 'monthly_budget'").get() as any;
  res.json({ budget: parseInt(row?.value || '350000') });
});

// PUT /api/config/budget — Update monthly budget
router.put('/budget', (req, res) => {
  const { budget } = req.body;
  db.prepare("UPDATE config SET value = ? WHERE key = 'monthly_budget'").run(String(budget));
  res.json({ success: true, budget });
});

export default router;
