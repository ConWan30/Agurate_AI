/**
 * Model confidence display. Accepts 0–1 fractions or 0–100 percents.
 * Out-of-range invent is shown as not recorded — never clamped to 100%.
 */
export function formatConfidencePercent(raw: unknown): string {
  if (raw == null || raw === '') return '—';
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0 || n > 100) return '—';
  const pct = n <= 1 ? n * 100 : n;
  return `${Math.round(pct)}%`;
}

export type NormalizedRiskLevel = 'low' | 'medium' | 'high' | '';

export function normalizeRiskLevel(
  riskLevel: string | null | undefined
): NormalizedRiskLevel {
  const raw = (riskLevel || '').trim().toLowerCase();
  if (raw === 'low') return 'low';
  if (raw === 'medium' || raw === 'moderate') return 'medium';
  if (raw === 'high' || raw === 'severe' || raw === 'critical') return 'high';
  return '';
}
