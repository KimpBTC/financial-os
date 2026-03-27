import { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { explainDollarZone } from '../../utils/explanations';
import { fmt } from '../../utils/formatters';
import type { Stock } from '../../utils/scoring';

const TIME_RANGES = ['1S', '1M', '3M', '6M', '1A', '5A'];
const RANGE_PTS: Record<string, number> = { '1S': 5, '1M': 22, '3M': 40, '6M': 50, '1A': 50, '5A': 50 };

function genDollarData(base: number, range: string) {
  const pts = Math.min(RANGE_PTS[range] || 22, 60);
  let v = base;
  return Array.from({ length: pts }, (_, i) => {
    v += (Math.random() - 0.48) * 8;
    return { x: i, rate: Math.round(v * 100) / 100 };
  });
}

const ttStyle = { backgroundColor: '#0c1222', border: '1px solid #1e293b', borderRadius: 8, padding: '6px 10px', fontSize: 11, color: '#e2e8f0' };

interface Props {
  dollar: { current: number; high52: number; low52: number };
  stocks: Stock[];
}

export default function DollarTab({ dollar, stocks }: Props) {
  const [chartRange, setChartRange] = useState('1M');
  const dZone = explainDollarZone(dollar.current);
  const dollarPos = ((dollar.current - dollar.low52) / (dollar.high52 - dollar.low52)) * 100;
  const totalUSD = stocks.reduce((s, x) => s + x.owned * x.price, 0);

  const zones = [
    { r: '< $860', s: '🟢 COMPRAR', a: 'Dólar barato — adelanta tus inversiones', c: '#06d6a0' },
    { r: '$860-900', s: '🔵 BUEN PRECIO', a: 'Buen momento para invertir', c: '#4cc9f0' },
    { r: '$900-940', s: '🟡 NEUTRAL', a: 'Precio normal — invierte como siempre', c: '#e9c46a' },
    { r: '$940-980', s: '🟠 CARO', a: 'Espera si puedes', c: '#f4a261' },
    { r: '> $980', s: '🔴 MUY CARO', a: 'Mejor esperar a que baje', c: '#e63946' },
  ];

  return (
    <div className="animate-in">
      <div className="narrative-box">
        <span className="narrative-icon">💵</span>
        <p className="narrative-text">
          {dZone.text} El dólar hoy está a <strong>${dollar.current.toFixed(0)}</strong>.
          En el último año se ha movido entre ${dollar.low52} y ${dollar.high52}.
          Cuando el dólar está barato, puedes comprar más acciones con la misma plata en pesos.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 12, marginBottom: 12 }}>
        <div className="card" style={{ textAlign: 'center', padding: 20 }}>
          <div style={{ fontSize: 11, color: '#64748b', letterSpacing: 1, fontWeight: 600, marginBottom: 10 }}>
            DÓLAR OBSERVADO (USD / CLP)
            <span className="help-trigger">?<span className="help-tooltip">Es el precio oficial del dólar en Chile, publicado por el Banco Central cada día.</span></span>
          </div>
          <div className="font-mono" style={{ fontSize: 40, fontWeight: 800 }}>${dollar.current.toFixed(0)}</div>
          <div style={{ fontSize: 11, color: '#475569', marginBottom: 14 }}>Banco Central · Hoy</div>

          {/* Range Bar */}
          <div style={{ position: 'relative', height: 26, background: 'linear-gradient(90deg,#06d6a0,#4cc9f0,#e9c46a,#f4a261,#e63946)', borderRadius: 13, maxWidth: 300, margin: '0 auto', marginBottom: 6 }}>
            <div style={{
              position: 'absolute', left: `${dollarPos}%`, top: -5, transform: 'translateX(-50%)',
              width: 18, height: 36, borderRadius: 9, background: '#f1f5f9',
              border: '3px solid #020617', boxShadow: '0 0 10px rgba(255,255,255,0.2)'
            }} />
          </div>
          <div className="font-mono" style={{ display: 'flex', justifyContent: 'space-between', maxWidth: 300, margin: '0 auto', fontSize: 9, color: '#475569' }}>
            <span>Mín ${dollar.low52}</span><span>Máx ${dollar.high52}</span>
          </div>

          <div style={{ marginTop: 14, padding: '8px 14px', background: `${dZone.color}12`, border: `1px solid ${dZone.color}33`, borderRadius: 8, display: 'inline-block' }}>
            <div style={{ color: dZone.color, fontWeight: 700, fontSize: 13 }}>{dZone.emoji} {dZone.label}</div>
            <div style={{ color: '#94a3b8', fontSize: 10 }}>{dZone.text}</div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="card">
            <div className="card-title">Variaciones
              <span className="help-trigger">?<span className="help-tooltip">Cuánto subió o bajó el dólar comparado con días anteriores. Rojo = subió (malo para comprar), verde = bajó (bueno).</span></span>
            </div>
            {[{ l: 'vs Ayer', d: -1.75 }, { l: 'vs Semana', d: +8.83 }, { l: 'vs Mes', d: +46.93 }].map(v => (
              <div key={v.l} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #0f172a' }}>
                <span style={{ fontSize: 11, color: '#94a3b8' }}>{v.l}</span>
                <span className="font-mono" style={{ fontSize: 12, fontWeight: 700, color: v.d > 0 ? '#e63946' : '#06d6a0' }}>
                  {v.d > 0 ? '+' : ''}{v.d.toFixed(1)}
                </span>
              </div>
            ))}
          </div>
          <div className="card">
            <div className="card-title">Impacto en tu portafolio
              <span className="help-trigger">?<span className="help-tooltip">Cómo cambiaría el valor de tus inversiones si el dólar sube o baja.</span></span>
            </div>
            <div style={{ background: '#020617', borderRadius: 7, padding: 8, marginBottom: 6 }}>
              <div style={{ fontSize: 9, color: '#475569' }}>Tu portafolio hoy en CLP</div>
              <div className="font-mono" style={{ fontSize: 16, fontWeight: 800, color: '#4361ee' }}>
                {fmt(Math.round(totalUSD * dollar.current + 150000))}
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 5 }}>
              <div style={{ background: '#06d6a008', borderRadius: 6, padding: 6, textAlign: 'center' }}>
                <div style={{ fontSize: 8, color: '#475569' }}>Si dólar → $850</div>
                <div className="font-mono" style={{ fontSize: 11, fontWeight: 700, color: '#e63946' }}>{fmt(Math.round(totalUSD * 850 + 150000))}</div>
              </div>
              <div style={{ background: '#e6394608', borderRadius: 6, padding: 6, textAlign: 'center' }}>
                <div style={{ fontSize: 8, color: '#475569' }}>Si dólar → $1000</div>
                <div className="font-mono" style={{ fontSize: 11, fontWeight: 700, color: '#06d6a0' }}>{fmt(Math.round(totalUSD * 1000 + 150000))}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div className="card-title">Historial USD/CLP</div>
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
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={genDollarData(dollar.current, chartRange)}>
              <defs><linearGradient id="gD" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#e9c46a" stopOpacity={0.25} /><stop offset="100%" stopColor="#e9c46a" stopOpacity={0} /></linearGradient></defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="x" tick={false} axisLine={{ stroke: '#1e293b' }} />
              <YAxis tick={{ fill: '#475569', fontSize: 9 }} axisLine={{ stroke: '#1e293b' }} domain={['auto', 'auto']} />
              <Tooltip contentStyle={ttStyle} />
              <Area type="monotone" dataKey="rate" stroke="#e9c46a" fill="url(#gD)" strokeWidth={2} name="USD/CLP" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="card">
          <div className="card-title">Zonas de alerta — ¿Cuándo comprar dólares?</div>
          {zones.map(z => (
            <div key={z.r} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', background: `${z.c}08`, borderRadius: 6, marginBottom: 4, border: `1px solid ${z.c}15` }}>
              <span className="font-mono" style={{ fontSize: 10, fontWeight: 700, color: z.c, minWidth: 62 }}>{z.r}</span>
              <div>
                <div style={{ fontSize: 10, fontWeight: 600, color: z.c }}>{z.s}</div>
                <div style={{ fontSize: 9, color: '#64748b' }}>{z.a}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
