/**
 * Percent scores persisted on assessments (yield impact, canopy coverage).
 * Out-of-range values are rejected as null — never clamped into inventing 100%.
 */
export function parsePercentScore(raw: unknown): number | null {
  if (raw == null || raw === '') return null;
  const n = Number(raw);
  if (!Number.isFinite(n)) return null;
  if (n < 0 || n > 100) return null;
  return n;
}
