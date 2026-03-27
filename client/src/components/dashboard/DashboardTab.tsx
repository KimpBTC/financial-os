import { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid, Line } from 'recharts';
import type { Stock } from '../../utils/scoring';
import { calcDrawdown, calcStockScore, getMarketSignal } from '../../utils/scoring';
import { explainMarketScore, explainDrawdown, explainDollarZone } from '../../utils/explanations';
import { fmt, fK, fU } from '../../utils/formatters';
import { api } from '../../services/api';

const TIME_RANGES = ['3M', '6M', '1A', '2A', '5A'];
const RANGE_LABELS: Record<string, string> = { '3M': '3 Meses', '6M': '6 Meses', '1A': '1 Año', '2A': '2 Años', '5A': '5 Años' };

const ttStyle = { backgroundColor: '#0c1222', border: '1px solid #1e293b', borderRadius: 8, padding: '6px 10px', fontSize: 11, color: '#e2e8f0' };

interface MarketSignalData {
  vix: number;
  fear_greed: number;
  sp500_drawdown: number;
  market_score: number;
  market_action: string;
}

interface Snapshot {
  month: string;
  total_wealth_clp: number;
  total_contributions_clp: number;
  net_gain_clp: number;
  roi_pct: number;
}

interface Props {
  stocks: Stock[];
  monthlyBudget: number;
  dollar: { current: number; high52: number; low52: number };
  marketScore: number;
  marketSignal: MarketSignalData | null;
}

export default function DashboardTab({ stocks, monthlyBudget, dollar, marketScore, marketSignal }: Props) {
  const [chartRange, setChartRange] = useState('6M');
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [monthsInvesting, setMonthsInvesting] = useState(0);
  const [totalInvested, setTotalInvested] = useState(0);

  const totalAlloc = stocks.reduce((s, x) => s + x.allocation, 0);
  const totalWealth = stocks.reduce((s, x) => s + x.owned * x.price * dollar.current, 0) + 150000;
  const investRate = ((monthlyBudget / 1075000) * 100).toFixed(0);
  const signal = getMarketSignal(marketScore);
  const dZone = explainDollarZone(dollar.current);
  const pieData = stocks.map(s => ({ name: s.ticker, value: s.allocation, color: s.color }));

  useEffect(() => {
    // Load snapshots for portfolio evolution chart
    api.getSnapshots(chartRange).then((rows: any[]) => {
      setSnapshots(rows as Snapshot[]);
    }).catch(() => {});
  }, [chartRange]);

  useEffect(() => {
    // Calculate months investing and total invested from transactions
    api.getTransactions().then((rows: any[]) => {
      if (rows && rows.length > 0) {
        const buys = rows.filter((t: any) => t.type === 'BUY');
        const total = buys.reduce((s: number, t: any) => s + (t.total_clp || 0), 0);
        setTotalInvested(total);

        // Unique months with at least one transaction
        const months = new Set(buys.map((t: any) => t.date?.slice(0, 7)));
        setMonthsInvesting(months.size);
      }
    }).catch(() => {});
  }, []);

  // Build chart data: use snapshots if available, otherwise current point only
  const chartData = snapshots.length > 0
    ? snapshots.map((s, i) => ({
        x: i,
        label: s.month,
        total: s.total_wealth_clp,
        invested: s.total_contributions_clp,
      }))
    : [{ x: 0, label: 'Hoy', total: Math.round(totalWealth), invested: totalInvested || Math.round(totalWealth * 0.9) }];

  const latestSnapshot = snapshots[snapshots.length - 1];
  const roi = latestSnapshot?.roi_pct ?? (totalInvested > 0 ? ((totalWealth - totalInvested) / totalInvested * 100) : 0);

  return (
    <div className="animate-in">
      {/* Narrative Summary */}
      <div className="narrative-box">
        <span className="narrative-icon">💡</span>
        <p className="narrative-text">
          {explainMarketScore(marketScore)} El dólar está a ${dollar.current.toFixed(0)} — <strong>{dZone.label.toLowerCase()}</strong>.
          {marketScore >= 35 && dollar.current < 900
            ? ' ¡Doble oportunidad! Mercado y dólar favorables.'
            : ` Tu inversión mensual de ${fmt(monthlyBudget)} sigue siendo un buen plan.`}
        </p>
      </div>

      {/* KPIs */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        {[
          { icon: '💰', label: 'Tu patrimonio', value: fmt(Math.round(totalWealth)), sub: `${stocks.length} inversiones activas`, accent: '#4361ee', help: 'El valor total de todas tus inversiones, convertido a pesos chilenos' },
          { icon: '📊', label: 'Inversión mensual', value: fmt(monthlyBudget), sub: `${investRate}% de tu sueldo`, accent: '#06d6a0', help: 'Lo que inviertes cada mes de forma automática (DCA)' },
          { icon: '💵', label: 'Dólar hoy', value: `$${dollar.current.toFixed(0)}`, sub: `${dZone.emoji} ${dZone.label}`, accent: dZone.color, help: 'El precio del dólar afecta cuántas acciones puedes comprar' },
          { icon: '🌡️', label: 'Estado del mercado', value: `${marketScore}/100`, sub: `${signal.label} — ${signal.action}`, accent: signal.color, help: 'Una nota de 0 a 100 que indica si hay oportunidades de compra' },
        ].map(kpi => (
          <div key={kpi.label} className="kpi-card">
            <div className="kpi-label">
              <span style={{ fontSize: 13 }}>{kpi.icon}</span>
              {kpi.label}
              <span className="help-trigger">?<span className="help-tooltip">{kpi.help}</span></span>
            </div>
            <div className="kpi-value">{kpi.value}</div>
            <div className="kpi-sub" style={{ color: kpi.accent }}>{kpi.sub}</div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 12, marginBottom: 12 }}>
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div className="card-title">Evolución de tu dinero
              <span className="help-trigger">?<span className="help-tooltip">Cómo ha crecido tu inversión con el tiempo. La línea azul es tu valor real, la punteada es lo que pusiste.</span></span>
              {roi !== 0 && (
                <span style={{ marginLeft: 8, fontSize: 10, color: roi >= 0 ? '#06d6a0' : '#e63946', fontWeight: 700 }}>
                  {roi >= 0 ? '+' : ''}{roi.toFixed(1)}% ROI
                </span>
              )}
            </div>
            <div style={{ display: 'flex', gap: 2, background: '#020617', borderRadius: 8, padding: 2 }}>
              {TIME_RANGES.map(r => (
                <button key={r} onClick={() => setChartRange(r)} style={{
                  padding: '5px 10px', borderRadius: 6, border: 'none', cursor: 'pointer',
                  fontSize: 10, fontWeight: 600, letterSpacing: 0.5,
                  background: chartRange === r ? '#1e293b' : 'transparent',
                  color: chartRange === r ? '#f1f5f9' : '#475569', transition: 'all 0.2s'
                }}>{r}</button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={190}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="gE" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4361ee" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#4361ee" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="label" tick={{ fill: '#475569', fontSize: 8 }} axisLine={{ stroke: '#1e293b' }} interval="preserveStartEnd" />
              <YAxis tick={{ fill: '#475569', fontSize: 9 }} axisLine={{ stroke: '#1e293b' }} tickFormatter={fK} />
              <Tooltip contentStyle={ttStyle} formatter={(v: any) => fmt(Number(v))} />
              <Area type="monotone" dataKey="total" stroke="#4361ee" fill="url(#gE)" strokeWidth={2} name="Tu patrimonio" />
              <Line type="monotone" dataKey="invested" stroke="#334155" strokeDasharray="4 4" dot={false} name="Lo que pusiste" strokeWidth={1.5} />
            </AreaChart>
          </ResponsiveContainer>
          {snapshots.length === 0 && (
            <div style={{ textAlign: 'center', fontSize: 9, color: '#334155', marginTop: 4 }}>
              Los snapshots mensuales se generan automáticamente — registra una compra para comenzar
            </div>
          )}
          {snapshots.length > 0 && (
            <div style={{ textAlign: 'center', fontSize: 9, color: '#475569', marginTop: 4 }}>{RANGE_LABELS[chartRange]}</div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Market Signal Gauge */}
          <div className="card" style={{ textAlign: 'center' }}>
            <div className="card-title">Señal del mercado
              <span className="help-trigger">?<span className="help-tooltip">Cuando este número sube, significa que hay más oportunidades para invertir. Si está bajo, todo normal.</span></span>
            </div>
            <svg width={140} height={87} viewBox="0 0 140 87">
              <path d={`M 9 80 A 61 61 0 0 1 131 80`} fill="none" stroke="#1e293b" strokeWidth="10" strokeLinecap="round" />
              <path d={`M 9 80 A 61 61 0 0 1 131 80`} fill="none" stroke={signal.color} strokeWidth="10" strokeLinecap="round"
                strokeDasharray={`${Math.min(marketScore / 100, 1) * Math.PI * 61} ${Math.PI * 61}`}
                style={{ filter: `drop-shadow(0 0 6px ${signal.color}44)` }} />
              <text x={70} y={62} textAnchor="middle" fill="#f1f5f9" fontSize="20" fontWeight="800" fontFamily="'JetBrains Mono',monospace">{marketScore}</text>
              <text x={70} y={80} textAnchor="middle" fill="#64748b" fontSize="9">/100</text>
            </svg>
            <span className="font-mono" style={{ color: signal.color, fontWeight: 700, fontSize: 11, letterSpacing: 1.5 }}>{signal.label}</span>
            <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>{signal.action}</div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 5, marginTop: 8 }}>
              {[
                { l: 'VIX', v: marketSignal ? marketSignal.vix.toFixed(1) : '—', c: '#e9c46a' },
                { l: 'F&G', v: marketSignal ? String(marketSignal.fear_greed) : '—', c: '#f4a261' },
                { l: 'Caída', v: marketSignal ? `${marketSignal.sp500_drawdown.toFixed(1)}%` : '—', c: '#4361ee' },
                { l: 'Dólar', v: `$${dollar.current.toFixed(0)}`, c: dZone.color },
              ].map(d => (
                <div key={d.l} style={{ background: '#020617', borderRadius: 6, padding: '3px 6px' }}>
                  <div style={{ fontSize: 8, color: '#475569' }}>{d.l}</div>
                  <div className="font-mono" style={{ fontSize: 11, fontWeight: 700, color: d.c }}>{d.v}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Allocation Pie */}
          <div className="card">
            <div className="card-title">Tu portafolio ({totalAlloc}%)
              <span className="help-trigger">?<span className="help-tooltip">Cómo se reparte tu dinero entre las diferentes inversiones.</span></span>
            </div>
            <ResponsiveContainer width="100%" height={80}>
              <PieChart><Pie data={pieData} cx="50%" cy="50%" innerRadius={22} outerRadius={38} paddingAngle={3} dataKey="value">
                {pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Pie></PieChart>
            </ResponsiveContainer>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center' }}>
              {pieData.map(d => (<div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 9, color: '#94a3b8' }}><div style={{ width: 6, height: 6, borderRadius: 2, background: d.color }} />{d.name} {d.value}%</div>))}
            </div>
          </div>
        </div>
      </div>

      {/* Stock Mini Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(stocks.length, 4)}, 1fr)`, gap: 8, marginBottom: 12 }}>
        {stocks.slice(0, 8).map(s => {
          const dd = calcDrawdown(s);
          const score = calcStockScore(s);
          const amt = Math.round(monthlyBudget * s.allocation / Math.max(totalAlloc, 1));
          return (
            <div key={s.id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span className="font-mono" style={{ background: `${s.color}22`, color: s.color, padding: '2px 7px', borderRadius: 5, fontSize: 10, fontWeight: 800 }}>{s.ticker}</span>
                <span className="font-mono" style={{ fontSize: 10, color: s.change1y >= 0 ? '#06d6a0' : '#e63946' }}>{s.change1y >= 0 ? '+' : ''}{s.change1y.toFixed(1)}%</span>
              </div>
              <div className="font-mono" style={{ fontSize: 15, fontWeight: 800 }}>{fU(s.price)}</div>
              <div style={{ fontSize: 9, color: '#94a3b8', marginTop: 4, lineHeight: 1.5 }}>
                {explainDrawdown(s.ticker, dd)}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 9, color: '#64748b' }}>
                <span>Inversión: {fmt(amt)}/mes</span>
                <span>Score: {score}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* DCA + Goals */}
      <div className="grid-2">
        <div className="card">
          <div className="card-title">Tu inversión mensual — {fmt(monthlyBudget)}
            <span className="help-trigger">?<span className="help-tooltip">Así se reparte tu inversión mensual entre las diferentes acciones.</span></span>
          </div>
          {stocks.map(s => {
            const amt = Math.round(monthlyBudget * s.allocation / Math.max(totalAlloc, 1));
            return (
              <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span className="font-mono" style={{ background: `${s.color}22`, color: s.color, padding: '1px 6px', borderRadius: 4, fontSize: 10, fontWeight: 700, minWidth: 36, textAlign: 'center' }}>{s.ticker}</span>
                <div style={{ flex: 1, height: 5, background: '#1e293b', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${s.allocation / Math.max(totalAlloc, 1) * 100}%`, background: s.color, borderRadius: 3 }} />
                </div>
                <span className="font-mono" style={{ fontSize: 11, fontWeight: 700, color: '#e2e8f0', minWidth: 65, textAlign: 'right' }}>{fmt(amt)}</span>
              </div>
            );
          })}
        </div>
        <div className="card">
          <div className="card-title">Tus metas
            <span className="help-trigger">?<span className="help-tooltip">Progreso hacia tus objetivos financieros de largo plazo.</span></span>
          </div>
          {[
            { l: '🛡️ Fondo de emergencia', v: 150000, m: 2100000, c: '#f4a261' },
            { l: '🎯 Primer $1M CLP', v: Math.round(totalWealth), m: 1000000, c: '#4361ee' },
            { l: '💰 $5M patrimonio', v: Math.round(totalWealth), m: 5000000, c: '#06d6a0' },
            { l: '📅 12 meses invirtiendo', v: monthsInvesting, m: 12, c: '#f72585' },
          ].map(g => {
            const p = Math.min(g.v / g.m * 100, 100);
            return (
              <div key={g.l} style={{ marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#94a3b8', marginBottom: 2 }}>
                  <span>{g.l}</span>
                  <span className="font-mono">
                    {g.l.includes('meses') ? `${g.v}/${g.m}` : `${p.toFixed(0)}%`}
                  </span>
                </div>
                <div style={{ height: 4, background: '#1e293b', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${p}%`, background: g.c, borderRadius: 2, transition: 'width 0.6s' }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
