import { useState } from 'react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import type { Stock } from '../../utils/scoring';
import { calcDrawdown, calcStockScore } from '../../utils/scoring';
import { explainStockScore } from '../../utils/explanations';
import { fU, fmt } from '../../utils/formatters';

const TIME_RANGES = ['1S', '1M', '3M', '6M', '1A', '5A'];
const RANGE_PTS: Record<string, number> = { '1S': 5, '1M': 22, '3M': 40, '6M': 50, '1A': 50, '5A': 50 };

function genTimeData(base: number, vol: number, range: string) {
  const pts = Math.min(RANGE_PTS[range] || 22, 60);
  let v = base;
  return Array.from({ length: pts }, (_, i) => {
    v += (Math.random() - 0.48) * vol;
    v = Math.max(v * 0.85, v);
    return { x: i, price: Math.round(v * 100) / 100 };
  });
}

interface Props {
  stocks: Stock[];
  monthlyBudget: number;
}

export default function StocksTab({ stocks, monthlyBudget }: Props) {
  const [chartRange, setChartRange] = useState('1M');
  const totalAlloc = stocks.reduce((s, x) => s + x.allocation, 0);

  return (
    <div className="animate-in">
      {/* Narrative */}
      <div className="narrative-box">
        <span className="narrative-icon">📈</span>
        <p className="narrative-text">
          Aquí puedes ver cómo están tus {stocks.length} inversiones.
          Cada acción tiene un <strong>score de oportunidad</strong> — mientras más alto, más barata está y mejor momento es para comprar.
          No te preocupes por los números, el semáforo te dice todo: 🟢 normal, 🟡 interesante, 🔴 gran oportunidad.
        </p>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#94a3b8' }}>{stocks.length} inversiones en tu portafolio</div>
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

      <div className="grid-2">
        {stocks.map(s => {
          const dd = calcDrawdown(s);
          // from-low percentage used by score
          const sc = calcStockScore(s);
          const rec = explainStockScore(s.ticker, sc);
          const td = genTimeData(s.price, s.price * 0.01, chartRange);

          return (
            <div key={s.id} className="card" style={{ position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg,${s.color},transparent)` }} />

              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span className="font-mono" style={{ background: `${s.color}22`, color: s.color, padding: '2px 8px', borderRadius: 5, fontSize: 11, fontWeight: 800 }}>{s.ticker}</span>
                    <span style={{ fontSize: 9, color: '#475569', background: '#020617', padding: '1px 6px', borderRadius: 4 }}>{s.category}</span>
                  </div>
                  <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>{s.name}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="font-mono" style={{ fontSize: 16, fontWeight: 800 }}>{fU(s.price)}</div>
                  <div className="font-mono" style={{ fontSize: 10, color: s.change1y >= 0 ? '#06d6a0' : '#e63946' }}>
                    {s.change1y >= 0 ? '+' : ''}{s.change1y}% en 1 año
                  </div>
                </div>
              </div>

              <ResponsiveContainer width="100%" height={80}>
                <AreaChart data={td}>
                  <defs><linearGradient id={`gs${s.id}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={s.color} stopOpacity={0.25} /><stop offset="100%" stopColor={s.color} stopOpacity={0} /></linearGradient></defs>
                  <Area type="monotone" dataKey="price" stroke={s.color} fill={`url(#gs${s.id})`} strokeWidth={1.5} dot={false} />
                </AreaChart>
              </ResponsiveContainer>

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

              {/* Human-readable explanation */}
              <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 8, padding: '6px 8px', background: '#020617', borderRadius: 6, lineHeight: 1.5 }}>
                {rec.emoji} {rec.text}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, paddingTop: 8, borderTop: '1px solid #1e293b' }}>
                <span className="font-mono" style={{ fontSize: 10, color: sc > 60 ? '#e63946' : sc > 40 ? '#e9c46a' : '#06d6a0', fontWeight: 600 }}>
                  {rec.emoji} {rec.label}
                </span>
                <span style={{ fontSize: 10, color: '#64748b' }}>
                  {s.allocation}% · {fmt(Math.round(monthlyBudget * s.allocation / Math.max(totalAlloc, 1)))}/mes
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
