/** Request-aware CORS for browser-callable edge functions. */
const STATIC_ALLOWED = new Set([
  'https://agurateai.com',
  'https://www.agurateai.com',
  'https://agurateai.lovable.app',
]);

const ALLOWED_ORIGIN_PATTERNS = [
  /^http:\/\/localhost(:\d+)?$/i,
  /^http:\/\/127\.0\.0\.1(:\d+)?$/i,
  /^https:\/\/([a-z0-9-]+\.)?lovable\.app$/i,
  /^https:\/\/([a-z0-9-]+\.)?lovableproject\.com$/i,
  /^https:\/\/([a-z0-9-]+\.)?lovable\.cloud$/i,
  /^https:\/\/([a-z0-9-]+\.)?gptengineer\.run$/i,
];

const DEFAULT_ORIGIN = 'https://agurateai.com';

const ALLOW_HEADERS =
  'authorization, x-client-info, apikey, content-type, x-demo-setup-secret';

export function isAllowedOrigin(origin: string): boolean {
  if (!origin) return false;
  if (STATIC_ALLOWED.has(origin)) return true;
  return ALLOWED_ORIGIN_PATTERNS.some((re) => re.test(origin));
}

/** Build CORS headers reflecting an allowlisted Origin (or a safe default). */
export function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get('Origin') ?? '';
  const allowedOrigin = isAllowedOrigin(origin) ? origin : DEFAULT_ORIGIN;
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': ALLOW_HEADERS,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    Vary: 'Origin',
  };
}

/** @deprecated Prefer getCorsHeaders(req) — wildcard origin kept only for gradual migration. */
export const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': ALLOW_HEADERS,
};
