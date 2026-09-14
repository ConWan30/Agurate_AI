/**
 * Normalize assessment stress_level labels from AI / DB variants.
 * Returns '' when unrecognized — UI should show "not recorded", never invent severity.
 */
export type NormalizedStressLevel = 'healthy' | 'moderate' | 'severe' | '';

export function normalizeStressLevel(
  stressLevel: string | null | undefined
): NormalizedStressLevel {
  const raw = (stressLevel || '').trim().toLowerCase();
  if (raw === 'healthy' || raw === 'none' || raw === 'low') return 'healthy';
  if (raw === 'moderate' || raw === 'medium' || raw === 'mild') return 'moderate';
  if (raw === 'severe' || raw === 'critical' || raw === 'high') return 'severe';
  return '';
}
