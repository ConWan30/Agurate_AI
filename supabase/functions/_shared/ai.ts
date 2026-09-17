/** Server-only Chat Completions transport. Existing Lovable secrets remain supported. */
type ReadEnv = (name: string) => string | undefined;
const readEnv: ReadEnv = (name) => Deno.env.get(name)?.trim();

const LEGACY_ENDPOINT = 'https://ai.gateway.lovable.dev/v1/chat/completions';

export function getAIKey(env: ReadEnv = readEnv): string | undefined {
  // A partial custom configuration must never fall back to another provider's key.
  const custom = ['AI_API_URL', 'AI_API_KEY', 'AI_MODEL', 'AI_VIDEO_MODEL'].some((key) => env(key));
  return custom ? env('AI_API_KEY') : env('LOVABLE_API_KEY');
}

export function resolveAIConfig(video: boolean, env: ReadEnv = readEnv) {
  const custom = ['AI_API_URL', 'AI_API_KEY', 'AI_MODEL', 'AI_VIDEO_MODEL'].some((key) => env(key));
  if (!custom) {
    const apiKey = env('LOVABLE_API_KEY');
    if (!apiKey) throw new Error('AI provider is not configured');
    return { url: LEGACY_ENDPOINT, apiKey, model: video ? 'google/gemini-2.5-pro' : 'google/gemini-2.5-flash' };
  }
  const url = env('AI_API_URL');
  const apiKey = env('AI_API_KEY');
  const model = env('AI_MODEL');
  if (!url || !apiKey || !model) throw new Error('AI_API_URL, AI_API_KEY and AI_MODEL must all be configured');
  const endpoint = new URL(url);
  if (endpoint.protocol !== 'https:' || endpoint.username || endpoint.password || endpoint.search || endpoint.hash) {
    throw new Error('AI_API_URL must be an HTTPS endpoint without credentials, query or fragment');
  }
  const videoModel = env('AI_VIDEO_MODEL');
  if (video && !videoModel) throw new Error('Video analysis is unavailable: AI_VIDEO_MODEL is not configured');
  return { url: endpoint.href, apiKey, model: video ? videoModel! : model };
}

/** Preserve upstream status/body/stream so callers retain their existing error handling. */
export function fetchAI(init: RequestInit, env: ReadEnv = readEnv, transport: typeof fetch = fetch): Promise<Response> {
  if (typeof init.body !== 'string') throw new Error('AI request body must be JSON');
  const body = JSON.parse(init.body);
  const video = Array.isArray(body.messages) && body.messages.some((message: { content?: unknown }) =>
    Array.isArray(message.content) && message.content.some((part: { type?: string }) => part.type === 'video_url')
  );
  const config = resolveAIConfig(video, env);
  const headers = new Headers(init.headers);
  headers.set('Authorization', `Bearer ${config.apiKey}`);
  headers.set('Content-Type', 'application/json');
  return transport(config.url, {
    ...init,
    method: 'POST',
    headers,
    body: JSON.stringify({ ...body, model: config.model }),
    // Do not forward credentials to a redirect target.
    redirect: 'error',
  });
}
