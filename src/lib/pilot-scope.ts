/**
 * Public product scope and evidence guardrails.
 * AgurateAI is publicly accessible while crop-analysis claims remain bounded by available validation evidence.
 */

export const PILOT_PARISH = 'Morehouse' as const;
export const PILOT_PARISH_LABEL = 'Morehouse Parish, Louisiana' as const;

export const PILOT_CROP = 'soybean' as const;
export const PILOT_CROP_LABEL = 'Soybeans' as const;

export const PILOT_CROP_TYPES = [PILOT_CROP] as const;
export type PilotCropType = (typeof PILOT_CROP_TYPES)[number];

export const PILOT_CROP_OPTIONS: ReadonlyArray<{ value: PilotCropType; label: string }> = [
  { value: PILOT_CROP, label: PILOT_CROP_LABEL },
];

export const PILOT_MAP_DEFAULT = {
  lat: 32.7785,
  lng: -91.8723,
  label: 'Morehouse Parish (map default)',
} as const;

export const PILOT_TAGLINE = 'Public access · Agricultural decision aid' as const;

export const PILOT_SCOPE_SUMMARY =
  'AgurateAI is publicly accessible. Current crop-analysis evidence is scoped conservatively; observations are decision aids, not diagnoses.' as const;

export const PILOT_CORE_PATHS = [
  '/dashboard',
  '/upload',
  '/scanner',
  '/fields',
  '/field-map',
  '/weather-timeline',
  '/history',
  '/how-it-works',
  '/profile',
  '/tutorials',
  '/pilot-deferred',
  '/auth',
] as const;

/** Modules not currently part of the primary public experience. */
export const PILOT_DEFERRED_PATHS = [
  '/predictions',
  '/insurance',
  '/cooperatives',
  '/conservation-practices',
  '/analytics',
  '/beta-metrics',
  '/lsu-researchers',
  '/conversational-forms-analytics',
  '/upgrade',
  '/delta',
  '/delta-intelligence',
] as const;

export function isPilotCrop(crop: string | null | undefined): crop is PilotCropType {
  if (!crop) return false;
  const normalized = crop.trim().toLowerCase() === 'soybeans' ? 'soybean' : crop.trim().toLowerCase();
  return (PILOT_CROP_TYPES as readonly string[]).includes(normalized);
}

export function normalizePilotCrop(crop: string | null | undefined): PilotCropType | null {
  if (!crop) return null;
  const normalized = crop.trim().toLowerCase() === 'soybeans' ? 'soybean' : crop.trim().toLowerCase();
  return isPilotCrop(normalized) ? normalized : null;
}

export function requirePilotCrop(crop: string | null | undefined): PilotCropType {
  const normalized = normalizePilotCrop(crop);
  if (!normalized) {
    throw new Error(`Current validated analysis accepts ${PILOT_CROP_LABEL} only (${PILOT_PARISH_LABEL}). Other crops are not yet validated.`);
  }
  return normalized;
}

export function isPilotDeferredPath(pathname: string): boolean {
  return (PILOT_DEFERRED_PATHS as readonly string[]).some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );
}

export function isPilotCorePath(pathname: string): boolean {
  return (PILOT_CORE_PATHS as readonly string[]).some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );
}

export function pilotNavHref(pathname: string): string {
  return isPilotDeferredPath(pathname) ? '/pilot-deferred' : pathname;
}
