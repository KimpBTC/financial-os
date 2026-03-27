import { fmt, fU } from '../../utils/formatters';
import type { Stock } from '../../utils/scoring';

const COLORS = ['#4361ee', '#06d6a0', '#7209b7', '#f72585', '#e9c46a', '#f4a261', '#4cc9f0', '#e63946', '#2ec4b6', '#ff6b6b'];

interface Props {
  stocks: Stock[];
  monthlyBudget: number;
  onBudgetChange: (v: number) => void;
  onStocksChange: (s: Stock[]) => void;
}

export default function ConfigTab({ stocks, monthlyBudget, onBudgetChange, onStocksChange }: Props) {
  const totalAlloc = stocks.reduce((s, x) => s + x.allocation, 0);
  const investRate = ((monthlyBudget / 1075000) * 100).toFixed(0);

  const updateAllocation = (id: number, val: string) => {
    onStocksChange(stocks.map(s => s.id === id ? { ...s, allocation: Math.max(0, Math.min(100, parseInt(val) || 0)) } : s));
  };
  const removeStock = (id: number) => {
    if (stocks.length <= 1) return;
    onStocksChange(stocks.filter(s => s.id !== id));
  };
  const addStock = (ticker: string, name: string, price: string, alloc: string, cat: string) => {
    if (!ticker || !price) return;
    const id = Math.max(...stocks.map(s => s.id)) + 1;
    const color = COLORS[id % COLORS.length];
    const newStock: Stock = {
      id, ticker: ticker.toUpperCase(), name: name || ticker, price: parseFloat(price),
      high52: parseFloat(price) * 1.15, low52: parseFloat(price) * 0.7, change1y: 0,
      category: cat, color, allocation: parseFloat(alloc) || 0, owned: 0
    };
    onStocksChange([...stocks, newStock]);
  };
  const applyPreset = (preset: { t: string; a: number }[]) => {
    const newStocks = preset.map((ps, i) => {
      const existing = stocks.find(s => s.ticker === ps.t);
      return existing ? { ...existing, allocation: ps.a }
        : { id: 100 + i, ticker: ps.t, name: ps.t, price: 200, high52: 250, low52: 150, change1y: 0, category: 'Growth', color: COLORS[(stocks.length + i) % COLORS.length], allocation: ps.a, owned: 0 };
    });
    onStocksChange(newStocks);
  };

  return (
    <div className="animate-in">
      <div className="narrative-box">
        <span className="narrative-icon">⚙️</span>
        <p className="narrative-text">
          Aquí puedes ajustar cuánto inviertes cada mes y cómo se reparte entre tus acciones.
          <strong> No te preocupes, puedes cambiar esto cuando quieras</strong> — el sistema recalcula todo automáticamente.
        </p>
      </div>

      {/* Monthly Budget */}
      <div className="card" style={{ marginBottom: 12 }}>
        <div className="card-title">¿Cuánto quieres invertir al mes?
          <span className="help-trigger">?<span className="help-tooltip">Este es el monto total que se repartirá entre todas tus inversiones cada mes.</span></span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <input type="range" min={50000} max={800000} step={10000} value={monthlyBudget}
            onChange={e => onBudgetChange(Number(e.target.value))}
            style={{ flex: 1, accentColor: '#4361ee' }} />
          <span className="font-mono" style={{ fontSize: 18, fontWeight: 800, color: '#4361ee', minWidth: 100, textAlign: 'right' }}>
            {fmt(monthlyBudget)}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 12, marginTop: 8, fontSize: 10, color: '#64748b' }}>
          <span>Sueldo: {fmt(1075000)}</span><span>·</span>
          <span>Inversión: {investRate}%</span><span>·</span>
          <span>Para gastos: {fmt(1075000 - monthlyBudget)}</span>
        </div>
      </div>

      {/* Portfolio Table */}
      <div className="card" style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div className="card-title">Tus inversiones</div>
          <div className="font-mono" style={{ fontSize: 10, color: totalAlloc === 100 ? '#06d6a0' : totalAlloc > 100 ? '#e63946' : '#e9c46a' }}>
            Total: {totalAlloc}%{totalAlloc !== 100 && ' ⚠️'}
          </div>
        </div>

        {/* Header */}
        <div style={{ display: 'grid', gridTemplateColumns: '60px 1fr 80px 80px 80px 70px 40px', gap: 6, alignItems: 'center', padding: '6px 0', borderBottom: '1px solid #1e293b', marginBottom: 6 }}>
          {['Ticker', 'Nombre', 'Categoría', 'Precio', 'Porcentaje', 'DCA/mes', ''].map(h => (
            <div key={h} style={{ fontSize: 9, color: '#475569', fontWeight: 600 }}>{h}</div>
          ))}
        </div>

        {stocks.map(s => {
          const amt = Math.round(monthlyBudget * s.allocation / Math.max(totalAlloc, 1));
          return (
            <div key={s.id} style={{ display: 'grid', gridTemplateColumns: '60px 1fr 80px 80px 80px 70px 40px', gap: 6, alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #0f172a' }}>
              <span className="font-mono" style={{ background: `${s.color}22`, color: s.color, padding: '3px 8px', borderRadius: 5, fontSize: 11, fontWeight: 800, textAlign: 'center' }}>{s.ticker}</span>
              <span style={{ fontSize: 11, color: '#e2e8f0' }}>{s.name}</span>
              <span style={{ fontSize: 10, color: '#64748b', background: '#020617', padding: '2px 8px', borderRadius: 4, textAlign: 'center' }}>{s.category}</span>
              <span className="font-mono" style={{ fontSize: 11, fontWeight: 600 }}>{fU(s.price)}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <input type="number" value={s.allocation} onChange={e => updateAllocation(s.id, e.target.value)}
                  style={{ width: 42, padding: '4px 6px', background: '#020617', border: '1px solid #334155', borderRadius: 6, color: '#f1f5f9', fontSize: 12, fontFamily: "'JetBrains Mono',monospace", textAlign: 'center' }} />
                <span style={{ fontSize: 10, color: '#64748b' }}>%</span>
              </div>
              <span className="font-mono" style={{ fontSize: 10, fontWeight: 600, color: s.color }}>{fmt(amt)}</span>
              <button onClick={() => removeStock(s.id)} style={{ background: '#e6394618', border: '1px solid #e6394633', borderRadius: 6, color: '#e63946', cursor: 'pointer', padding: '3px 6px', fontSize: 10 }}>✕</button>
            </div>
          );
        })}

        {/* Visual bar */}
        <div style={{ marginTop: 12, height: 10, borderRadius: 5, overflow: 'hidden', display: 'flex' }}>
          {stocks.map(s => (<div key={s.id} style={{ width: `${s.allocation / Math.max(totalAlloc, 1) * 100}%`, background: s.color, transition: 'width 0.3s' }} title={`${s.ticker}: ${s.allocation}%`} />))}
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
          {stocks.map(s => (<div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 9, color: '#94a3b8' }}><div style={{ width: 8, height: 8, borderRadius: 2, background: s.color }} />{s.ticker} {s.allocation}%</div>))}
        </div>
      </div>

      {/* Add Stock */}
      <div className="card" style={{ marginBottom: 12 }}>
        <div className="card-title">Agregar nueva inversión</div>
        <AddStockForm onAdd={addStock} />
        <div style={{ marginTop: 10, padding: 8, background: '#020617', borderRadius: 8, fontSize: 10, color: '#64748b' }}>
          💡 Al agregar una inversión, ajusta los porcentajes para que sumen 100%. El sistema reparte tu inversión mensual automáticamente.
        </div>
      </div>

      {/* Presets */}
      <div className="card">
        <div className="card-title">Configuraciones rápidas</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {[
            { l: 'Solo IVV (100%)', s: [{ t: 'IVV', a: 100 }] },
            { l: 'IVV + Big Tech', s: [{ t: 'IVV', a: 50 }, { t: 'AAPL', a: 17 }, { t: 'MSFT', a: 17 }, { t: 'AMZN', a: 16 }] },
            { l: 'Diversificado', s: [{ t: 'IVV', a: 40 }, { t: 'AAPL', a: 12 }, { t: 'MSFT', a: 12 }, { t: 'AMZN', a: 12 }, { t: 'GOOGL', a: 12 }, { t: 'QQQ', a: 12 }] },
          ].map(p => (
            <button key={p.l} onClick={() => applyPreset(p.s)} style={{ padding: '8px 14px', background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#e2e8f0', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
              {p.l}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function AddStockForm({ onAdd }: { onAdd: (t: string, n: string, p: string, a: string, c: string) => void }) {
  const fields = [
    { key: 'ticker', label: 'Ticker *', ph: 'GOOGL', w: '100px' },
    { key: 'name', label: 'Nombre', ph: 'Alphabet Inc.', w: '1fr' },
    { key: 'price', label: 'Precio USD *', ph: '195.00', w: '100px' },
    { key: 'alloc', label: 'Porcentaje %', ph: '10', w: '80px' },
  ];

  return (
    <form onSubmit={e => {
      e.preventDefault();
      const fd = new FormData(e.currentTarget);
      onAdd(fd.get('ticker') as string, fd.get('name') as string, fd.get('price') as string, fd.get('alloc') as string, fd.get('cat') as string);
      e.currentTarget.reset();
    }} style={{ display: 'grid', gridTemplateColumns: '100px 1fr 100px 80px 120px auto', gap: 8, alignItems: 'end' }}>
      {fields.map(f => (
        <div key={f.key}>
          <div style={{ fontSize: 9, color: '#64748b', marginBottom: 3 }}>{f.label}</div>
          <input name={f.key} placeholder={f.ph} style={{ width: '100%', padding: '8px 10px', background: '#020617', border: '1px solid #334155', borderRadius: 8, color: '#f1f5f9', fontSize: 12, fontFamily: "'JetBrains Mono',monospace" }} />
        </div>
      ))}
      <div>
        <div style={{ fontSize: 9, color: '#64748b', marginBottom: 3 }}>Categoría</div>
        <select name="cat" defaultValue="Growth" style={{ width: '100%', padding: '8px 10px', background: '#020617', border: '1px solid #334155', borderRadius: 8, color: '#f1f5f9', fontSize: 12 }}>
          <option value="Core">Core</option><option value="Growth">Growth</option>
          <option value="Internacional">Internacional</option><option value="Cobertura">Cobertura</option>
        </select>
      </div>
      <button type="submit" style={{ padding: '8px 16px', background: 'linear-gradient(135deg,#4361ee,#7209b7)', border: 'none', borderRadius: 8, color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', height: 38 }}>+ Agregar</button>
    </form>
  );
}
