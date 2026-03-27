# PROMPT CLAUDE CODE v3.0 — FINAL
## Financial OS: Portafolio Dinámico + Alertas Dólar + Bot Telegram

---

## INSTRUCCIÓN

Construir un **Financial OS completo** — aplicación web full-stack para un inversionista chileno en Fintual. El sistema debe ser dinámico: el usuario puede agregar/remover activos, cambiar montos y porcentajes, y todo se recalcula en tiempo real. Incluir integración con Telegram para alertas y resúmenes diarios.

---

## CONTEXTO

```yaml
perfil:
  pais: Chile
  moneda: CLP
  sueldo_liquido: 1075000
  plataforma: Fintual
  apv: desactivado por 5 años
  
portafolio_default:
  - { ticker: IVV, name: "iShares S&P 500", allocation: 50, category: Core }
  - { ticker: AAPL, name: "Apple Inc.", allocation: 17, category: Growth }
  - { ticker: MSFT, name: "Microsoft Corp.", allocation: 17, category: Growth }
  - { ticker: AMZN, name: "Amazon.com", allocation: 16, category: Growth }

presupuesto_mensual_default: 350000
```

---

## STACK

```yaml
frontend: React 18+ TypeScript, Tailwind, Recharts
backend: Node.js + Express, SQLite (o Supabase gratis)
data: yahoo-finance2 (npm), exchangerate-api, CNN Fear & Greed scraping
telegram: node-telegram-bot-api (npm)
cron: node-cron
deploy: Vercel + Railway (o Docker)
```

---

## 6 TABS PRINCIPALES

### TAB 1: DASHBOARD
- 4 KPIs: Patrimonio total, DCA mensual (dinámico según config), Dólar + zona, Señal mercado
- Gráfico evolución patrimonial con **selector de rango: 1S, 1M, 3M, 6M, 1A, 5A**
- Señal de mercado (gauge 0-100)
- Pie de asignación (se actualiza dinámicamente al cambiar config)
- Cards compactas por cada activo (se generan dinámicamente según portafolio)
- DCA mensual desglosado (barras por activo, montos calculados desde config)
- Progreso de metas

### TAB 2: ACCIONES (dinámico)
- **Se genera dinámicamente según los activos configurados**
- Cada activo tiene: card expandida con gráfico de precio + **selector de rango temporal**
- Datos: precio, drawdown, máx/mín 52sem, score de oportunidad
- Tabla de scoring con redistribución sugerida del DCA
- Botones de acción rápida (generados dinámicamente por activo)

### TAB 3: DÓLAR
- Gauge visual USD/CLP con posición en rango 52 semanas
- Gráfico histórico con **selector de rango: 1S, 1M, 3M, 6M, 1A, 5A**
- Variaciones vs ayer/semana/mes
- Impacto en portafolio (simulación si dólar sube/baja)
- Tabla de zonas de alerta

### TAB 4: SIMULADOR
- 3 sliders: aporte mensual, retorno anual, horizonte
- Gráfico proyección base vs optimista vs aportes
- Milestones calculados dinámicamente

### TAB 5: CONFIGURACIÓN (NUEVO)

```
SECCIÓN 1 — Aporte mensual:
├── Slider + input: monto DCA total (50K - 800K CLP)
├── Mostrar: % del sueldo líquido, disponible para gastos
└── Se propaga a todas las tabs automáticamente

SECCIÓN 2 — Gestión de portafolio:
├── Tabla editable con todos los activos actuales:
│   ├── Ticker | Nombre | Categoría | Precio | Asignación % | DCA/mes | [Eliminar]
│   └── Inputs editables inline para asignación %
├── Barra visual de asignación (colores por activo)
├── Warning si total ≠ 100%
└── El DCA por activo = (monthlyBudget × allocation%) / totalAllocation

SECCIÓN 3 — Agregar nuevo activo:
├── Campos: Ticker*, Nombre, Categoría (select), Precio USD*, Asignación %
├── Botón "Agregar"
├── Al agregar: se asigna color automático, aparece en todas las tabs
└── Nota: "Ajusta los porcentajes para que sumen 100%"

SECCIÓN 4 — Presets rápidos:
├── "Solo IVV (100%)"
├── "IVV + Big Tech" (50/17/17/16)
├── "Diversificado" (40/12/12/12/12/12)
└── Click → reemplaza portafolio y redistribuye
```

**Lógica de propagación:**
```javascript
// Cuando cambia el presupuesto o las asignaciones:
function recalculateDCA(stocks, totalBudget) {
  const totalAlloc = stocks.reduce((s, x) => s + x.allocation, 0);
  return stocks.map(s => ({
    ...s,
    monthlyAmount: Math.round(totalBudget * s.allocation / Math.max(totalAlloc, 1)),
  }));
}

// Agregar activo:
function addStock(portfolio, newStock) {
  const id = Math.max(...portfolio.map(s => s.id)) + 1;
  const color = COLORS[id % COLORS.length];
  return [...portfolio, { ...newStock, id, color, owned: 0 }];
}

// Toda la app consume el estado global del portafolio.
// Cambios en config → recalcula DCA → actualiza dashboard, acciones, simulador.
```

### TAB 6: TELEGRAM (NUEVO)

```
SECCIÓN 1 — Conexión:
├── Input: Bot Token
├── Input: Chat ID
├── Botón "Conectar"
├── Botón "Enviar Test" (envía mensaje de prueba al bot)
├── Estado: 🟢 Conectado / 🔴 Desconectado
└── Instrucciones paso a paso para crear bot con @BotFather

SECCIÓN 2 — Configuración de alertas (toggles on/off):
├── 🌡️ Alertas de mercado: cuando scoring >15/100
├── 💵 Alertas de dólar: cuando entra en zona compra/máximos
├── 📊 Alertas por acción: cuando score individual >60
└── 📋 Resumen diario: 18:00 post-cierre de mercado

SECCIÓN 3 — Vista previa de mensajes:
├── Preview del resumen diario (formato Markdown para Telegram)
├── Preview de cada tipo de alerta
└── Ejemplos reales con datos actuales
```

**Backend Telegram (implementar):**
```javascript
const TelegramBot = require('node-telegram-bot-api');

class AlertService {
  constructor(token, chatId) {
    this.bot = new TelegramBot(token, { polling: false });
    this.chatId = chatId;
  }

  // Resumen diario — 18:00 cada día hábil
  async sendDailySummary(data) {
    const { stocks, marketScore, dollarRate, dollarSignal, totalWealth, monthlyBudget } = data;
    
    let msg = `📊 *FINANCIAL OS — Resumen ${new Date().toLocaleDateString('es-CL')}*\n\n`;
    msg += `💰 Patrimonio: ${formatCLP(totalWealth)}\n`;
    msg += `💵 USD/CLP: $${dollarRate.toFixed(0)} ${dollarSignal.label}\n`;
    msg += `🌡️ Señal: ${marketScore.total}/100 — ${marketScore.action.text}\n\n`;
    msg += `📈 *Precios del día:*\n`;
    stocks.forEach(s => {
      const dd = ((s.price - s.high52) / s.high52 * 100).toFixed(1);
      msg += `  ${s.ticker}: US$${s.price.toFixed(2)} (DD: ${dd}%)\n`;
    });
    msg += `\n✅ *Acción:* ${marketScore.action.text} — DCA ${formatCLP(monthlyBudget)}`;
    
    await this.bot.sendMessage(this.chatId, msg, { parse_mode: 'Markdown' });
  }

  // Alerta de mercado
  async sendMarketAlert(score) {
    const msg = `🌡️ *ALERTA DE MERCADO*\n\n` +
      `Score: ${score.total}/100\n` +
      `Drawdown: ${score.breakdown.dd.toFixed(1)}%\n` +
      `VIX: ${score.breakdown.vix}\n\n` +
      `→ *${score.action.text}*`;
    await this.bot.sendMessage(this.chatId, msg, { parse_mode: 'Markdown' });
  }

  // Alerta de dólar
  async sendDollarAlert(signal) {
    const msg = `💵 *ALERTA DE DÓLAR*\n\n` +
      `USD/CLP: $${signal.rate.toFixed(0)}\n` +
      `Posición: ${signal.position.toFixed(0)}% del rango 52sem\n` +
      `Zona: ${signal.label}\n\n` +
      `→ *${signal.action}*`;
    await this.bot.sendMessage(this.chatId, msg, { parse_mode: 'Markdown' });
  }

  // Alerta por acción individual
  async sendStockAlert(stock) {
    const dd = ((stock.price - stock.high52) / stock.high52 * 100).toFixed(1);
    const msg = `📊 *ALERTA: ${stock.ticker}*\n\n` +
      `Score: ${stock.score}/100\n` +
      `Precio: US$${stock.price.toFixed(2)}\n` +
      `Drawdown: ${dd}%\n` +
      `Máx 52s: US$${stock.high52} | Mín: US$${stock.low52}\n\n` +
      `→ *${stock.recommendation.text}*`;
    await this.bot.sendMessage(this.chatId, msg, { parse_mode: 'Markdown' });
  }

  async sendTest() {
    await this.bot.sendMessage(this.chatId, '✅ Financial OS conectado correctamente.');
  }
}
```

**Cron Jobs (node-cron):**
```javascript
const cron = require('node-cron');

// Datos de mercado: cada 4 horas en días hábiles (L-V, 10-22 hora Chile)
cron.schedule('0 10,14,18,22 * * 1-5', async () => {
  await dailyDataPipeline();
});

// Resumen diario: 18:00 L-V
cron.schedule('0 18 * * 1-5', async () => {
  if (alertConfig.daily) await alertService.sendDailySummary(getCurrentData());
});

// Check alertas: cada hora en horario de mercado
cron.schedule('0 10-22 * * 1-5', async () => {
  const data = await getLatestData();
  if (alertConfig.market && data.marketScore.total >= 15) {
    await alertService.sendMarketAlert(data.marketScore);
  }
  if (alertConfig.dollar && (data.dollarSignal.zone === 'BUY_AGGRESSIVE' || data.dollarSignal.zone === 'VERY_EXPENSIVE')) {
    await alertService.sendDollarAlert(data.dollarSignal);
  }
  if (alertConfig.stocks) {
    data.stockScores.filter(s => s.score > 60).forEach(async s => {
      await alertService.sendStockAlert(s);
    });
  }
});
```

---

## TIME RANGE SELECTOR (aplicar a todos los gráficos)

```javascript
// Rangos disponibles: 1S, 1M, 3M, 6M, 1A, 5A
const RANGES = {
  '1S': { days: 5, label: 'Semana', interval: 'daily' },
  '1M': { days: 22, label: 'Mes', interval: 'daily' },
  '3M': { days: 66, label: '3 Meses', interval: 'daily' },
  '6M': { days: 132, label: '6 Meses', interval: 'weekly' },
  '1A': { days: 252, label: '1 Año', interval: 'weekly' },
  '5A': { days: 1260, label: '5 Años', interval: 'monthly' },
};

// Aplicar en:
// - Gráfico de evolución patrimonial (Dashboard)
// - Gráfico de precio por acción (Tab Acciones)
// - Gráfico USD/CLP (Tab Dólar)
// - Cada gráfico tiene su propio selector de rango independiente
```

---

## API ENDPOINTS

```yaml
# Portfolio config (persiste en DB)
GET    /api/config/portfolio          # Todos los activos + asignaciones
POST   /api/config/portfolio          # Agregar activo
PUT    /api/config/portfolio/:id      # Editar asignación
DELETE /api/config/portfolio/:id      # Eliminar activo
PUT    /api/config/budget             # Cambiar presupuesto mensual

# Market data
GET    /api/market/latest             # Último dato de mercado
GET    /api/market/history?range=1M   # Histórico por rango
GET    /api/market/signal             # Score actual de mercado

# Stock data
GET    /api/stocks/:ticker            # Datos de un ticker
GET    /api/stocks/:ticker/history?range=1M  # Histórico de precio
GET    /api/stocks/scores             # Scores de oportunidad de todos

# Dollar
GET    /api/dollar/latest             # Dólar actual + señal
GET    /api/dollar/history?range=1M   # Histórico USD/CLP

# Transactions
GET    /api/transactions              # Historial
POST   /api/transactions              # Registrar nueva

# Snapshots
GET    /api/snapshots?range=6M        # Snapshots mensuales
POST   /api/snapshots                 # Crear snapshot

# Telegram
POST   /api/telegram/connect          # Conectar bot (token + chatId)
POST   /api/telegram/test             # Enviar mensaje de prueba
PUT    /api/telegram/alerts           # Configurar alertas (on/off)
GET    /api/telegram/status           # Estado de conexión

# Simulator
POST   /api/simulator/project         # Calcular proyección
```

---

## SCHEMA SQL COMPLETO

```sql
-- Configuración del usuario
CREATE TABLE config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
-- INSERT INTO config VALUES ('monthly_budget', '350000');
-- INSERT INTO config VALUES ('telegram_token', '');
-- INSERT INTO config VALUES ('telegram_chat_id', '');
-- INSERT INTO config VALUES ('alerts_market', 'true');
-- INSERT INTO config VALUES ('alerts_dollar', 'true');
-- INSERT INTO config VALUES ('alerts_stocks', 'true');
-- INSERT INTO config VALUES ('alerts_daily', 'true');

-- Portafolio dinámico
CREATE TABLE portfolio (
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

-- Precios históricos por ticker
CREATE TABLE price_history (
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
CREATE TABLE dollar_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date DATE NOT NULL UNIQUE,
  rate REAL,
  high52w REAL,
  low52w REAL,
  position_pct REAL,
  signal TEXT
);

-- Señales de mercado diarias
CREATE TABLE market_signals (
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
CREATE TABLE stock_scores (
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
CREATE TABLE transactions (
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
CREATE TABLE snapshots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  month DATE NOT NULL UNIQUE,
  total_wealth_clp INTEGER,
  total_contributions_clp INTEGER,
  net_gain_clp INTEGER,
  roi_pct REAL,
  exchange_rate REAL,
  portfolio_json TEXT,  -- JSON con desglose por ticker
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Log de alertas enviadas
CREATE TABLE alert_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL,     -- 'market' | 'dollar' | 'stock' | 'daily'
  message TEXT,
  sent_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

---

## UX/UI

```yaml
diseño: Dark terminal financiero
paleta:
  bg: "#020617"
  card: "#0f172a"
  border: "#1e293b"
  text: "#f1f5f9"
  dim: "#64748b"
  colores_activos: ["#4361ee","#06d6a0","#7209b7","#f72585","#e9c46a","#f4a261","#4cc9f0","#e63946"]
tipografia: JetBrains Mono (números), DM Sans (texto)
responsive: mobile-first
time_ranges: [1S, 1M, 3M, 6M, 1A, 5A] en todos los gráficos
```

---

## NOTAS FINALES

1. **Dinámico**: todo se recalcula cuando el usuario cambia presupuesto, porcentajes o activos
2. **Sin APV**: 100% en acciones vía Fintual
3. **Telegram obligatorio**: resumen diario + 3 tipos de alertas (mercado, dólar, stocks)
4. **Time ranges en todos los gráficos**: selector 1S/1M/3M/6M/1A/5A
5. **Gratuito**: yahoo-finance2 + exchangerate-api + node-telegram-bot-api
6. **Fintual sin API**: datos del portafolio se ingresan manualmente o por config
7. **Estado persiste**: config, portafolio, alertas y transacciones se guardan en SQLite
