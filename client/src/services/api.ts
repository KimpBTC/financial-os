// ═══ API Client — Connects frontend to backend ═══

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) throw new Error(`API Error: ${res.status} ${res.statusText}`);
  return res.json();
}

export const api = {
  // Health
  health: () => request<{ status: string; timestamp: string }>('/health'),

  // Portfolio Config
  getPortfolio: () => request<any[]>('/config/portfolio'),
  addStock: (data: any) => request('/config/portfolio', { method: 'POST', body: JSON.stringify(data) }),
  updateAllocation: (id: number, allocation: number) =>
    request(`/config/portfolio/${id}`, { method: 'PUT', body: JSON.stringify({ allocation }) }),
  removeStock: (id: number) => request(`/config/portfolio/${id}`, { method: 'DELETE' }),
  getBudget: () => request<{ budget: number }>('/config/budget'),
  setBudget: (budget: number) =>
    request('/config/budget', { method: 'PUT', body: JSON.stringify({ budget }) }),

  // Market
  getMarketLatest: () => request<any>('/market/latest'),
  getMarketHistory: (range: string) => request<any[]>(`/market/history?range=${range}`),
  getMarketSignal: () => request<any>('/market/signal'),

  // Stocks
  getStockData: (ticker: string) => request<any>(`/stocks/${ticker}`),
  getStockHistory: (ticker: string, range: string) => request<any[]>(`/stocks/${ticker}/history?range=${range}`),
  getStockScores: () => request<any[]>('/stocks/scores'),

  // Dollar
  getDollarLatest: () => request<any>('/dollar/latest'),
  getDollarHistory: (range: string) => request<any[]>(`/dollar/history?range=${range}`),

  // Transactions
  getTransactions: () => request<any[]>('/transactions'),
  addTransaction: (data: any) => request('/transactions', { method: 'POST', body: JSON.stringify(data) }),

  // Snapshots
  getSnapshots: (range: string) => request<any[]>(`/snapshots?range=${range}`),
  createSnapshot: () => request('/snapshots', { method: 'POST' }),

  // Telegram
  connectTelegram: (token: string, chatId: string) =>
    request('/telegram/connect', { method: 'POST', body: JSON.stringify({ token, chatId }) }),
  testTelegram: () => request('/telegram/test', { method: 'POST' }),
  getTelegramStatus: () => request<any>('/telegram/status'),
  updateAlerts: (config: any) =>
    request('/telegram/alerts', { method: 'PUT', body: JSON.stringify(config) }),

  // Simulator
  simulate: (data: { monthly: number; returnRate: number; years: number }) =>
    request('/simulator/project', { method: 'POST', body: JSON.stringify(data) }),
};
