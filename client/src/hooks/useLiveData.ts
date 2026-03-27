import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import type { Stock } from '../utils/scoring';

// ─── Types ───
interface MarketSignal {
  date: string;
  vix: number;
  fear_greed: number;
  sp500_drawdown: number;
  market_score: number;
  market_action: string;
  dollar_rate: number;
  dollar_signal: string;
}

interface DollarData {
  current: number;
  high52: number;
  low52: number;
}

interface LiveData {
  stocks: Stock[];
  dollar: DollarData;
  marketScore: number;
  marketSignal: MarketSignal | null;
  monthlyBudget: number;
  isLoading: boolean;
  isConnected: boolean;
  lastUpdate: string;
  error: string | null;
  setStocks: (s: Stock[]) => void;
  setMonthlyBudget: (b: number) => void;
  refreshData: () => Promise<void>;
}

// Default fallback data
const DEFAULT_STOCKS: Stock[] = [
  { id: 1, ticker: 'IVV', name: 'iShares S&P 500', price: 648.14, high52: 670, low52: 490, change1y: 13.76, category: 'Core', color: '#4361ee', allocation: 50, owned: 1.04 },
  { id: 2, ticker: 'AAPL', name: 'Apple Inc.', price: 253.74, high52: 288.62, low52: 169.21, change1y: 11.37, category: 'Growth', color: '#06d6a0', allocation: 17, owned: 0 },
  { id: 3, ticker: 'MSFT', name: 'Microsoft Corp.', price: 370.33, high52: 555.45, low52: 344.79, change1y: -8.2, category: 'Growth', color: '#7209b7', allocation: 17, owned: 0 },
  { id: 4, ticker: 'AMZN', name: 'Amazon.com', price: 210.96, high52: 258.60, low52: 161.38, change1y: 11.05, category: 'Growth', color: '#f72585', allocation: 16, owned: 0 },
];

const DEFAULT_DOLLAR: DollarData = { current: 913.83, high52: 1008.36, low52: 850.90 };

export function useLiveData(): LiveData {
  const [stocks, setStocks] = useState<Stock[]>(DEFAULT_STOCKS);
  const [dollar, setDollar] = useState<DollarData>(DEFAULT_DOLLAR);
  const [marketScore, setMarketScore] = useState(8);
  const [marketSignal, setMarketSignal] = useState<MarketSignal | null>(null);
  const [monthlyBudget, setMonthlyBudget] = useState(350000);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState('');
  const [error, setError] = useState<string | null>(null);

  const refreshData = useCallback(async () => {
    try {
      setIsLoading(true);

      // 1. Check health
      await api.health();
      setIsConnected(true);

      // 2. Fetch portfolio
      const portfolio = await api.getPortfolio();
      if (portfolio && portfolio.length > 0) {
        // Merge with price data
        const scores = await api.getStockScores().catch(() => []);
        const updatedStocks: Stock[] = portfolio.map((p: any) => {
          const scoreData = scores.find((s: any) => s.ticker === p.ticker);
          return {
            id: p.id,
            ticker: p.ticker,
            name: p.name || p.ticker,
            price: 0, // will be updated from price history
            high52: 0,
            low52: 0,
            change1y: 0,
            category: p.category || 'Growth',
            color: p.color || '#4cc9f0',
            allocation: p.allocation || 0,
            owned: p.owned_quantity || 0,
            drawdown: scoreData?.drawdown_pct,
            score: scoreData?.opportunity_score,
          };
        });

        // Fetch latest prices for each stock
        for (const stock of updatedStocks) {
          try {
            const data = await api.getStockData(stock.ticker);
            if (data.latestPrice) {
              stock.price = data.latestPrice.price || stock.price;
              stock.high52 = data.latestPrice.high52w || stock.high52;
              stock.low52 = data.latestPrice.low52w || stock.low52;
              stock.change1y = data.latestPrice.change_1y || stock.change1y;
            }
          } catch {
            // Keep default prices
          }
        }

        // Only update if we got valid prices
        const hasValidPrices = updatedStocks.some(s => s.price > 0);
        if (hasValidPrices) {
          setStocks(updatedStocks);
        } else {
          // Use portfolio config but keep default prices
          setStocks(DEFAULT_STOCKS.map(ds => {
            const pf = portfolio.find((p: any) => p.ticker === ds.ticker);
            return pf ? { ...ds, allocation: pf.allocation, owned: pf.owned_quantity || ds.owned } : ds;
          }));
        }
      }

      // 3. Fetch dollar
      const dollarData = await api.getDollarLatest();
      if (dollarData && dollarData.rate) {
        setDollar({
          current: dollarData.rate,
          high52: dollarData.high52w || DEFAULT_DOLLAR.high52,
          low52: dollarData.low52w || DEFAULT_DOLLAR.low52,
        });
      }

      // 4. Fetch market signal
      const signal = await api.getMarketLatest();
      if (signal) {
        setMarketSignal(signal);
        setMarketScore(signal.market_score || 8);
      }

      // 5. Fetch budget
      const budgetData = await api.getBudget();
      if (budgetData && budgetData.budget) {
        setMonthlyBudget(budgetData.budget);
      }

      setLastUpdate(new Date().toLocaleTimeString('es-CL'));
      setError(null);
    } catch (e: any) {
      console.log('API not available, using local data:', e.message);
      setIsConnected(false);
      setError('Backend no conectado — usando datos locales');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    refreshData();
    const interval = setInterval(refreshData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [refreshData]);

  // Persist budget changes to backend
  const handleSetBudget = useCallback(async (budget: number) => {
    setMonthlyBudget(budget);
    try {
      await api.setBudget(budget);
    } catch {
      // Offline — keep local state
    }
  }, []);

  return {
    stocks, dollar, marketScore, marketSignal, monthlyBudget,
    isLoading, isConnected, lastUpdate, error,
    setStocks, setMonthlyBudget: handleSetBudget, refreshData,
  };
}
