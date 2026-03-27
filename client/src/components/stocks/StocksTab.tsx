import { useState, useEffect, useCallback } from 'react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import type { Stock } from '../../utils/scoring';
import { calcDrawdown, calcStockScore } from '../../utils/scoring';
import { explainStockScore } from '../../utils/explanations';
import { fU, fmt } from '../../utils/formatters';
import { api } from '../../services/api';

const TIME_RANGES = ['1S', '1M', '3M', '6M', '1A', '5A'];

interface Props {
  stocks: Stock[];
  monthlyBudget: number;
  dollarRate?: number;
}

type ChartPoint = { x: number; price: number };
type ChartCache = Record<string, Record<string, ChartPoint[]>>;

interface TxForm {
  ticker: string;
  price: number;
  type: 'BUY' | 'SELL';
  quantity: string;
  exchange_rate: string;
  date: string;
  notes: string;
}

interface Transaction {
  id: number;
  date: string;
  ticker: string;
  type: string;
  quantity: number;
  price_usd: number;
  exchange_rate: number;
  total_clp: number;
  notes: string;
}

const modalOverlay: React.CSSProperties = {
  position: 'fixed', inset: 0, background: 'rgba(2,6,23,0.85)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
};
const modalBox: React.CSSProperties = {
  background: '#0c1222', border: '1px solid #1e293b', borderRadius: 12,
  padding: 20, width: 340, maxWidth: '95vw',
};
const inputStyle: React.CSSProperties = {
  width: '100%', background: '#020617', border: '1px solid #1e293b',
  borderRadius: 6, padding: '6px 10px', color: '#e2e8f0', fontSize: 12,
  fontFamily: "'JetBrains Mono', monospace", boxSizing: 'border-box',
};
const labelStyle: React.CSSProperties = {
  fontSize: 9, color: '#475569', marginBottom: 3, display: 'block', letterSpacing: 0.5,
};

export default function StocksTab({ stocks, monthlyBudget, dollarRate = 913 }: Props) {
  const [chartRange, setChartRange] = useState('1M');
  const [chartCache, setChartCache] = useState<ChartCache>({});
  const [loadingTicker, setLoadingTicker] = useState<string | null>(null);

  // Transaction state
  const [txModal, setTxModal] = useState<TxForm | null>(null);
  const [txSaving, setTxSaving] = useState(false);
  const [txSaved, setTxSaved] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [showTxList, setShowTxList] = useState(false);

  const totalAlloc = stocks.reduce((s, x) => s + x.allocation, 0);

  // Load transactions list
  const loadTransactions = useCallback(async () => {
    try {
      const rows = await api.getTransactions();
      setTransactions(rows as Transaction[]);
    } catch { /* offline */ }
  }, []);

  useEffect(() => { loadTransactions(); }, []);

  const loadHistory = useCallback(async (range: string) => {
    const missing = stocks.filter(s => !chartCache[s.ticker]?.[range]);
    if (missing.length === 0) return;
    setLoadingTicker(missing[0].ticker);
    const updates: ChartCache = {};
    await Promise.all(missing.map(async (s) => {
      try {
        const rows: any[] = await api.getStockHistory(s.ticker, range);
        if (rows && rows.length > 0) {
          updates[s.ticker] = { [range]: rows.map((r, i) => ({ x: i, price: r.price })) };
        }
      } catch { /* offline */ }
    }));
    if (Object.keys(updates).length > 0) {
      setChartCache(prev => {
        const next = { ...prev };
        for (const ticker of Object.keys(updates)) {
          next[ticker] = { ...(prev[ticker] || {}), ...updates[ticker] };
        }
        return next;
      });
    }
    setLoadingTicker(null);
  }, [stocks, chartCache]);

  useEffect(() => {
    loadHistory(chartRange);
  }, [chartRange, stocks.length]); // eslint-disable-line react-hooks/exhaustive-deps

  function openTxModal(s: Stock, type: 'BUY' | 'SELL') {
    setTxSaved(false);
    setTxModal({
      ticker: s.ticker,
      price: s.price,
      type,
      quantity: '',
      exchange_rate: String(Math.round(dollarRate)),
      date: new Date().toISOString().split('T')[0],
      notes: '',
    });
  }

  async function saveTx() {
    if (!txModal || !txModal.quantity) return;
    setTxSaving(true);
    try {
      const qty = parseFloat(txModal.quantity);
      const rate = parseFloat(txModal.exchange_rate) || dollarRate;
      await api.addTransaction({
        date: txModal.date,
        ticker: txModal.ticker,
        type: txModal.type,
        quantity: qty,
        price_usd: txModal.price,
        exchange_rate: rate,
        total_clp: Math.round(qty * txModal.price * rate),
        notes: txModal.notes || null,
      });
      setTxSaved(true);
      await loadTransactions();
      setTimeout(() => setTxModal(null), 1200);
    } catch (e: any) {
      alert('Error: ' + e.message);
    } finally {
      setTxSaving(false);
    }
  }

  const totalInvested = transactions
    .filter(t => t.type === 'BUY')
    .reduce((s, t) => s + (t.total_clp || 0), 0);

  return (
    <div className="animate-in">
      {/* Narrative */}
      <div className="narrative-box">
        <span className="narrative-icon">📈</span>
        <p className="narrative-text">
          Aquí puedes ver cómo están tus {stocks.length} inversiones.
          Cada acción tiene un <strong>score de oportunidad</strong> — mientras más alto, más barata está y mejor momento es para comprar.
          Usa el botón <strong>+ Compra</strong> para registrar tus inversiones y llevar el historial.
        </p>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#94a3b8' }}>
            {stocks.length} inversiones
            {loadingTicker && <span style={{ fontSize: 10, color: '#475569', marginLeft: 8 }}>cargando {loadingTicker}…</span>}
          </div>
          <button onClick={() => { setShowTxList(!showTxList); if (!showTxList) loadTransactions(); }}
            style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 6, padding: '4px 10px', color: '#94a3b8', fontSize: 10, cursor: 'pointer' }}>
            📋 {transactions.length} transacciones
          </button>
        </div>
        <div style={{ display: 'flex', gap: 2, background: '#020617', borderRadius: 8, padding: 2 }}>
          {TIME_RANGES.map(r => (
            <button key={r} onClick={() => setChartRange(r)} style={{
              padding: '5px 10px', borderRadius: 6, border: 'none', cursor: 'pointer',
              fontSize: 10, fontWeight: 600, background: chartRange === r ? '#1e293b' : 'transparent',
              color: chartRange === r ? '#f1f5f9' : '#475569', transition: 'all 0.2s'
            }}>{r}</button>
          ))}
        </div>
      </div>

      {/* Transaction history panel */}
      {showTxList && (
        <div className="card" style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div className="card-title">Historial de transacciones</div>
            {totalInvested > 0 && (
              <span style={{ fontSize: 10, color: '#94a3b8' }}>
                Total invertido: <strong style={{ color: '#4361ee' }}>{fmt(totalInvested)}</strong>
              </span>
            )}
          </div>
          {transactions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '16px 0', color: '#475569', fontSize: 11 }}>
              Sin transacciones aún — registra tu primera compra
            </div>
          ) : (
            <div style={{ maxHeight: 220, overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                <thead>
                  <tr style={{ color: '#475569', fontSize: 9 }}>
                    {['Fecha', 'Acción', 'Tipo', 'Cant.', 'Precio USD', 'Total CLP', 'Nota'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '3px 6px', borderBottom: '1px solid #1e293b' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {transactions.map(t => (
                    <tr key={t.id} style={{ borderBottom: '1px solid #0f172a' }}>
                      <td style={{ padding: '4px 6px', color: '#64748b', fontFamily: 'monospace' }}>{t.date}</td>
                      <td style={{ padding: '4px 6px' }}>
                        <span style={{ background: stocks.find(s => s.ticker === t.ticker)?.color + '22', color: stocks.find(s => s.ticker === t.ticker)?.color || '#94a3b8', padding: '1px 5px', borderRadius: 4, fontSize: 10, fontWeight: 700 }}>{t.ticker}</span>
                      </td>
                      <td style={{ padding: '4px 6px', color: t.type === 'BUY' ? '#06d6a0' : '#e63946', fontWeight: 700 }}>{t.type === 'BUY' ? '▲ Compra' : '▼ Venta'}</td>
                      <td style={{ padding: '4px 6px', color: '#e2e8f0', fontFamily: 'monospace' }}>{t.quantity}</td>
                      <td style={{ padding: '4px 6px', color: '#e2e8f0', fontFamily: 'monospace' }}>{fU(t.price_usd)}</td>
                      <td style={{ padding: '4px 6px', color: '#4361ee', fontFamily: 'monospace', fontWeight: 700 }}>{fmt(t.total_clp)}</td>
                      <td style={{ padding: '4px 6px', color: '#475569', maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.notes || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <div className="grid-2">
        {stocks.map(s => {
          const dd = calcDrawdown(s);
          const sc = calcStockScore(s);
          const rec = explainStockScore(s.ticker, sc);
          const chartPoints = chartCache[s.ticker]?.[chartRange] ?? [];
          const txCount = transactions.filter(t => t.ticker === s.ticker).length;

          return (
            <div key={s.id} className="card" style={{ position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg,${s.color},transparent)` }} />

              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span className="font-mono" style={{ background: `${s.color}22`, color: s.color, padding: '2px 8px', borderRadius: 5, fontSize: 11, fontWeight: 800 }}>{s.ticker}</span>
                    <span style={{ fontSize: 9, color: '#475569', background: '#020617', padding: '1px 6px', borderRadius: 4 }}>{s.category}</span>
                    {txCount > 0 && <span style={{ fontSize: 9, color: '#475569' }}>{txCount} tx</span>}
                  </div>
                  <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>{s.name}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="font-mono" style={{ fontSize: 16, fontWeight: 800 }}>{fU(s.price)}</div>
                  <div className="font-mono" style={{ fontSize: 10, color: s.change1y >= 0 ? '#06d6a0' : '#e63946' }}>
                    {s.change1y >= 0 ? '+' : ''}{s.change1y.toFixed(2)}% en 1 año
                  </div>
                </div>
              </div>

              <div style={{ position: 'relative' }}>
                <ResponsiveContainer width="100%" height={80}>
                  <AreaChart data={chartPoints.length > 1 ? chartPoints : [{ x: 0, price: s.price * 0.97 }, { x: 1, price: s.price }]}>
                    <defs><linearGradient id={`gs${s.id}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={s.color} stopOpacity={0.25} /><stop offset="100%" stopColor={s.color} stopOpacity={0} /></linearGradient></defs>
                    <Area type="monotone" dataKey="price" stroke={s.color} fill={`url(#gs${s.id})`} strokeWidth={1.5} dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
                {chartPoints.length === 0 && (
                  <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', fontSize: 9, color: '#334155' }}>
                    sin historial
                  </div>
                )}
              </div>

              {/* Metrics */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 6, marginTop: 6 }}>
                {[
                  { l: 'Caída', v: `${dd.toFixed(1)}%`, c: dd < -10 ? '#e63946' : '#f4a261' },
                  { l: 'Mínimo', v: fU(s.low52), c: '#64748b' },
                  { l: 'Máximo', v: fU(s.high52), c: '#64748b' },
                  { l: 'Score', v: `${sc}`, c: sc > 60 ? '#e63946' : sc > 40 ? '#e9c46a' : '#06d6a0' },
                ].map(d => (
                  <div key={d.l} style={{ background: '#020617', borderRadius: 5, padding: '3px 6px', textAlign: 'center' }}>
                    <div style={{ fontSize: 7, color: '#475569' }}>{d.l}</div>
                    <div className="font-mono" style={{ fontSize: 10, fontWeight: 700, color: d.c }}>{d.v}</div>
                  </div>
                ))}
              </div>

              {/* Explanation */}
              <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 8, padding: '6px 8px', background: '#020617', borderRadius: 6, lineHeight: 1.5 }}>
                {rec.emoji} {rec.text}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, paddingTop: 8, borderTop: '1px solid #1e293b' }}>
                <span className="font-mono" style={{ fontSize: 10, color: sc > 60 ? '#e63946' : sc > 40 ? '#e9c46a' : '#06d6a0', fontWeight: 600 }}>
                  {rec.emoji} {rec.label}
                </span>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <span style={{ fontSize: 10, color: '#64748b' }}>
                    {s.allocation}% · {fmt(Math.round(monthlyBudget * s.allocation / Math.max(totalAlloc, 1)))}/mes
                  </span>
                  <button onClick={() => openTxModal(s, 'BUY')}
                    style={{ background: '#06d6a018', border: '1px solid #06d6a033', borderRadius: 5, padding: '3px 8px', color: '#06d6a0', fontSize: 10, cursor: 'pointer', fontWeight: 700 }}>
                    + Compra
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Transaction Modal */}
      {txModal && (
        <div style={modalOverlay} onClick={e => { if (e.target === e.currentTarget) setTxModal(null); }}>
          <div style={modalBox}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div style={{ fontWeight: 800, fontSize: 14, color: '#f1f5f9' }}>
                {txModal.type === 'BUY' ? '🟢 Registrar Compra' : '🔴 Registrar Venta'} — {txModal.ticker}
              </div>
              <button onClick={() => setTxModal(null)} style={{ background: 'none', border: 'none', color: '#475569', fontSize: 18, cursor: 'pointer', lineHeight: 1 }}>✕</button>
            </div>

            {txSaved ? (
              <div style={{ textAlign: 'center', padding: '20px 0', color: '#06d6a0', fontSize: 14, fontWeight: 700 }}>
                ✅ Transacción guardada
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div>
                    <label style={labelStyle}>TIPO</label>
                    <div style={{ display: 'flex', gap: 4 }}>
                      {(['BUY', 'SELL'] as const).map(t => (
                        <button key={t} onClick={() => setTxModal({ ...txModal, type: t })}
                          style={{ flex: 1, padding: '5px 0', borderRadius: 5, border: '1px solid', cursor: 'pointer', fontSize: 11, fontWeight: 700,
                            background: txModal.type === t ? (t === 'BUY' ? '#06d6a022' : '#e6394622') : 'transparent',
                            borderColor: txModal.type === t ? (t === 'BUY' ? '#06d6a0' : '#e63946') : '#1e293b',
                            color: txModal.type === t ? (t === 'BUY' ? '#06d6a0' : '#e63946') : '#475569',
                          }}>
                          {t === 'BUY' ? '▲ Compra' : '▼ Venta'}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label style={labelStyle}>FECHA</label>
                    <input type="date" value={txModal.date} onChange={e => setTxModal({ ...txModal, date: e.target.value })}
                      style={{ ...inputStyle, colorScheme: 'dark' }} />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div>
                    <label style={labelStyle}>CANTIDAD (acciones)</label>
                    <input type="number" step="0.0001" placeholder="ej: 0.5"
                      value={txModal.quantity}
                      onChange={e => setTxModal({ ...txModal, quantity: e.target.value })}
                      style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>PRECIO USD/acción</label>
                    <input type="number" step="0.01"
                      value={txModal.price}
                      onChange={e => setTxModal({ ...txModal, price: parseFloat(e.target.value) || 0 })}
                      style={inputStyle} />
                  </div>
                </div>

                <div>
                  <label style={labelStyle}>TIPO DE CAMBIO (USD/CLP)</label>
                  <input type="number" value={txModal.exchange_rate}
                    onChange={e => setTxModal({ ...txModal, exchange_rate: e.target.value })}
                    style={inputStyle} />
                </div>

                {txModal.quantity && (
                  <div style={{ background: '#020617', borderRadius: 6, padding: '6px 10px', fontSize: 11 }}>
                    <span style={{ color: '#475569' }}>Total estimado: </span>
                    <span className="font-mono" style={{ color: '#4361ee', fontWeight: 700 }}>
                      {fmt(Math.round(parseFloat(txModal.quantity || '0') * txModal.price * (parseFloat(txModal.exchange_rate) || dollarRate)))}
                    </span>
                  </div>
                )}

                <div>
                  <label style={labelStyle}>NOTAS (opcional)</label>
                  <input type="text" placeholder="ej: DCA mensual marzo"
                    value={txModal.notes}
                    onChange={e => setTxModal({ ...txModal, notes: e.target.value })}
                    style={inputStyle} />
                </div>

                <button onClick={saveTx} disabled={txSaving || !txModal.quantity}
                  style={{ background: txModal.type === 'BUY' ? '#06d6a0' : '#e63946', border: 'none', borderRadius: 7, padding: '9px 0',
                    color: '#020617', fontWeight: 800, fontSize: 13, cursor: txModal.quantity ? 'pointer' : 'not-allowed',
                    opacity: txModal.quantity ? 1 : 0.5, transition: 'opacity 0.2s' }}>
                  {txSaving ? 'Guardando…' : `Guardar ${txModal.type === 'BUY' ? 'Compra' : 'Venta'}`}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
