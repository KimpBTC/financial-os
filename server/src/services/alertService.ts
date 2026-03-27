import db from '../db/database';

// ─── Alert Service: Telegram Bot Notifications ───

class AlertService {
  private bot: any;
  private chatId: string;
  private connected: boolean = false;

  constructor() {
    this.chatId = '';
    this.loadConfig();
  }

  loadConfig() {
    const token = (db.prepare("SELECT value FROM config WHERE key = 'telegram_token'").get() as any)?.value;
    this.chatId = (db.prepare("SELECT value FROM config WHERE key = 'telegram_chat_id'").get() as any)?.value || '';

    if (token && this.chatId) {
      try {
        const TelegramBot = require('node-telegram-bot-api');
        this.bot = new TelegramBot(token, { polling: false });
        this.connected = true;
        console.log('🤖 Telegram bot connected');
      } catch (e: any) {
        console.log('⚠️ Telegram bot not connected:', e.message);
      }
    }
  }

  isConnected(): boolean { return this.connected; }

  private isAlertEnabled(type: string): boolean {
    const val = (db.prepare(`SELECT value FROM config WHERE key = 'alerts_${type}'`).get() as any)?.value;
    return val === 'true';
  }

  private wasRecentlySent(type: string, hours: number = 24): boolean {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
    const row = db.prepare('SELECT id FROM alert_log WHERE type = ? AND sent_at > ?').get(type, cutoff);
    return !!row;
  }

  private async send(type: string, message: string) {
    if (!this.connected || !this.bot) return;
    try {
      await this.bot.sendMessage(this.chatId, message, { parse_mode: 'Markdown' });
      db.prepare('INSERT INTO alert_log (type, message) VALUES (?, ?)').run(type, message);
      console.log(`📨 Alert sent: ${type}`);
    } catch (e: any) {
      console.error('AlertService error:', e.message);
    }
  }

  // Daily Summary at 18:00
  async sendDailySummary() {
    if (!this.isAlertEnabled('daily')) return;

    const stocks = db.prepare('SELECT p.*, ph.price, ph.high52w, ph.low52w, ph.change_1y FROM portfolio p LEFT JOIN price_history ph ON p.ticker = ph.ticker AND ph.date = (SELECT MAX(date) FROM price_history WHERE ticker = p.ticker) WHERE p.active = 1').all() as any[];
    const signal = db.prepare('SELECT * FROM market_signals ORDER BY date DESC LIMIT 1').get() as any;
    const dollar = db.prepare('SELECT * FROM dollar_history ORDER BY date DESC LIMIT 1').get() as any;
    const budget = parseInt((db.prepare("SELECT value FROM config WHERE key = 'monthly_budget'").get() as any)?.value || '350000');

    const dollarRate = dollar?.rate || 913;
    const totalWealth = stocks.reduce((s: number, x: any) => s + (x.owned_quantity || 0) * (x.price || 0) * dollarRate, 0) + 150000;
    const marketScore = signal?.market_score || 8;

    let actionText = 'Invierte tu monto mensual como siempre';
    if (marketScore >= 55) actionText = '¡Gran oportunidad! Invierte más de lo normal';
    else if (marketScore >= 35) actionText = 'Buen momento — podrías invertir el doble';
    else if (marketScore >= 15) actionText = 'Invierte un poco más que lo normal';

    let dollarLabel = 'precio normal';
    if (dollarRate < 860) dollarLabel = '¡barato!';
    else if (dollarRate < 900) dollarLabel = 'buen precio';
    else if (dollarRate > 940) dollarLabel = 'caro';
    else if (dollarRate > 980) dollarLabel = '¡muy caro!';

    let msg = `📊 *Tu Resumen Financiero — ${new Date().toLocaleDateString('es-CL')}*\n\n`;
    msg += `💰 Tu portafolio vale: $${Math.round(totalWealth).toLocaleString('es-CL')}\n`;
    msg += `💵 Dólar hoy: $${dollarRate.toFixed(0)} (${dollarLabel})\n`;
    msg += `🌡️ Mercado: ${marketScore}/100\n\n`;
    msg += `📈 *Tus acciones hoy:*\n`;

    for (const s of stocks) {
      if (!s.price) continue;
      const dd = Math.abs(((s.price - (s.high52w || s.price)) / (s.high52w || s.price)) * 100);
      let comment = 'estable';
      if (dd > 25) comment = `¡${dd.toFixed(0)}% más barata — gran oportunidad!`;
      else if (dd > 15) comment = `${dd.toFixed(0)}% bajo máximo`;
      else if (dd > 5) comment = `${dd.toFixed(0)}% bajo máximo — normal`;
      msg += `  ${s.ticker}: US$${s.price.toFixed(2)} — ${comment}\n`;
    }

    msg += `\n✅ *¿Qué hacer?* ${actionText}\n`;
    msg += `💡 DCA: $${budget.toLocaleString('es-CL')}/mes`;

    await this.send('daily', msg);
  }

  // Market Alert
  async checkMarketAlert() {
    if (!this.isAlertEnabled('market')) return;
    if (this.wasRecentlySent('market', 8)) return;

    const signal = db.prepare('SELECT * FROM market_signals ORDER BY date DESC LIMIT 1').get() as any;
    if (!signal || signal.market_score < 15) return;

    let label = 'LEVE OPORTUNIDAD';
    if (signal.market_score >= 75) label = '¡GRAN OPORTUNIDAD!';
    else if (signal.market_score >= 55) label = 'BUENA OPORTUNIDAD';
    else if (signal.market_score >= 35) label = 'OPORTUNIDAD MODERADA';

    const msg = `🌡️ *ALERTA DE MERCADO*\n\n` +
      `Score: ${signal.market_score}/100\n` +
      `${label}\n\n` +
      `El mercado ha bajado — puede ser buen momento para invertir más de lo normal.`;

    await this.send('market', msg);
  }

  // Dollar Alert
  async checkDollarAlert() {
    if (!this.isAlertEnabled('dollar')) return;
    if (this.wasRecentlySent('dollar', 12)) return;

    const dollar = db.prepare('SELECT * FROM dollar_history ORDER BY date DESC LIMIT 1').get() as any;
    if (!dollar) return;

    if (dollar.signal === 'BUY_AGGRESSIVE') {
      await this.send('dollar', `💵 *¡DÓLAR BARATO!*\n\nUSD/CLP: $${dollar.rate.toFixed(0)}\nCerca de mínimos del año\n\n→ ¡Buen momento para comprar dólares e invertir!`);
    } else if (dollar.signal === 'VERY_EXPENSIVE') {
      await this.send('dollar', `💵 *DÓLAR MUY CARO*\n\nUSD/CLP: $${dollar.rate.toFixed(0)}\nCerca de máximos del año\n\n→ Mejor esperar a que baje antes de invertir.`);
    }
  }

  // Stock Alerts (score > 60)
  async checkStockAlerts() {
    if (!this.isAlertEnabled('stocks')) return;

    const today = new Date().toISOString().split('T')[0];
    const scores = db.prepare('SELECT * FROM stock_scores WHERE date = ? AND opportunity_score > 60').all(today) as any[];

    for (const s of scores) {
      if (this.wasRecentlySent(`stock_${s.ticker}`, 24)) continue;

      const msg = `📊 *${s.ticker}: ¡Gran oportunidad!*\n\n` +
        `Score: ${s.opportunity_score}/100\n` +
        `Caída: ${s.drawdown_pct.toFixed(1)}%\n\n` +
        `Esta acción está mucho más barata que su precio máximo.\n→ Podrías poner más dinero aquí este mes.`;

      await this.send(`stock_${s.ticker}`, msg);
    }
  }

  // Run all alerts
  async runAllAlerts() {
    this.loadConfig(); // Reload in case config changed
    if (!this.connected) return;
    await this.checkMarketAlert();
    await this.checkDollarAlert();
    await this.checkStockAlerts();
  }
}

export const alertService = new AlertService();
