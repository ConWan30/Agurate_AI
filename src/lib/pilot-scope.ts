/**
 * Closed-beta wedge: one parish + one crop until field validation exists.
 * Morehouse Parish (NE Louisiana) + soybean — dominant local acreage and a
 * scouting problem (e.g. frogeye) where phone photos are useful.
 */

export const PILOT_PARISH = 'Morehouse' as const;
export const PILOT_PARISH_LABEL = 'Morehouse Parish, Louisiana' as const;

export const PILOT_CROP = 'soybean' as const;
export const PILOT_CROP_LABEL = 'Soybeans' as const;

/** Canonical crop_type values accepted during the pilot. */
export const PILOT_CROP_TYPES = [PILOT_CROP] as const;
export type PilotCropType = (typeof PILOT_CROP_TYPES)[number];

export const PILOT_CROP_OPTIONS: ReadonlyArray<{ value: PilotCropType; label: string }> = [
  { value: PILOT_CROP, label: PILOT_CROP_LABEL },
];

/** Approximate parish centroid for demo/map defaults (Bastrop area) — not a claimed farm GPS. */
export const PILOT_MAP_DEFAULT = {
  lat: 32.7785,
  lng: -91.8723,
  label: 'Morehouse Parish (map default)',
} as const;

export const PILOT_TAGLINE =
  'Closed beta · Morehouse Parish soybeans · Research decision aid' as const;

export const PILOT_SCOPE_SUMMARY =
  'This closed beta is scoped to soybean fields in Morehouse Parish, Louisiana. Other crops and advanced modules stay in the repo but are deferred until this wedge is field-validated.' as const;

/**
 * Farmer-facing routes kept in the primary navigation during the pilot.
 * Deferred modules remain routable for operators/devs but are labeled and
 * redirected from nav toward an honest "coming after validation" page.
 */
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
  '/delta',
  '/delta-intelligence',
  '/pilot-deferred',
] as const;

/** Modules parked for post-validation — too many invent surfaces for a one-crop pilot. */
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
    throw new Error(
      `Closed beta accepts ${PILOT_CROP_LABEL} only (${PILOT_PARISH_LABEL}). Other crops are deferred.`
    );
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
