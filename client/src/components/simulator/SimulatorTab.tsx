import { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Line } from 'recharts';
import { fK, fmt } from '../../utils/formatters';

const ttStyle = { backgroundColor: '#0c1222', border: '1px solid #1e293b', borderRadius: 8, padding: '6px 10px', fontSize: 11, color: '#e2e8f0' };

export default function SimulatorTab() {
  const [simY, setSimY] = useState(15);
  const [simR, setSimR] = useState(10);
  const [simM, setSimM] = useState(350);

  const futureValue = Math.round(simM * 1000 * 12 * (((1 + simR / 100 / 12) ** (simY * 12) - 1) / (simR / 100 / 12)));
  const totalContributed = simM * 1000 * 12 * simY;
  const gain = futureValue - totalContributed;

  const chartData = Array.from({ length: Math.min(simY, 30) }, (_, i) => {
    const y = i + 1;
    const base = Math.round(simM * 1000 * 12 * (((1 + simR / 100 / 12) ** (y * 12) - 1) / (simR / 100 / 12)));
    const optimist = Math.round(simM * 1000 * 12 * (((1 + (simR + 2) / 100 / 12) ** (y * 12) - 1) / ((simR + 2) / 100 / 12)));
    return { year: 2026 + y, base, optimist, aportes: simM * 1000 * 12 * y };
  });

  const milestones = [
    { label: '🎯 Primer millón', target: 1000000 },
    { label: '💰 $5 millones', target: 5000000 },
    { label: '🏠 $10 millones', target: 10000000 },
    { label: '🔥 $50 millones', target: 50000000 },
    { label: '🚀 $100 millones', target: 100000000 },
  ];

  return (
    <div className="animate-in">
      <div className="narrative-box">
        <span className="narrative-icon">🔮</span>
        <p className="narrative-text">
          Aquí puedes ver cuánto podrías acumular si sigues invirtiendo.
          Mueve los controles para experimentar con diferentes montos, retornos y años.
          <strong> El interés compuesto es la magia</strong> — tu dinero gana dinero, y ese dinero gana más dinero.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 12, marginBottom: 12 }}>
        <div className="card" style={{ padding: 18 }}>
          <div className="card-title">Ajusta tus parámetros</div>
          {[
            { l: '¿Cuánto invertirás al mes?', v: simM, u: 'K', mn: 50, mx: 800, set: setSimM, help: 'El monto en miles de pesos que invertirás cada mes' },
            { l: '¿Cuánto crecerá por año?', v: simR, u: '%', mn: 4, mx: 18, set: setSimR, help: 'El retorno anual esperado. El S&P 500 históricamente da ~10%' },
            { l: '¿Por cuántos años?', v: simY, u: ' años', mn: 1, mx: 30, set: setSimY, help: 'Cuántos años planeas mantener tu inversión' },
          ].map(s => (
            <div key={s.l} style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 10, color: '#94a3b8' }}>
                  {s.l}
                  <span className="help-trigger" style={{ marginLeft: 4 }}>?<span className="help-tooltip">{s.help}</span></span>
                </span>
                <span className="font-mono" style={{ fontSize: 13, fontWeight: 800, color: '#4361ee' }}>{s.v}{s.u}</span>
              </div>
              <input type="range" min={s.mn} max={s.mx} value={s.v} onChange={e => s.set(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#4361ee' }} />
            </div>
          ))}

          <div style={{ background: '#020617', borderRadius: 8, padding: 12, marginTop: 6 }}>
            <div style={{ fontSize: 8, color: '#475569', letterSpacing: 0.5 }}>EN {simY} AÑOS TENDRÁS</div>
            <div className="font-mono" style={{ fontSize: 26, fontWeight: 800, color: '#06d6a0', marginTop: 2 }}>{fK(futureValue)}</div>
            <div style={{ fontSize: 9, color: '#475569', marginTop: 2 }}>Pusiste: {fK(totalContributed)}</div>
            <div style={{ fontSize: 9, color: '#06d6a0', marginTop: 1 }}>Ganaste: {fK(gain)} ✨</div>
          </div>
        </div>

        <div className="card">
          <div className="card-title">Proyección de crecimiento
            <span className="help-trigger">?<span className="help-tooltip">Línea azul = escenario base. Línea verde punteada = si las acciones rinden un poco más. Línea gris = solo lo que pusiste.</span></span>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={chartData}>
              <defs><linearGradient id="gS" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#4361ee" stopOpacity={0.3} /><stop offset="100%" stopColor="#4361ee" stopOpacity={0} /></linearGradient></defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="year" tick={{ fill: '#475569', fontSize: 9 }} axisLine={{ stroke: '#1e293b' }} />
              <YAxis tick={{ fill: '#475569', fontSize: 9 }} axisLine={{ stroke: '#1e293b' }} tickFormatter={fK} />
              <Tooltip contentStyle={ttStyle} formatter={(v: any) => fmt(Number(v))} />
              <Area type="monotone" dataKey="optimist" stroke="#06d6a0" fill="none" strokeWidth={1} strokeDasharray="4 4" name={`Optimista (${simR + 2}%)`} />
              <Area type="monotone" dataKey="base" stroke="#4361ee" fill="url(#gS)" strokeWidth={2} name={`Base (${simR}%)`} />
              <Line type="monotone" dataKey="aportes" stroke="#334155" strokeDasharray="3 3" dot={false} name="Lo que pusiste" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Milestones */}
      <div className="card">
        <div className="card-title">🏆 ¿Cuándo alcanzarás tus metas?</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 8 }}>
          {milestones.map(m => {
            const { target } = m;
            let yearsNeeded = 0;
            for (let y = 1; y <= 50; y++) {
              const v = simM * 1000 * 12 * (((1 + simR / 100 / 12) ** (y * 12) - 1) / (simR / 100 / 12));
              if (v >= target) { yearsNeeded = y; break; }
            }
            return (
              <div key={m.label} style={{ background: '#020617', borderRadius: 8, padding: 10, textAlign: 'center' }}>
                <div style={{ fontSize: 10, color: '#94a3b8', marginBottom: 4 }}>{m.label}</div>
                <div className="font-mono" style={{ fontSize: 14, fontWeight: 800, color: yearsNeeded ? '#06d6a0' : '#475569' }}>
                  {yearsNeeded ? `${yearsNeeded} años` : '50+ años'}
                </div>
                <div style={{ fontSize: 9, color: '#475569' }}>
                  {yearsNeeded ? `En ${2026 + yearsNeeded}` : 'Aumenta tu aporte'}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
