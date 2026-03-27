// ═══════════════════════════════════════════════════════════════
// EXPLANATIONS — Traduce indicadores financieros a lenguaje humano
// Para usuarios que NO saben de inversiones ni finanzas
// ═══════════════════════════════════════════════════════════════

// ─── Market Score → Frase humana ───
export function explainMarketScore(score: number): string {
  if (score >= 75)
    return '¡El mercado cayó mucho! Es el mejor momento para invertir más de lo normal. Las acciones están "en oferta".';
  if (score >= 55)
    return 'Hay una buena oportunidad en el mercado. Podrías invertir un poco más de lo habitual este mes.';
  if (score >= 35)
    return 'El mercado está un poco más barato que lo normal. Buen momento para invertir tu monto mensual.';
  if (score >= 15)
    return 'El mercado tuvo una pequeña bajada. Nada preocupante — invierte con normalidad.';
  return 'El mercado está tranquilo. Mantén tu inversión mensual como siempre, todo va bien.';
}

// ─── Market Signal → Acción recomendada ───
export function explainMarketAction(score: number): { emoji: string; label: string; action: string } {
  if (score >= 75)
    return { emoji: '🔴', label: 'GRAN OPORTUNIDAD', action: 'Invierte todo lo que puedas — las acciones están muy baratas' };
  if (score >= 55)
    return { emoji: '🟠', label: 'BUENA OPORTUNIDAD', action: 'Invierte el triple de tu monto mensual si puedes' };
  if (score >= 35)
    return { emoji: '🟡', label: 'OPORTUNIDAD MODERADA', action: 'Invierte el doble de tu monto mensual' };
  if (score >= 15)
    return { emoji: '🔵', label: 'LEVE OPORTUNIDAD', action: 'Invierte un poco más que lo normal' };
  return { emoji: '🟢', label: 'TODO NORMAL', action: 'Invierte tu monto mensual como siempre' };
}

// ─── Drawdown → Explicación humana ───
export function explainDrawdown(ticker: string, dd: number): string {
  const abs = Math.abs(dd);
  if (abs > 25)
    return `${ticker} está ${abs.toFixed(0)}% más barata que su mejor precio del año — es una gran oportunidad de compra`;
  if (abs > 15)
    return `${ticker} ha bajado ${abs.toFixed(0)}% desde su precio más alto — puede ser buen momento para comprar`;
  if (abs > 5)
    return `${ticker} está un poco por debajo de su mejor precio — comportamiento normal del mercado`;
  return `${ticker} está cerca de su mejor precio del año — no hay urgencia de comprar`;
}

// ─── Stock Score → Recomendación ───
export function explainStockScore(ticker: string, score: number): { emoji: string; label: string; text: string } {
  if (score > 60)
    return {
      emoji: '🔴',
      label: 'COMPRAR AGRESIVO',
      text: `${ticker} está muy barata comparada con su precio normal. Podrías poner más dinero aquí este mes.`
    };
  if (score > 40)
    return {
      emoji: '🟡',
      label: 'REFORZAR',
      text: `${ticker} tiene un buen precio. Mantén o aumenta un poco tu inversión en ella.`
    };
  if (score > 20)
    return {
      emoji: '🔵',
      label: 'INVERSIÓN NORMAL',
      text: `${ticker} está en precio razonable. Invierte tu monto habitual, sin cambios.`
    };
  return {
    emoji: '🟢',
    label: 'MANTENER',
    text: `${ticker} está en su precio normal. No es urgente comprar más, pero tampoco vender.`
  };
}

// ─── Dollar Zone → Explicación ───
export function explainDollarZone(rate: number): { emoji: string; label: string; text: string; color: string } {
  if (rate < 860)
    return {
      emoji: '🟢',
      label: 'DÓLAR BARATO',
      text: 'El dólar está muy barato → es el mejor momento para comprar dólares e invertir en acciones de EE.UU.',
      color: '#06d6a0'
    };
  if (rate < 900)
    return {
      emoji: '🔵',
      label: 'BUEN PRECIO',
      text: 'El dólar tiene buen precio → aprovecha para hacer tu inversión mensual.',
      color: '#4cc9f0'
    };
  if (rate < 940)
    return {
      emoji: '🟡',
      label: 'PRECIO NORMAL',
      text: 'El dólar está en su precio promedio → invierte tu monto mensual como siempre.',
      color: '#e9c46a'
    };
  if (rate < 980)
    return {
      emoji: '🟠',
      label: 'DÓLAR CARO',
      text: 'El dólar está caro → si puedes, espera unos días antes de comprar para invertir.',
      color: '#f4a261'
    };
  return {
    emoji: '🔴',
    label: 'MUY CARO',
    text: 'El dólar está en máximos → mejor esperar a que baje antes de comprar.',
    color: '#e63946'
  };
}

// ─── Portfolio Health → Resumen narrativo ───
export function explainPortfolioHealth(
  totalWealth: number,
  monthlyBudget: number,
  marketScore: number,
  dollarRate: number
): string {
  const marketExplanation = explainMarketScore(marketScore);
  const dollarInfo = explainDollarZone(dollarRate);

  let summary = `Tu portafolio vale $${totalWealth.toLocaleString('es-CL')} CLP. `;
  summary += marketExplanation + ' ';
  summary += `El dólar está a $${dollarRate.toFixed(0)} (${dollarInfo.label.toLowerCase()}). `;

  if (marketScore >= 35 && dollarRate < 900) {
    summary += '¡Doble oportunidad! Mercado en descuento y dólar barato — excelente momento para invertir más.';
  } else if (marketScore < 15 && dollarRate > 940) {
    summary += 'No hay urgencia hoy. Mantén tu plan mensual y espera mejores condiciones.';
  } else {
    summary += `Tu inversión mensual de $${monthlyBudget.toLocaleString('es-CL')} sigue siendo un buen plan.`;
  }

  return summary;
}

// ─── Glossary ───
export const GLOSSARY: Record<string, string> = {
  'S&P 500': 'Un índice que agrupa las 500 empresas más grandes de Estados Unidos. Es como un "termómetro" de la economía americana.',
  'DCA': 'Dollar Cost Averaging — Invertir la misma cantidad todos los meses, sin importar si el mercado sube o baja. Es la estrategia más segura para empezar.',
  'Drawdown': 'Cuánto ha bajado una acción desde su precio más alto reciente. Si dice "-20%", significa que está 20% más barata.',
  'Portafolio': 'Tu colección de inversiones. Es como una canasta donde tienes diferentes acciones.',
  'Score': 'Una nota del 0 al 100 que indica si es buen momento para comprar. Más alto = mejor oportunidad.',
  'Dólar observado': 'El precio oficial del dólar en Chile, publicado por el Banco Central. Es el tipo de cambio de referencia.',
  'VIX': 'El "índice del miedo" del mercado. Cuando sube, los inversores están nerviosos. Cuando baja, están tranquilos.',
  'Fear & Greed': 'Un índice que va de 0 (miedo extremo) a 100 (codicia extrema). Te dice el "humor" general del mercado.',
  'ETF': 'Un fondo que agrupa muchas acciones en una sola compra. IVV es un ETF que incluye las 500 empresas del S&P 500.',
  'Bull Market': 'Cuando el mercado está subiendo de forma sostenida. Los precios suben y hay optimismo.',
  'Bear Market': 'Cuando el mercado cae más de 20%. Los precios bajan y hay pesimismo — pero también oportunidades.',
  'Patrimonio': 'El valor total de todas tus inversiones sumadas, convertidas a pesos chilenos.',
  'Asignación': 'Cómo repartes tu dinero entre diferentes inversiones. Por ejemplo: 50% en IVV, 17% en AAPL.',
  'Ticker': 'El código corto que identifica una acción. Por ejemplo, AAPL es Apple, MSFT es Microsoft.',
  'Rentabilidad': 'Cuánto has ganado (o perdido) con tu inversión, expresado en porcentaje.',
};
