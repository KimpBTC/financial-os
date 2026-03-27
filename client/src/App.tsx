import { useState } from 'react';
import './styles/index.css';
import DashboardTab from './components/dashboard/DashboardTab';
import StocksTab from './components/stocks/StocksTab';
import DollarTab from './components/dollar/DollarTab';
import SimulatorTab from './components/simulator/SimulatorTab';
import ConfigTab from './components/config/ConfigTab';
import TelegramTab from './components/telegram/TelegramTab';
import { getDollarSignal } from './utils/scoring';
import { GLOSSARY } from './utils/explanations';
import { useLiveData } from './hooks/useLiveData';

const TABS = ['Dashboard', 'Acciones', 'Dólar', 'Simulador', 'Configuración', 'Telegram'];

function App() {
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [showGlossary, setShowGlossary] = useState(false);

  // Live data from backend API
  const {
    stocks, dollar, marketScore, monthlyBudget,
    isConnected, lastUpdate, error,
    setStocks, setMonthlyBudget, refreshData,
  } = useLiveData();

  const dZone = getDollarSignal(dollar.current);

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
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span className="font-mono" style={{ fontSize: 9, color: 'var(--text-dim)' }}>USD/CLP</span>
            <span className="font-mono" style={{ fontSize: 11, fontWeight: 700, color: dZone.color }}>${dollar.current.toFixed(0)}</span>
          </div>
          <div style={{ width: 1, height: 14, background: 'var(--border-primary)' }} />
          <button onClick={() => setShowGlossary(!showGlossary)}
            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-primary)', borderRadius: 6, padding: '3px 8px', color: 'var(--text-dim)', fontSize: 10, cursor: 'pointer' }}>
            📖 Glosario
          </button>
          {/* Connection Status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }} onClick={refreshData} title="Click para actualizar datos">
            <div style={{
              width: 5, height: 5, borderRadius: '50%',
              background: isConnected ? 'var(--color-success)' : '#e63946',
              boxShadow: `0 0 6px ${isConnected ? 'var(--color-success)' : '#e63946'}`
            }} />
            <span className="font-mono" style={{ fontSize: 8, color: 'var(--text-faint)' }}>
              {isConnected ? `LIVE${lastUpdate ? ` · ${lastUpdate}` : ''}` : 'OFFLINE'}
            </span>
          </div>
          <span className="font-mono" style={{ fontSize: 8, color: 'var(--text-faint)' }}>
            {new Date().toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()}
          </span>
        </div>
      </header>

      {/* ═══ CONNECTION BANNER ═══ */}
      {error && (
        <div style={{ background: '#e6394615', borderBottom: '1px solid #e6394633', padding: '6px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 10, color: '#e63946' }}>⚠️ {error}</span>
          <button onClick={refreshData} style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 6, padding: '3px 10px', color: '#e2e8f0', fontSize: 10, cursor: 'pointer' }}>
            🔄 Reintentar
          </button>
        </div>
      )}

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
        {activeTab === 'Dashboard' && <DashboardTab stocks={stocks} monthlyBudget={monthlyBudget} dollar={dollar} marketScore={marketScore} />}
        {activeTab === 'Acciones' && <StocksTab stocks={stocks} monthlyBudget={monthlyBudget} />}
        {activeTab === 'Dólar' && <DollarTab dollar={dollar} stocks={stocks} />}
        {activeTab === 'Simulador' && <SimulatorTab />}
        {activeTab === 'Configuración' && <ConfigTab stocks={stocks} monthlyBudget={monthlyBudget} onBudgetChange={setMonthlyBudget} onStocksChange={setStocks} />}
        {activeTab === 'Telegram' && <TelegramTab stocks={stocks} monthlyBudget={monthlyBudget} dollar={dollar} marketScore={marketScore} />}
      </main>
    </div>
  );
}

export default App;
