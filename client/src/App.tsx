import { useState } from 'react';
import './styles/index.css';
import DashboardTab from './components/dashboard/DashboardTab';
import StocksTab from './components/stocks/StocksTab';
import DollarTab from './components/dollar/DollarTab';
import SimulatorTab from './components/simulator/SimulatorTab';
import ConfigTab from './components/config/ConfigTab';
import TelegramTab from './components/telegram/TelegramTab';
import type { Stock } from './utils/scoring';
import { getDollarSignal } from './utils/scoring';
import { GLOSSARY } from './utils/explanations';

// ─── Default Data ───
const DEFAULT_STOCKS: Stock[] = [
  { id: 1, ticker: 'IVV', name: 'iShares S&P 500', price: 648.14, high52: 670, low52: 490, change1y: 13.76, category: 'Core', color: '#4361ee', allocation: 50, owned: 1.04 },
  { id: 2, ticker: 'AAPL', name: 'Apple Inc.', price: 253.74, high52: 288.62, low52: 169.21, change1y: 11.37, category: 'Growth', color: '#06d6a0', allocation: 17, owned: 0 },
  { id: 3, ticker: 'MSFT', name: 'Microsoft Corp.', price: 370.33, high52: 555.45, low52: 344.79, change1y: -8.2, category: 'Growth', color: '#7209b7', allocation: 17, owned: 0 },
  { id: 4, ticker: 'AMZN', name: 'Amazon.com', price: 210.96, high52: 258.60, low52: 161.38, change1y: 11.05, category: 'Growth', color: '#f72585', allocation: 16, owned: 0 },
];

const DOLLAR = { current: 913.83, high52: 1008.36, low52: 850.90 };
const TABS = ['Dashboard', 'Acciones', 'Dólar', 'Simulador', 'Configuración', 'Telegram'];

function App() {
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [stocks, setStocks] = useState<Stock[]>(DEFAULT_STOCKS);
  const [monthlyBudget, setMonthlyBudget] = useState(350000);
  const [showGlossary, setShowGlossary] = useState(false);

  const marketScore = 8; // Will be dynamic in Phase 4
  const dZone = getDollarSignal(DOLLAR.current);

  return (
    <div className="app-container">
      {/* ═══ HEADER ═══ */}
      <header className="header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="header-logo">F</div>
          <div>
            <div className="font-mono" style={{ fontWeight: 800, fontSize: 13, letterSpacing: 2 }}>FINANCIAL OS</div>
            <div style={{ fontSize: 8, color: 'var(--text-faint)', letterSpacing: 1 }}>
              FINTUAL · {stocks.length} ACTIVOS · DCA ${monthlyBudget.toLocaleString('es-CL')}/MES
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span className="font-mono" style={{ fontSize: 9, color: 'var(--text-dim)' }}>USD/CLP</span>
            <span className="font-mono" style={{ fontSize: 11, fontWeight: 700, color: dZone.color }}>${DOLLAR.current}</span>
          </div>
          <div style={{ width: 1, height: 14, background: 'var(--border-primary)' }} />
          <button onClick={() => setShowGlossary(!showGlossary)}
            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-primary)', borderRadius: 6, padding: '3px 8px', color: 'var(--text-dim)', fontSize: 10, cursor: 'pointer' }}>
            📖 Glosario
          </button>
          <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--color-success)', boxShadow: '0 0 6px var(--color-success)' }} />
          <span className="font-mono" style={{ fontSize: 8, color: 'var(--text-faint)' }}>
            {new Date().toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()}
          </span>
        </div>
      </header>

      {/* ═══ GLOSSARY PANEL ═══ */}
      {showGlossary && (
        <div style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border-primary)', padding: '12px 16px', maxHeight: 300, overflowY: 'auto', animation: 'slideDown 0.2s ease' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)' }}>📖 Glosario — Términos en lenguaje simple</span>
            <button onClick={() => setShowGlossary(false)} style={{ background: 'none', border: 'none', color: 'var(--text-dim)', fontSize: 16, cursor: 'pointer' }}>✕</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 8 }}>
            {Object.entries(GLOSSARY).map(([term, def]) => (
              <div key={term} style={{ background: 'var(--bg-primary)', borderRadius: 8, padding: '8px 10px' }}>
                <div className="font-mono" style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent-blue)', marginBottom: 2 }}>{term}</div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', lineHeight: 1.5 }}>{def}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══ TABS ═══ */}
      <nav className="tabs-container">
        {TABS.map(t => (
          <button key={t} className={`tab-button ${activeTab === t ? 'active' : ''}`} onClick={() => setActiveTab(t)}>
            {t === 'Telegram' ? '🤖 Telegram' : t}
          </button>
        ))}
      </nav>

      {/* ═══ CONTENT ═══ */}
      <main className="app-content">
        {activeTab === 'Dashboard' && <DashboardTab stocks={stocks} monthlyBudget={monthlyBudget} dollar={DOLLAR} marketScore={marketScore} />}
        {activeTab === 'Acciones' && <StocksTab stocks={stocks} monthlyBudget={monthlyBudget} />}
        {activeTab === 'Dólar' && <DollarTab dollar={DOLLAR} stocks={stocks} />}
        {activeTab === 'Simulador' && <SimulatorTab />}
        {activeTab === 'Configuración' && <ConfigTab stocks={stocks} monthlyBudget={monthlyBudget} onBudgetChange={setMonthlyBudget} onStocksChange={setStocks} />}
        {activeTab === 'Telegram' && <TelegramTab stocks={stocks} monthlyBudget={monthlyBudget} dollar={DOLLAR} marketScore={marketScore} />}
      </main>
    </div>
  );
}

export default App;
