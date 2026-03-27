import { Router } from 'express';
import db from '../db/database';

const router = Router();

// POST /api/telegram/connect
router.post('/connect', (req, res) => {
  const { token, chatId } = req.body;
  db.prepare("UPDATE config SET value = ? WHERE key = 'telegram_token'").run(token);
  db.prepare("UPDATE config SET value = ? WHERE key = 'telegram_chat_id'").run(chatId);
  res.json({ success: true, connected: true });
});

// POST /api/telegram/test
router.post('/test', async (_req, res) => {
  const token = (db.prepare("SELECT value FROM config WHERE key = 'telegram_token'").get() as any)?.value;
  const chatId = (db.prepare("SELECT value FROM config WHERE key = 'telegram_chat_id'").get() as any)?.value;

  if (!token || !chatId) {
    return res.status(400).json({ error: 'Bot not configured' });
  }

  try {
    const TelegramBot = require('node-telegram-bot-api');
    const bot = new TelegramBot(token, { polling: false });
    await bot.sendMessage(chatId, '✅ Financial OS conectado correctamente.\n\n🤖 Recibirás alertas y resúmenes diarios aquí.');
    res.json({ success: true, sent: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/telegram/status
router.get('/status', (_req, res) => {
  const token = (db.prepare("SELECT value FROM config WHERE key = 'telegram_token'").get() as any)?.value;
  const chatId = (db.prepare("SELECT value FROM config WHERE key = 'telegram_chat_id'").get() as any)?.value;
  res.json({ connected: !!(token && chatId), token: token ? '***' : '', chatId: chatId ? '***' : '' });
});

// PUT /api/telegram/alerts
router.put('/alerts', (req, res) => {
  const { market, dollar, stocks, daily } = req.body;
  if (market !== undefined) db.prepare("UPDATE config SET value = ? WHERE key = 'alerts_market'").run(String(market));
  if (dollar !== undefined) db.prepare("UPDATE config SET value = ? WHERE key = 'alerts_dollar'").run(String(dollar));
  if (stocks !== undefined) db.prepare("UPDATE config SET value = ? WHERE key = 'alerts_stocks'").run(String(stocks));
  if (daily !== undefined) db.prepare("UPDATE config SET value = ? WHERE key = 'alerts_daily'").run(String(daily));
  res.json({ success: true });
});

export default router;
