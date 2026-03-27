import { useState, useEffect } from 'react';
import { fmt } from '../../utils/formatters';
import { getMarketSignal, getDollarSignal } from '../../utils/scoring';
import { api } from '../../services/api';
import type { Stock } from '../../utils/scoring';

interface Props {
  stocks: Stock[];
  monthlyBudget: number;
  dollar: { current: number; high52: number; low52: number };
  marketScore: number;
}

export default function TelegramTab({ stocks, monthlyBudget, dollar, marketScore }: Props) {
  const [tgToken, setTgToken] = useState('');
  const [tgChatId, setTgChatId] = useState('');
  const [tgAlerts, setTgAlerts] = useState({ market: true, dollar: true, stocks: true, daily: true });
  const [tgConnected, setTgConnected] = useState(false);
  const [tgTestSent, setTgTestSent] = useState(false);
  const [tgStatus, setTgStatus] = useState('');
  const [saving, setSaving] = useState(false);

  const signal = getMarketSignal(marketScore);
  const dSig = getDollarSignal(dollar.current);
  const totalWealth = stocks.reduce((s, x) => s + x.owned * x.price * dollar.current, 0) + 150000;

  // Check Telegram status on mount
  useEffect(() => {
    api.getTelegramStatus().then(status => {
      if (status.connected) {
        setTgConnected(true);
        setTgStatus('✅ Bot conectado y funcionando');
      }
    }).catch(() => {});
  }, []);

  const handleConnect = async () => {
    if (!tgToken || !tgChatId) {
      setTgStatus('⚠️ Ingresa el token y Chat ID');
      return;
    }
    setSaving(true);
    try {
      await api.connectTelegram(tgToken, tgChatId);
      setTgConnected(true);
      setTgStatus('✅ Bot conectado correctamente');
    } catch (e: any) {
      setTgStatus(`❌ Error: ${e.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    setSaving(true);
    try {
      await api.testTelegram();
      setTgTestSent(true);
      setTgStatus('✅ Mensaje de prueba enviado — revisa tu Telegram');
    } catch (e: any) {
      setTgStatus(`❌ Error enviando test: ${e.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleAlert = async (key: string, value: boolean) => {
    setTgAlerts({ ...tgAlerts, [key]: value });
    try {
      await api.updateAlerts({ [key]: value });
    } catch {
      // Offline: keep local state
    }
  };

  return (
    <div className="animate-in">
      <div className="narrative-box">
        <span className="narrative-icon">🤖</span>
        <p className="narrative-text">
          Conecta un bot de Telegram para recibir <strong>alertas automáticas</strong> en tu celular.
          Te avisará cuando haya oportunidades de compra, cuando el dólar cambie de zona,
          y te enviará un <strong>resumen diario</strong> a las 18:00 con todo lo que necesitas saber.
        </p>
      </div>

      {tgStatus && (
        <div style={{ padding: '8px 14px', background: tgStatus.includes('✅') ? '#06d6a010' : tgStatus.includes('❌') ? '#e6394610' : '#e9c46a10', border: `1px solid ${tgStatus.includes('✅') ? '#06d6a033' : tgStatus.includes('❌') ? '#e6394633' : '#e9c46a33'}`, borderRadius: 8, marginBottom: 12, fontSize: 11, color: '#e2e8f0' }}>
          {tgStatus}
        </div>
      )}

      <div className="grid-2" style={{ marginBottom: 12 }}>
        {/* Connection */}
        <div className="card">
          <div className="card-title">🤖 Conectar tu Bot de Telegram</div>
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 10, color: '#64748b', marginBottom: 4 }}>
              Token del Bot
              <span className="help-trigger">?<span className="help-tooltip">Es la clave que te da Telegram cuando creas un bot con @BotFather. Algo como: 123456:ABC-DEF...</span></span>
            </div>
            <input value={tgToken} onChange={e => setTgToken(e.target.value)} placeholder="123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
              style={{ width: '100%', padding: '10px 12px', background: '#020617', border: '1px solid #334155', borderRadius: 8, color: '#f1f5f9', fontSize: 11, fontFamily: "'JetBrains Mono',monospace" }} />
          </div>
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 10, color: '#64748b', marginBottom: 4 }}>
              Chat ID
              <span className="help-trigger">?<span className="help-tooltip">Es tu número de usuario en Telegram. Lo obtienes enviando un mensaje a tu bot y revisando la API.</span></span>
            </div>
            <input value={tgChatId} onChange={e => setTgChatId(e.target.value)} placeholder="123456789"
              style={{ width: '100%', padding: '10px 12px', background: '#020617', border: '1px solid #334155', borderRadius: 8, color: '#f1f5f9', fontSize: 11, fontFamily: "'JetBrains Mono',monospace" }} />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={handleConnect} disabled={saving} style={{
              flex: 1, padding: 10, background: tgConnected ? '#06d6a022' : 'linear-gradient(135deg,#4361ee,#7209b7)',
              border: tgConnected ? '1px solid #06d6a044' : 'none', borderRadius: 8,
              color: tgConnected ? '#06d6a0' : '#fff', fontSize: 12, fontWeight: 700, cursor: saving ? 'wait' : 'pointer',
              opacity: saving ? 0.7 : 1
            }}>
              {saving ? '⏳ Conectando...' : tgConnected ? '✅ Conectado' : 'Conectar Bot'}
            </button>
            <button onClick={handleTest} disabled={!tgConnected || saving} style={{
              padding: '10px 16px', background: tgConnected ? '#1e293b' : '#0f172a',
              border: '1px solid #334155', borderRadius: 8, color: tgConnected ? '#e2e8f0' : '#475569',
              fontSize: 12, fontWeight: 600, cursor: tgConnected && !saving ? 'pointer' : 'not-allowed'
            }}>
              {tgTestSent ? '✅ Enviado' : 'Enviar Test'}
            </button>
          </div>
          {!tgConnected && (
            <div style={{ marginTop: 12, padding: 10, background: '#020617', borderRadius: 8, fontSize: 10, color: '#94a3b8', lineHeight: 1.6 }}>
              <strong style={{ color: '#e2e8f0' }}>¿Cómo configurar?</strong><br />
              1. Abre Telegram y busca <strong>@BotFather</strong><br />
              2. Envía <code>/newbot</code> y sigue las instrucciones<br />
              3. Copia el token y pégalo arriba<br />
              4. Envía cualquier mensaje a tu nuevo bot<br />
              5. Ve a <code>api.telegram.org/bot{'<TOKEN>'}/getUpdates</code><br />
              6. Busca tu Chat ID en la respuesta JSON
            </div>
          )}
        </div>

        {/* Alert Config */}
        <div className="card">
          <div className="card-title">¿Qué alertas quieres recibir?</div>
          {[
            { key: 'market', icon: '🌡️', label: 'Alertas del mercado', desc: 'Cuando hay oportunidad de compra (score > 15)' },
            { key: 'dollar', icon: '💵', label: 'Alertas del dólar', desc: 'Cuando el dólar está barato (<$860) o muy caro (>$980)' },
            { key: 'stocks', icon: '📊', label: 'Alertas de acciones', desc: 'Cuando una acción tiene score > 60 (muy barata)' },
            { key: 'daily', icon: '📋', label: 'Resumen diario (18:00)', desc: 'Un resumen completo todos los días hábiles' },
          ].map(a => (
            <div key={a.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #0f172a' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 18 }}>{a.icon}</span>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#e2e8f0' }}>{a.label}</div>
                  <div style={{ fontSize: 10, color: '#64748b' }}>{a.desc}</div>
                </div>
              </div>
              <button onClick={() => handleToggleAlert(a.key, !tgAlerts[a.key as keyof typeof tgAlerts])}
                style={{ width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer', position: 'relative', background: tgAlerts[a.key as keyof typeof tgAlerts] ? '#4361ee' : '#1e293b', transition: 'background 0.2s' }}>
                <div style={{ width: 18, height: 18, borderRadius: 9, background: '#f1f5f9', position: 'absolute', top: 3, left: tgAlerts[a.key as keyof typeof tgAlerts] ? 23 : 3, transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Message Preview */}
      <div className="card" style={{ marginBottom: 12 }}>
        <div className="card-title">Así se verá tu resumen diario en Telegram</div>
        <div className="font-mono" style={{ background: '#020617', borderRadius: 10, padding: 16, fontSize: 11, lineHeight: 1.8, color: '#e2e8f0', maxWidth: 500 }}>
          <div style={{ color: '#4361ee', fontWeight: 700, marginBottom: 4 }}>📊 Tu Resumen Financiero — {new Date().toLocaleDateString('es-CL')}</div>
          <div style={{ borderBottom: '1px solid #1e293b', paddingBottom: 6, marginBottom: 6 }}>
            <div>💰 Tu portafolio vale: {fmt(Math.round(totalWealth))}</div>
            <div>💵 Dólar hoy: ${dollar.current.toFixed(0)} ({dSig.label})</div>
            <div>🌡️ Mercado: {marketScore}/100 — {signal.label}</div>
          </div>
          <div style={{ color: '#94a3b8', marginBottom: 6 }}>📈 Tus acciones hoy:</div>
          {stocks.map(s => {
            const dd = Math.abs(((s.price - s.high52) / s.high52) * 100);
            return (
              <div key={s.id} style={{ color: s.color }}>
                {'  '}{s.ticker}: US${s.price.toFixed(2)}
                {dd > 15 ? ` — ¡${dd.toFixed(0)}% más barata!` : dd > 5 ? ` — ${dd.toFixed(0)}% bajo máximo` : ' — estable'}
              </div>
            );
          })}
          <div style={{ borderTop: '1px solid #1e293b', paddingTop: 6, marginTop: 6 }}>
            <div style={{ color: '#06d6a0' }}>✅ ¿Qué hacer? {signal.action} — {fmt(monthlyBudget)} DCA</div>
          </div>
        </div>
      </div>

      {/* Alert Examples */}
      <div className="grid-3">
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 24, marginBottom: 6 }}>🌡️</div>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#e2e8f0', marginBottom: 2 }}>Alerta de Mercado</div>
          <div className="font-mono" style={{ background: '#020617', borderRadius: 8, padding: 10, fontSize: 10, color: '#e9c46a', lineHeight: 1.6, textAlign: 'left' }}>
            🟡 OPORTUNIDAD<br />Score: 38/100<br />El mercado bajó un poco<br />→ Podrías invertir el doble
          </div>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 24, marginBottom: 6 }}>💵</div>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#e2e8f0', marginBottom: 2 }}>Alerta de Dólar</div>
          <div className="font-mono" style={{ background: '#020617', borderRadius: 8, padding: 10, fontSize: 10, color: '#06d6a0', lineHeight: 1.6, textAlign: 'left' }}>
            🟢 DÓLAR BARATO<br />USD/CLP: $855<br />Cerca de mínimos del año<br />→ ¡Compra dólares ahora!
          </div>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 24, marginBottom: 6 }}>📊</div>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#e2e8f0', marginBottom: 2 }}>Alerta por Acción</div>
          <div className="font-mono" style={{ background: '#020617', borderRadius: 8, padding: 10, fontSize: 10, color: '#e63946', lineHeight: 1.6, textAlign: 'left' }}>
            🔴 MSFT: Score 94<br />Precio: $370 | Caída: -33%<br />Muy barata vs máximo<br />→ GRAN OPORTUNIDAD
          </div>
        </div>
      </div>
    </div>
  );
}
