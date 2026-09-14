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
  if (
    raw === 'moderate' ||
    raw === 'medium' ||
    raw === 'mild' ||
    raw === 'moderate_stress'
  ) {
    return 'moderate';
  }
  if (
    raw === 'severe' ||
    raw === 'critical' ||
    raw === 'high' ||
    raw === 'severe_stress'
  ) {
    return 'severe';
  }
  return '';
}

/** Badge type for UI — unknown stress must not invent "severe". */
export function stressBadgeType(
  stressLevel: string | null | undefined
): 'healthy' | 'moderate' | 'severe' | 'unknown' {
  const normalized = normalizeStressLevel(stressLevel);
  return normalized || 'unknown';
}

/** Short display label; empty when stress was not recorded. */
export function formatStressLabel(
  stressLevel: string | null | undefined
): string {
  switch (normalizeStressLevel(stressLevel)) {
    case 'healthy':
      return 'Healthy';
    case 'moderate':
      return 'Moderate';
    case 'severe':
      return 'Severe';
    default:
      return '';
  }
}
