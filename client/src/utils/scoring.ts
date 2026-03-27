// ═══ Scoring Engine — Motor de Decisiones ═══

export interface Stock {
  id: number;
  ticker: string;
  name: string;
  price: number;
  high52: number;
  low52: number;
  change1y: number;
  category: string;
  color: string;
  allocation: number;
  owned: number;
}

// ─── Stock Opportunity Score ───
// Formula: |Drawdown| × 2 + (100 - %SobreMínimo) × 0.3
export function calcStockScore(stock: Stock): number {
  const dd = Math.abs(((stock.price - stock.high52) / stock.high52) * 100);
  const fromLow = ((stock.price - stock.low52) / stock.low52) * 100;
  const score = Math.min(100, Math.max(0, Math.round(dd * 2 + (100 - fromLow) * 0.3)));
  return score;
}

// ─── Stock Drawdown ───
export function calcDrawdown(stock: Stock): number {
  return ((stock.price - stock.high52) / stock.high52) * 100;
}

// ─── Dollar Position in 52w Range ───
export function calcDollarPosition(current: number, low52: number, high52: number): number {
  return ((current - low52) / (high52 - low52)) * 100;
}

// ─── Market Signal from Score ───
export interface MarketSignal {
  color: string;
  label: string;
  action: string;
  multiplier: number;
}

export function getMarketSignal(score: number): MarketSignal {
  if (score >= 75) return { color: '#e63946', label: 'ALL-IN', action: 'Máximo posible', multiplier: 4 };
  if (score >= 55) return { color: '#f4a261', label: 'AGRESIVO', action: '3x DCA', multiplier: 3 };
  if (score >= 35) return { color: '#e9c46a', label: 'REFORZADO', action: '2x DCA', multiplier: 2 };
  if (score >= 15) return { color: '#4cc9f0', label: 'LEVE', action: '1.5x DCA', multiplier: 1.5 };
  return { color: '#06d6a0', label: 'NORMAL', action: 'DCA regular', multiplier: 1 };
}

// ─── Dollar Zone Signal ───
export interface DollarSignal {
  color: string;
  label: string;
  shortLabel: string;
  action: string;
}

export function getDollarSignal(rate: number): DollarSignal {
  if (rate < 860) return { color: '#06d6a0', label: '🟢 COMPRAR USD', shortLabel: 'COMPRAR', action: 'Dólar barato — adelantar inversiones' };
  if (rate < 900) return { color: '#4cc9f0', label: '🔵 BUEN PRECIO', shortLabel: 'BUENO', action: 'Buen momento — DCA + extra' };
  if (rate < 940) return { color: '#e9c46a', label: '🟡 NEUTRAL', shortLabel: 'NEUTRAL', action: 'Precio promedio — DCA regular' };
  if (rate < 980) return { color: '#f4a261', label: '🟠 CARO', shortLabel: 'CARO', action: 'Reducir compras USD' };
  return { color: '#e63946', label: '🔴 MUY CARO', shortLabel: 'MUY CARO', action: 'Esperar corrección' };
}

// ─── Recalculate DCA per stock ───
export function recalculateDCA(stocks: Stock[], totalBudget: number): (Stock & { monthlyAmount: number })[] {
  const totalAlloc = stocks.reduce((s, x) => s + x.allocation, 0);
  return stocks.map(s => ({
    ...s,
    monthlyAmount: Math.round(totalBudget * s.allocation / Math.max(totalAlloc, 1)),
  }));
}

// ─── Simulate Future Value (compound interest) ───
export function simulateGrowth(monthlyAmount: number, annualReturn: number, years: number): number {
  const r = annualReturn / 100 / 12;
  const n = years * 12;
  return Math.round(monthlyAmount * (((1 + r) ** n - 1) / r));
}

// ─── Generate suggested reweights based on scores ───
export function suggestReweights(stocks: Stock[]): { ticker: string; normalWeight: number; suggestedWeight: number }[] {
  const scores = stocks.map(s => ({ ...s, score: calcStockScore(s) }));
  const totalScore = scores.reduce((sum, s) => sum + s.score, 0);

  if (totalScore === 0) return scores.map(s => ({ ticker: s.ticker, normalWeight: s.allocation, suggestedWeight: s.allocation }));

  const totalAlloc = stocks.reduce((sum, s) => sum + s.allocation, 0);
  return scores.map(s => {
    const scoreFactor = s.score / totalScore;
    const adjustment = (scoreFactor - (1 / stocks.length)) * 20;
    const suggested = Math.max(5, Math.min(60, s.allocation + adjustment));
    return {
      ticker: s.ticker,
      normalWeight: s.allocation,
      suggestedWeight: Math.round(suggested * totalAlloc / scores.reduce((sum, sc) => sum + Math.max(5, sc.allocation + (sc.score / totalScore - 1 / stocks.length) * 20), 0)),
    };
  });
}
