-- ═══════════════════════════════════════
-- FINANCIAL OS v3.0 — Database Schema
-- ═══════════════════════════════════════

-- Configuración del usuario
CREATE TABLE IF NOT EXISTS config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

INSERT OR IGNORE INTO config VALUES ('monthly_budget', '350000');
INSERT OR IGNORE INTO config VALUES ('salary_net', '1075000');
INSERT OR IGNORE INTO config VALUES ('telegram_token', '');
INSERT OR IGNORE INTO config VALUES ('telegram_chat_id', '');
INSERT OR IGNORE INTO config VALUES ('alerts_market', 'true');
INSERT OR IGNORE INTO config VALUES ('alerts_dollar', 'true');
INSERT OR IGNORE INTO config VALUES ('alerts_stocks', 'true');
INSERT OR IGNORE INTO config VALUES ('alerts_daily', 'true');

-- Portafolio dinámico
CREATE TABLE IF NOT EXISTS portfolio (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ticker TEXT NOT NULL UNIQUE,
  name TEXT,
  category TEXT DEFAULT 'Growth',
  color TEXT,
  allocation REAL DEFAULT 0,
  owned_quantity REAL DEFAULT 0,
  avg_cost_usd REAL DEFAULT 0,
  active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Seed portafolio default
INSERT OR IGNORE INTO portfolio (ticker, name, category, color, allocation, owned_quantity) VALUES
  ('IVV', 'iShares S&P 500', 'Core', '#4361ee', 50, 1.04),
  ('AAPL', 'Apple Inc.', 'Growth', '#06d6a0', 17, 0),
  ('MSFT', 'Microsoft Corp.', 'Growth', '#7209b7', 17, 0),
  ('AMZN', 'Amazon.com', 'Growth', '#f72585', 16, 0);

-- Precios históricos por ticker
CREATE TABLE IF NOT EXISTS price_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ticker TEXT NOT NULL,
  date DATE NOT NULL,
  price REAL,
  high52w REAL,
  low52w REAL,
  change_1y REAL,
  volume REAL,
  UNIQUE(ticker, date)
);

-- Dólar histórico
CREATE TABLE IF NOT EXISTS dollar_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date DATE NOT NULL UNIQUE,
  rate REAL,
  high52w REAL,
  low52w REAL,
  position_pct REAL,
  signal TEXT
);

-- Señales de mercado diarias
CREATE TABLE IF NOT EXISTS market_signals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date DATE NOT NULL UNIQUE,
  vix REAL,
  fear_greed INTEGER,
  sp500_drawdown REAL,
  market_score INTEGER,
  market_action TEXT,
  dollar_rate REAL,
  dollar_signal TEXT
);

-- Scores por acción
CREATE TABLE IF NOT EXISTS stock_scores (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date DATE NOT NULL,
  ticker TEXT NOT NULL,
  drawdown_pct REAL,
  from_low_pct REAL,
  opportunity_score INTEGER,
  recommendation TEXT,
  suggested_reweight REAL,
  UNIQUE(date, ticker)
);

-- Transacciones
CREATE TABLE IF NOT EXISTS transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date DATE NOT NULL,
  ticker TEXT NOT NULL,
  type TEXT NOT NULL,
  quantity REAL,
  price_usd REAL,
  exchange_rate REAL,
  total_clp REAL,
  context TEXT,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Snapshots mensuales
CREATE TABLE IF NOT EXISTS snapshots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  month DATE NOT NULL UNIQUE,
  total_wealth_clp INTEGER,
  total_contributions_clp INTEGER,
  net_gain_clp INTEGER,
  roi_pct REAL,
  exchange_rate REAL,
  portfolio_json TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Log de alertas enviadas (anti-spam)
CREATE TABLE IF NOT EXISTS alert_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL,
  message TEXT,
  sent_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
