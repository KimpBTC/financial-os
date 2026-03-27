// ═══ Number Formatters for Chilean Financial Context ═══

export const fmt = (n: number): string =>
  `$${n.toLocaleString('es-CL')}`;

export const fK = (n: number): string =>
  n >= 1e6 ? `$${(n / 1e6).toFixed(1)}M` :
  n >= 1e3 ? `$${(n / 1e3).toFixed(0)}K` :
  `$${n}`;

export const fU = (n: number): string =>
  `US$${n.toFixed(2)}`;

export const fPct = (n: number): string =>
  `${n >= 0 ? '+' : ''}${n.toFixed(1)}%`;

export const formatDate = (d: Date): string =>
  d.toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' });
