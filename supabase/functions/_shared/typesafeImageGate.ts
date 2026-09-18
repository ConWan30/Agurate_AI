import type { CropType } from './visionObservation.ts';

export type ImageGateScopeRoute =
  | 'analyze_in_wedge'
  | 'defer_out_of_wedge'
  | 'retake_image'
  | 'unknown_hold';

export interface ImageGateState {
  product: 'agurateai';
  stage: 'public';
  wedge: {
    parish: 'Morehouse';
    crop: 'soybean';
    validated: false;
  };
  request: {
    crop_type: CropType;
    parish_hint: string | null;
    field_id: string | null;
    media_type: 'image' | 'video';
    has_image_url: boolean;
    client_quality_hints: {
      declared_blurry: boolean;
      declared_too_far: boolean;
      bytes_hint: number | null;
    };
  };
  policy: {
    in_scope_only: 'Morehouse Parish soybeans';
    out_of_scope_action: 'defer_with_honesty';
    never_invent_health_score: true;
  };
}

export interface ImageGateDecision {
  image_usable: boolean;
  image_usable_probability: number | null;
  image_usable_confidence: number | null;
  scope_route: ImageGateScopeRoute;
  scope_route_confidence: number | null;
  overclaim_risk: 0 | 1 | 2;
  overclaim_risk_confidence: number | null;
  source: 'typesafe' | 'local_fallback';
  reason: string;
}

type ReadEnv = (name: string) => string | undefined;
type FetchLike = typeof fetch;

const TYPE_SAFE_API_URL = 'https://api.typesafe.ai/v1/systemone';
const TYPE_SAFE_MODEL = 'jev-latest';
const SCOPE_ROUTES: readonly ImageGateScopeRoute[] = [
  'analyze_in_wedge',
  'defer_out_of_wedge',
  'retake_image',
  'unknown_hold',
] as const;

export function buildImageGateState(input: {
  cropType: CropType;
  parishHint?: string | null;
  fieldId?: string | null;
  mediaType?: 'image' | 'video';
  imageUrl?: string | null;
  clientQualityHints?: {
    declaredBlurry?: boolean | null;
    declaredTooFar?: boolean | null;
    bytesHint?: number | null;
  } | null;
}): ImageGateState {
  return {
    product: 'agurateai',
    stage: 'public',
    wedge: { parish: 'Morehouse', crop: 'soybean', validated: false },
    request: {
      crop_type: input.cropType,
      parish_hint: input.parishHint?.trim() || null,
      field_id: input.fieldId ?? null,
      media_type: input.mediaType ?? 'image',
      has_image_url: Boolean(input.imageUrl),
      client_quality_hints: {
        declared_blurry: Boolean(input.clientQualityHints?.declaredBlurry),
        declared_too_far: Boolean(input.clientQualityHints?.declaredTooFar),
        bytes_hint: normalizeBytesHint(input.clientQualityHints?.bytesHint),
      },
    },
    policy: {
      in_scope_only: 'Morehouse Parish soybeans',
      out_of_scope_action: 'defer_with_honesty',
      never_invent_health_score: true,
    },
  };
}

export async function runImageGate(
  state: ImageGateState,
  env: ReadEnv = (name) => Deno.env.get(name)?.trim(),
  transport: FetchLike = fetch,
): Promise<ImageGateDecision> {
  const apiKey = env('TYPESAFE_API_KEY')?.trim();
  if (!apiKey) return localFallbackGate(state);

  try {
    const endpoint = normalizeTypeSafeUrl(env('TYPESAFE_API_URL')?.trim() || TYPE_SAFE_API_URL);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2_500);
    try {
      const response = await transport(endpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(buildTypeSafeRequest(state)),
        redirect: 'error',
        signal: controller.signal,
      });
      if (!response.ok) return localFallbackGate(state);
      return parseTypeSafeDecision(await response.json());
    } finally {
      clearTimeout(timeout);
    }
  } catch {
    return localFallbackGate(state);
  }
}

export function localFallbackGate(state: ImageGateState): ImageGateDecision {
  const hints = state.request.client_quality_hints;
  if (state.request.crop_type !== 'soybean') {
    return {
      image_usable: false,
      image_usable_probability: 0.2,
      image_usable_confidence: 1,
      scope_route: 'defer_out_of_wedge',
      scope_route_confidence: 1,
      overclaim_risk: 1,
      overclaim_risk_confidence: 0.85,
      source: 'local_fallback',
      reason: 'Crop is outside the Morehouse Parish soybean evidence wedge.',
    };
  }
  if (explicitlyOutsideMorehouse(state.request.parish_hint)) {
    return {
      image_usable: false,
      image_usable_probability: 0.4,
      image_usable_confidence: 0.9,
      scope_route: 'defer_out_of_wedge',
      scope_route_confidence: 0.9,
      overclaim_risk: 1,
      overclaim_risk_confidence: 0.85,
      source: 'local_fallback',
      reason: 'Parish hint appears outside the Morehouse soybean wedge.',
    };
  }
  if (!state.request.has_image_url || hints.declared_blurry || hints.declared_too_far || (hints.bytes_hint != null && hints.bytes_hint < 10_000)) {
    return {
      image_usable: false,
      image_usable_probability: 0.1,
      image_usable_confidence: 0.95,
      scope_route: 'retake_image',
      scope_route_confidence: 0.95,
      overclaim_risk: 2,
      overclaim_risk_confidence: 0.9,
      source: 'local_fallback',
      reason: 'Client quality hints indicate insufficient media evidence.',
    };
  }
  return {
    image_usable: true,
    image_usable_probability: 0.85,
    image_usable_confidence: 0.85,
    scope_route: 'analyze_in_wedge',
    scope_route_confidence: 0.8,
    overclaim_risk: 0,
    overclaim_risk_confidence: 0.8,
    source: 'local_fallback',
    reason: 'Soybean request has no explicit out-of-scope or quality problem hints.',
  };
}

function buildTypeSafeRequest(state: ImageGateState) {
  return {
    state,
    model: TYPE_SAFE_MODEL,
    questions: {
      image_usable: {
        type: 'noul',
        instructions:
          "Is this request's media likely usable for a soybean canopy/leaf observation (not blank/blur/too distant) given `request` and policy?",
        criteria: {
          true: 'Media can likely support a visible soybean canopy or leaf observation as a decision aid.',
          false: 'Media is likely blank, blurred, too distant, missing, or otherwise insufficient for visible observation.',
        },
      },
      scope_route: {
        type: 'choice',
        instructions:
          'Choose the safest route for this AgurateAI public-stage crop media request using only the compact state and policy.',
        criteria: {
          analyze_in_wedge: 'soybean + Morehouse evidence wedge',
          defer_out_of_wedge: 'crop/parish outside validated wedge',
          retake_image: 'media quality insufficient',
          unknown_hold: 'not enough context; do not invent',
        },
      },
      overclaim_risk: {
        type: 'score',
        instructions:
          'Rate the risk that proceeding would overclaim, invent a score, imply diagnosis, or exceed the Morehouse Parish soybean evidence wedge.',
        criteria: [
          'honest decision-aid framing',
          'mild overclaim risk if we proceed',
          'high invent/diagnosis risk - hold',
        ],
      },
    },
  };
}

function parseTypeSafeDecision(payload: unknown): ImageGateDecision {
  const answers = payload && typeof payload === 'object'
    ? (payload as { answers?: Record<string, unknown> }).answers
    : undefined;
  if (!answers || typeof answers !== 'object') throw new Error('Missing TypeSafe answers');

  const imageUsable = parseNoul(answers.image_usable);
  const scopeRoute = parseChoice(answers.scope_route);
  const overclaimRisk = parseScore(answers.overclaim_risk);

  return {
    image_usable: imageUsable.value >= 0.5,
    image_usable_probability: imageUsable.value,
    image_usable_confidence: imageUsable.confidence,
    scope_route: scopeRoute.choice,
    scope_route_confidence: scopeRoute.confidence,
    overclaim_risk: overclaimRisk.level,
    overclaim_risk_confidence: overclaimRisk.confidence,
    source: 'typesafe',
    reason: 'TypeSafe System One gate completed.',
  };
}

function parseNoul(answer: unknown): { value: number; confidence: number } {
  if (!answer || typeof answer !== 'object') throw new Error('Invalid noul answer');
  const raw = answer as { type?: unknown; noul?: unknown; confidence?: unknown };
  if (raw.type !== 'noul') throw new Error('Invalid image_usable answer type');
  const value = clampProbability(raw.noul);
  const confidence = raw.confidence == null ? Math.max(value, 1 - value) : clampProbability(raw.confidence);
  return { value, confidence };
}

function parseChoice(answer: unknown): { choice: ImageGateScopeRoute; confidence: number | null } {
  if (!answer || typeof answer !== 'object') throw new Error('Invalid choice answer');
  const raw = answer as { type?: unknown; choice?: unknown; confidence?: unknown };
  if (raw.type !== 'choice' || typeof raw.choice !== 'string' || !SCOPE_ROUTES.includes(raw.choice as ImageGateScopeRoute)) {
    throw new Error('Invalid scope_route answer');
  }
  return {
    choice: raw.choice as ImageGateScopeRoute,
    confidence: raw.confidence == null ? null : clampProbability(raw.confidence),
  };
}

function parseScore(answer: unknown): { level: 0 | 1 | 2; confidence: number | null } {
  if (!answer || typeof answer !== 'object') throw new Error('Invalid score answer');
  const raw = answer as { type?: unknown; score?: unknown; confidence?: unknown };
  if (raw.type !== 'score') throw new Error('Invalid overclaim_risk answer type');
  const score = Number(raw.score);
  if (!Number.isFinite(score)) throw new Error('Invalid overclaim_risk score');
  const level = Math.max(0, Math.min(2, Math.round(score))) as 0 | 1 | 2;
  return {
    level,
    confidence: raw.confidence == null ? null : clampProbability(raw.confidence),
  };
}

function normalizeTypeSafeUrl(value: string): string {
  const url = new URL(value);
  if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash) {
    throw new Error('TYPESAFE_API_URL must be an HTTPS endpoint without credentials, query or fragment');
  }
  return url.href;
}

function clampProbability(value: unknown): number {
  const n = Number(value);
  if (!Number.isFinite(n)) throw new Error('Invalid probability');
  return Math.max(0, Math.min(1, n));
}

function normalizeBytesHint(value: unknown): number | null {
  if (value == null || Number.isNaN(Number(value))) return null;
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? Math.round(n) : null;
}

function explicitlyOutsideMorehouse(parishHint: string | null): boolean {
  if (!parishHint) return false;
  const normalized = parishHint.toLowerCase();
  return normalized.includes('parish') && !normalized.includes('morehouse');
}
