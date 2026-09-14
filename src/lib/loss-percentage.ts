/**
 * Estimated loss percentage for insurance claims — self-reported 0–100.
 * Out-of-range values are rejected (null), never clamped into inventing 100%.
 */
export function parseLossPercentage(raw: unknown): number | null {
  if (raw == null || raw === '') return null;
  const n = Number(raw);
  if (!Number.isFinite(n)) return null;
  if (n < 0 || n > 100) return null;
  return n;
}

export function requireLossPercentage(raw: unknown): number {
  const n = parseLossPercentage(raw);
  if (n == null) {
    throw new Error('Estimated loss must be a number between 0 and 100');
  }
  return n;
}
