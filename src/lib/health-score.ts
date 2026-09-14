/**
 * Canonical crop health / confidence scores are stored as 0–100
 * (see assessments_health_score_check). AI models often emit 0–1 fractions.
 */

/** Normalize any raw score to 0–100. Values in (0, 1] are treated as fractions. */
export function toHealthPercent(score: number | null | undefined): number {
  if (score == null || Number.isNaN(Number(score))) return 0;
  const n = Number(score);
  if (n < 0) return 0;
  if (n <= 1) return Math.round(n * 1000) / 10;
  return Math.min(100, Math.round(n * 10) / 10);
}

/** True when a score is usable for persistence (not null/NaN). 0 is a valid score. */
export function hasHealthScore(score: unknown): score is number {
  return score != null && !Number.isNaN(Number(score));
}

/** Fail-closed helper for persist paths — throws if AI omitted the score. */
export function requireHealthScore(score: unknown, label = 'health_score'): number {
  if (!hasHealthScore(score)) {
    throw new Error(`AI analysis did not return a ${label}`);
  }
  return toHealthPercent(score);
}

/** 0–1 fraction for math that expects a ratio. */
export function toHealthFraction(score: number | null | undefined): number {
  return toHealthPercent(score) / 100;
}

/** Display helper, e.g. "72%". Missing scores render as an em dash — never invent 0%. */
export function formatHealthPercent(
  score: number | null | undefined,
  digits = 0
): string {
  if (!hasHealthScore(score)) return '—';
  return `${toHealthPercent(score).toFixed(digits)}%`;
}

export function healthTone(
  score: number | null | undefined
): 'good' | 'moderate' | 'severe' | 'unknown' {
  if (!hasHealthScore(score)) return 'unknown';
  const pct = toHealthPercent(score);
  if (pct >= 75) return 'good';
  if (pct >= 50) return 'moderate';
  return 'severe';
}
