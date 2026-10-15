const FRACTIONS: Record<string, number> = { '½': 0.5, '¼': 0.25, '¾': 0.75, '⅓': 1 / 3, '⅔': 2 / 3 };

function formatAmount(v: number, thirds: boolean): string {
  const step = thirds ? 1 / 3 : 0.25;
  const rounded = Math.max(step, Math.round(v / step) * step);
  const whole = Math.floor(rounded + 1e-9);
  const rest = rounded - whole;
  const frac = Object.entries(FRACTIONS).find(([, f]) => Math.abs(f - rest) < 0.01)?.[0] ?? '';
  return whole === 0 ? frac : `${whole}${frac}`;
}

/**
 * "¾ gelas" x 2 → "1½ gelas"; "2 potong sedang" x 1,5 → "3 potong sedang".
 * Dibulatkan ke ¼ (atau ⅓ bila ukuran aslinya pertigaan) — URT memang perkiraan,
 * berat gram tetap ditampilkan di sebelahnya.
 */
export function scaleHouseholdMeasure(label: string, factor: number): string {
  if (factor === 1) return label;
  const m = label.match(/^(\d+)?([½¼¾⅓⅔])?\s+(.+)$/);
  if (!m || (!m[1] && !m[2])) return `${formatAmount(factor, false)} × ${label}`;
  const value = (m[1] ? Number(m[1]) : 0) + (m[2] ? FRACTIONS[m[2]] : 0);
  const thirds = m[2] === '⅓' || m[2] === '⅔';
  return `${formatAmount(value * factor, thirds)} ${m[3]}`;
}
