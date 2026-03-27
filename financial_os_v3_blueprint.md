# FINANCIAL OS v3.0 — BLUEPRINT ACTUALIZADO
## Sin APV (5 años) · Acciones Individuales · Alertas Dólar · Fintual

---

## 0. PERFIL ACTUALIZADO

| Parámetro | Valor |
|---|---|
| Sueldo bruto | $1.326.000 CLP |
| Sueldo líquido | ~$1.075.000 CLP |
| Plataforma | Fintual |
| Portafolio actual | IVV US$675 ($624.867 CLP) |
| APV | **DESACTIVADO por 5 años** |
| Horizonte | Largo plazo (15-20+ años) |

---

## 1. NUEVA ESTRATEGIA DE INVERSIÓN

### 1.1 Distribución mensual del sueldo (~$1.075.000 líquido)

**Sin APV, todo el presupuesto de inversión va a acciones:**

| Destino | Monto | % líquido | Detalle |
|---|---|---|---|
| **IVV** (S&P 500) | $175.000 | 16% | Core — DCA mensual fijo |
| **AAPL** (Apple) | $59.500 | 6% | Growth — Big Tech individual |
| **MSFT** (Microsoft) | $59.500 | 6% | Growth — Big Tech individual |
| **AMZN** (Amazon) | $56.000 | 5% | Growth — Big Tech individual |
| Gastos de vida | $725.000 | 67% | Fijos + variables + personal |
| **Total inversión** | **$350.000** | **33%** | — |

### 1.2 Asignación del portafolio

| Activo | Ticker | Peso objetivo | Categoría | Justificación |
|---|---|---|---|---|
| iShares S&P 500 | IVV | 50% | Core | Base diversificada, 500 empresas |
| Apple | AAPL | 17% | Growth | Ecosistema + servicios + IA |
| Microsoft | MSFT | 17% | Growth | Cloud Azure + IA + enterprise |
| Amazon | AMZN | 16% | Growth | AWS + e-commerce + IA |

### 1.3 Datos de mercado actuales (26 Mar 2026)

| Acción | Precio | Máx 52sem | Mín 52sem | Drawdown | Cambio 1Y |
|---|---|---|---|---|---|
| IVV | US$648.14 | US$670 | US$490 | -3.2% | +13.76% |
| AAPL | US$253.74 | US$288.62 | US$169.21 | -12.1% | +11.37% |
| MSFT | US$370.33 | US$555.45 | US$344.79 | -33.3% | -8.2% |
| AMZN | US$210.96 | US$258.60 | US$161.38 | -18.4% | +11.05% |
| USD/CLP | $913.83 | $1.008,36 | $850,90 | — | -0.33% |

**Observación clave:** MSFT está con -33% de drawdown desde máximos. Según el scoring, es la mayor oportunidad de compra en este momento. AMZN con -18% también presenta oportunidad. IVV y AAPL están más cerca de máximos.

### 1.4 Scoring de oportunidad por acción

El sistema evalúa cada acción individualmente para redistribuir peso dentro del DCA mensual:

**Fórmula:** `Score = |Drawdown| × 2 + (100 - %SobreMínimo) × 0.3`

| Acción | Drawdown | Desde mín | Score | Recomendación |
|---|---|---|---|---|
| MSFT | -33.3% | +7.4% | 94 | 🔴 COMPRAR AGRESIVO — redirigir peso extra |
| AMZN | -18.4% | +30.7% | 58 | 🟡 REFORZAR — mantener o subir peso |
| AAPL | -12.1% | +49.9% | 39 | 🔵 DCA NORMAL — mantener asignación |
| IVV | -3.2% | +32.3% | 27 | 🟢 DCA NORMAL — mantener asignación |

**Redistribución sugerida este mes (basada en scoring):**

| Acción | Peso normal | Peso ajustado | Monto ajustado |
|---|---|---|---|
| IVV | 50% ($175K) | 45% ($157.5K) | -$17.5K |
| AAPL | 17% ($59.5K) | 13% ($45.5K) | -$14K |
| MSFT | 17% ($59.5K) | 25% ($87.5K) | +$28K |
| AMZN | 16% ($56K) | 17% ($59.5K) | +$3.5K |

---

## 2. SISTEMA DE ALERTAS DE DÓLAR (USD/CLP)

### 2.1 Contexto

El dólar CLP impacta doblemente tu inversión:
1. **Compras en USD**: si el dólar sube, compras menos acciones con los mismos CLP
2. **Valor del portafolio**: si el dólar sube, tu portafolio vale más en CLP (pero es ilusión)

Rango 52 semanas: $850,90 — $1.008,36
Dólar observado hoy (BCCh): $913,83
Analistas proyectan cierre 2026: $820-$880

### 2.2 Sistema de alertas por zonas

| Zona (USD/CLP) | Señal | Acción | Lógica |
|---|---|---|---|
| < $860 | 🟢 COMPRAR USD | Comprar dólares agresivo, adelantar inversiones | Dólar cerca de mínimos, máxima oportunidad |
| $860 - $900 | 🔵 BUEN MOMENTO | Comprar USD gradualmente, DCA normal | Bajo el promedio, buen precio |
| $900 - $940 | 🟡 NEUTRAL | DCA regular, no adelantar ni posponer | Precio promedio, mantener plan |
| $940 - $980 | 🟠 CARO | Reducir compras USD, usar CLP disponible | Sobre el promedio, esperar si puedes |
| > $980 | 🔴 MUY CARO | No comprar USD, esperar corrección | Cerca de máximos 52 semanas |

### 2.3 Fórmula del scoring de dólar

```
// Google Apps Script o Notion
let(
  dolar, prop("Dólar CLP"),
  low52, 850.90,
  high52, 1008.36,
  promedio, (low52 + high52) / 2,
  posicion, (dolar - low52) / (high52 - low52) * 100,

  if(posicion < 10, "🟢 COMPRAR USD AGRESIVO — Mínimos 52 semanas",
    if(posicion < 30, "🔵 BUEN MOMENTO — Bajo promedio",
      if(posicion < 55, "🟡 NEUTRAL — Precio promedio",
        if(posicion < 80, "🟠 CARO — Sobre promedio",
          "🔴 MUY CARO — Cerca de máximos"))))
)
```

### 2.4 Google Apps Script — Alerta de dólar

```javascript
function checkDollarAlert() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Mercado");
  const dolar = sheet.getRange("E1").getValue(); // GOOGLEFINANCE("CURRENCY:USDCLP")
  const low52 = 850.90;
  const high52 = 1008.36;
  const position = ((dolar - low52) / (high52 - low52)) * 100;

  let alert = "";
  let action = "";

  if (position < 10) {
    alert = "🟢 DÓLAR EN MÍNIMOS";
    action = "COMPRAR USD agresivo — Adelantar inversiones en Fintual";
  } else if (position < 30) {
    alert = "🔵 DÓLAR BARATO";
    action = "Buen momento para comprar USD — DCA normal + extra";
  } else if (position > 80) {
    alert = "🔴 DÓLAR EN MÁXIMOS";
    action = "NO comprar USD — Esperar corrección para invertir";
  } else if (position > 55) {
    alert = "🟠 DÓLAR CARO";
    action = "Reducir compras USD — Posponer inversiones si puedes";
  }

  if (alert) {
    const message =
      `${alert}\n\n` +
      `💵 USD/CLP: $${dolar.toFixed(0)}\n` +
      `📊 Posición: ${position.toFixed(0)}% del rango 52 semanas\n` +
      `📉 Mín: $${low52} | Máx: $${high52}\n\n` +
      `✅ ${action}`;

    MailApp.sendEmail("tu@email.com", `Alerta Dólar: ${alert}`, message);
  }
}
```

---

## 3. SISTEMA ANTI-CRISIS ACTUALIZADO

### Señales combinadas (Mercado + Dólar)

| Señal mercado | Señal dólar | Acción combinada |
|---|---|---|
| 🟢 Normal | 🟡 Neutral | DCA regular $350K |
| 🔵 Leve dip | 🟢 Dólar barato | 1.5x DCA + comprar USD extra |
| 🟡 Corrección | 🟡 Neutral | 2x DCA, redistribuir hacia mayor drawdown |
| 🟡 Corrección | 🟢 Dólar barato | 2x DCA agresivo — doble oportunidad |
| 🔴 Crisis | Cualquiera | Máximo posible → acción con mayor drawdown |
| 🟢 Normal | 🔴 Dólar caro | DCA normal pero considerar timing del mes |

---

## 4. PROYECCIONES SIN APV

### Escenario base: $350K/mes, 10% retorno anual, sin APV

| Año | Aportado | Valor proyectado | Ganancia |
|---|---|---|---|
| 2026 (fin) | $4.200.000 | $4.800.000 | $600.000 |
| 2028 | $12.600.000 | $17.500.000 | $4.900.000 |
| 2030 | $21.000.000 | $36.000.000 | $15.000.000 |
| 2033 | $29.400.000 | $65.000.000 | $35.600.000 |
| 2035 | $42.000.000 | $130.000.000 | $88.000.000 |
| 2040 | $63.000.000 | $350.000.000 | $287.000.000 |

### Comparativa: Sin APV vs Con APV

| Métrica (10 años) | Sin APV (100% acciones) | Con APV ($230K APV + $120K acciones) |
|---|---|---|
| Inversión mensual en acciones | $350.000 | $120.000 |
| Retorno esperado acciones | ~10-12% | ~10-12% |
| Retorno esperado APV | — | ~6-8% (fondos balanceados) |
| Bono estatal acumulado | $0 | ~$4.118.880 |
| Flexibilidad de retiro | Total | Penalizado antes de jubilar |
| Valor a 10 años | ~$65M-80M | ~$45M-55M |

**Conclusión:** Sin APV pierdes ~$4M en bonos estatales a 10 años, pero ganas más exposición a acciones de alto crecimiento. Si tu horizonte es 15+ años y no necesitas la plata antes de jubilar, ambas opciones son válidas. Las acciones individuales tienen más upside pero también más riesgo que el fondo APV.

---

## 5. RUTINA OPERATIVA ACTUALIZADA

| Frecuencia | Acción | Tiempo |
|---|---|---|
| Diaria | Revisar alerta de mercado + dólar (Telegram) | 1 min |
| Mensual día 1 | Depositar en Fintual: IVV $175K, AAPL $59.5K, MSFT $59.5K, AMZN $56K | 15 min |
| Mensual día 1 | Ajustar pesos si scoring de oportunidad indica redistribución | 5 min |
| Mensual día 5 | Actualizar Notion: snapshot, flujo de caja, transacciones | 20 min |
| Trimestral | Revisar drawdowns, rebalancear si desviación >5% | 30 min |
| Anual | Revisión completa: reevaluar acciones, considerar reactivar APV | 2 horas |
