import db from '../db/database';

// ─── Data Service: Fetches market data from Yahoo Finance ───

interface StockData {
  ticker: string;
  price: number;
  high52w: number;
  low52w: number;
  change1y: number;
}

// Fetch stock data from Yahoo Finance
export async function fetchStockData(ticker: string): Promise<StockData | null> {
  try {
    const { default: YahooFinance } = await import('yahoo-finance2');
    const yahooFinance = new (YahooFinance as any)();
    const quote = await yahooFinance.quote(ticker);
    return {
      ticker,
      price: quote.regularMarketPrice || 0,
      high52w: quote.fiftyTwoWeekHigh || 0,
      low52w: quote.fiftyTwoWeekLow || 0,
      change1y: quote.fiftyTwoWeekChangePercent ? quote.fiftyTwoWeekChangePercent * 100 : 0,
    };
  } catch (e: any) {
    console.error(`Error fetching ${ticker}:`, e.message);
    return null;
  }
}

// Fetch VIX from Yahoo Finance (^VIX)
export async function fetchVIX(): Promise<number | null> {
  try {
    const { default: YahooFinance } = await import('yahoo-finance2');
    const yahooFinance = new (YahooFinance as any)();
    const quote = await yahooFinance.quote('^VIX');
    return quote.regularMarketPrice || null;
  } catch (e: any) {
    console.error('Error fetching VIX:', e.message);
    return null;
  }
}

// Fetch Fear & Greed Index from alternative.me (free, no auth)
export async function fetchFearGreed(): Promise<number | null> {
  try {
    const res = await fetch('https://api.alternative.me/fng/?limit=1&format=json');
    if (!res.ok) return null;
    const data = await res.json() as any;
    const value = parseInt(data?.data?.[0]?.value);
    return isNaN(value) ? null : value;
  } catch (e: any) {
    console.error('Error fetching Fear & Greed:', e.message);
    return null;
  }
}

// Fetch USD/CLP exchange rate
export async function fetchDollarRate(): Promise<{ rate: number; high52w: number; low52w: number } | null> {
  try {
    const { default: YahooFinance } = await import('yahoo-finance2');
    const yahooFinance = new (YahooFinance as any)();
    const quote = await yahooFinance.quote('USDCLP=X');
    return {
      rate: quote.regularMarketPrice || 913.83,
      high52w: quote.fiftyTwoWeekHigh || 1008.36,
      low52w: quote.fiftyTwoWeekLow || 850.90,
    };
  } catch (e: any) {
    console.error('Error fetching USD/CLP:', e.message);
    return null;
  }
}

// Score calculation
function calcStockScore(price: number, high52w: number, low52w: number): number {
  const dd = Math.abs(((price - high52w) / high52w) * 100);
  const fl = ((price - low52w) / low52w) * 100;
  return Math.min(100, Math.max(0, Math.round(dd * 2 + (100 - fl) * 0.3)));
}

function calcMarketScore(sp500dd: number, vix: number, fearGreed: number, dollarPos: number): number {
  let score = 0;
  // SP500 drawdown (0-40 points)
  if (sp500dd <= -20) score += 40;
  else if (sp500dd <= -10) score += 25;
  else if (sp500dd <= -5) score += 10;
  // VIX (0-25 points)
  if (vix >= 35) score += 25;
  else if (vix >= 25) score += 15;
  else if (vix >= 20) score += 5;
  // Fear & Greed (0-20 points)
  if (fearGreed <= 20) score += 20;
  else if (fearGreed <= 35) score += 10;
  // Dollar position bonus (0-15 points)
  if (dollarPos < 20) score += 15;
  else if (dollarPos < 40) score += 5;
  return Math.min(100, score);
}

// Full data pipeline
export async function runDataPipeline(): Promise<void> {
  console.log('📊 Running data pipeline...');
  const today = new Date().toISOString().split('T')[0];

  // 1. Fetch all portfolio stocks
  const stocks = db.prepare('SELECT ticker FROM portfolio WHERE active = 1').all() as any[];

  // 2. Fetch prices
  for (const { ticker } of stocks) {
    const data = await fetchStockData(ticker);
    if (data) {
      db.prepare(`
        INSERT OR REPLACE INTO price_history (ticker, date, price, high52w, low52w, change_1y)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(ticker, today, data.price, data.high52w, data.low52w, data.change1y);

      // Save score
      const score = calcStockScore(data.price, data.high52w, data.low52w);
      const dd = ((data.price - data.high52w) / data.high52w) * 100;
      const fl = ((data.price - data.low52w) / data.low52w) * 100;
      const rec = score > 60 ? 'COMPRAR AGRESIVO' : score > 40 ? 'REFORZAR' : score > 20 ? 'DCA NORMAL' : 'MANTENER';

      db.prepare(`
        INSERT OR REPLACE INTO stock_scores (date, ticker, drawdown_pct, from_low_pct, opportunity_score, recommendation)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(today, ticker, dd, fl, score, rec);
    }
  }

  // 3. Fetch dollar
  const dollar = await fetchDollarRate();
  if (dollar) {
    const dollarPos = ((dollar.rate - dollar.low52w) / (dollar.high52w - dollar.low52w)) * 100;
    let dollarSignal = 'NEUTRAL';
    if (dollar.rate < 860) dollarSignal = 'BUY_AGGRESSIVE';
    else if (dollar.rate < 900) dollarSignal = 'GOOD';
    else if (dollar.rate < 940) dollarSignal = 'NEUTRAL';
    else if (dollar.rate < 980) dollarSignal = 'EXPENSIVE';
    else dollarSignal = 'VERY_EXPENSIVE';

    db.prepare(`
      INSERT OR REPLACE INTO dollar_history (date, rate, high52w, low52w, position_pct, signal)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(today, dollar.rate, dollar.high52w, dollar.low52w, dollarPos, dollarSignal);

    // 4. Fetch VIX, Fear & Greed and SP500 drawdown in parallel
    const [sp500Data, vixValue, fngValue] = await Promise.all([
      fetchStockData('SPY'),
      fetchVIX(),
      fetchFearGreed(),
    ]);
    const sp500dd = sp500Data ? ((sp500Data.price - sp500Data.high52w) / sp500Data.high52w) * 100 : -3;

    // Fallback to last saved value if fetch fails
    const lastSignal = db.prepare('SELECT vix, fear_greed FROM market_signals ORDER BY date DESC LIMIT 1').get() as any;
    const vix = vixValue ?? lastSignal?.vix ?? 18;
    const fearGreed = fngValue ?? lastSignal?.fear_greed ?? 50;

    const marketScore = calcMarketScore(sp500dd, vix, fearGreed, dollarPos);

    let marketAction = 'NORMAL';
    if (marketScore >= 75) marketAction = 'ALL_IN';
    else if (marketScore >= 55) marketAction = 'AGGRESSIVE';
    else if (marketScore >= 35) marketAction = 'REINFORCED';
    else if (marketScore >= 15) marketAction = 'SLIGHT';

    db.prepare(`
      INSERT OR REPLACE INTO market_signals (date, vix, fear_greed, sp500_drawdown, market_score, market_action, dollar_rate, dollar_signal)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(today, vix, fearGreed, sp500dd, marketScore, marketAction, dollar.rate, dollarSignal);
  }

  console.log('✅ Data pipeline complete');
}
