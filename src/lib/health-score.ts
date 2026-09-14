/**
 * Canonical crop health / confidence scores are stored as 0–100
 * (see assessments_health_score_check). AI models often emit 0–1 fractions.
 */

/** True when a score is usable for persistence/display (not null/NaN). 0 is a valid score. */
export function hasHealthScore(score: unknown): score is number {
  return score != null && !Number.isNaN(Number(score));
}

/**
 * Normalize a recorded score to 0–100.
 * Values in (0, 1] are treated as fractions. Missing scores return null — never invent 0.
 */
export function toHealthPercent(score: number): number;
export function toHealthPercent(score: number | null | undefined): number | null;
export function toHealthPercent(score: number | null | undefined): number | null {
  if (!hasHealthScore(score)) return null;
  const n = Number(score);
  if (n < 0) return null;
  if (n <= 1) return Math.round(n * 1000) / 10;
  return Math.min(100, Math.round(n * 10) / 10);
}

/** Fail-closed helper for persist paths — throws if AI omitted the score. */
export function requireHealthScore(score: unknown, label = 'health_score'): number {
  if (!hasHealthScore(score)) {
    throw new Error(`AI analysis did not return a ${label}`);
  }
  return toHealthPercent(score);
}

/** 0–1 fraction for math that expects a ratio. Null when no score was recorded. */
export function toHealthFraction(score: number | null | undefined): number | null {
  const pct = toHealthPercent(score);
  return pct == null ? null : pct / 100;
}

/** Display helper, e.g. "72%". Missing scores render as an em dash — never invent 0%. */
export function formatHealthPercent(
  score: number | null | undefined,
  digits = 0
): string {
  const pct = toHealthPercent(score);
  if (pct == null) return '—';
  return `${pct.toFixed(digits)}%`;
}

export function healthTone(
  score: number | null | undefined
): 'good' | 'moderate' | 'severe' | 'unknown' {
  const pct = toHealthPercent(score);
  if (pct == null) return 'unknown';
  if (pct >= 75) return 'good';
  if (pct >= 50) return 'moderate';
  return 'severe';
}
