import { fetchAI, getAIKey, resolveAIConfig } from './ai.ts';

function assert(value: unknown, message = 'Assertion failed'): asserts value {
  if (!value) throw new Error(message);
}
const env = (values: Record<string, string>) => (key: string) => values[key];
const custom = { AI_API_URL: 'https://provider.example/v1/chat/completions', AI_API_KEY: 'custom-key', AI_MODEL: 'vision-model' };
function rejectsConfig(values: Record<string, string>, video = false) {
  let failed = false;
  try { resolveAIConfig(video, env(values)); } catch { failed = true; }
  assert(failed, 'Invalid configuration must fail closed');
}

Deno.test('existing Lovable configuration remains compatible', () => {
  const config = resolveAIConfig(false, env({ LOVABLE_API_KEY: 'legacy-key' }));
  assert(config.apiKey === 'legacy-key');
  assert(config.model === 'google/gemini-2.5-flash');
  assert(config.url === 'https://ai.gateway.lovable.dev/v1/chat/completions');
});
Deno.test('custom configuration never borrows legacy credentials or silently falls back', () => {
  rejectsConfig({ AI_API_URL: custom.AI_API_URL, LOVABLE_API_KEY: 'legacy-key' });
  rejectsConfig({ AI_API_KEY: 'custom-key', LOVABLE_API_KEY: 'legacy-key' });
  rejectsConfig({});
  assert(getAIKey(env({ AI_MODEL: 'model', LOVABLE_API_KEY: 'legacy-key' })) === undefined);
});
Deno.test('custom endpoint must use HTTPS without embedded credentials', () => {
  for (const url of ['http://provider.example/v1', 'https://user:pass@provider.example/v1', 'https://provider.example/v1?key=secret', 'https://provider.example/v1#fragment']) {
    rejectsConfig({ ...custom, AI_API_URL: url });
  }
});
Deno.test('video requires an explicitly configured compatible model', () => {
  rejectsConfig(custom, true);
  assert(resolveAIConfig(true, env({ ...custom, AI_VIDEO_MODEL: 'video-model' })).model === 'video-model');
});
Deno.test('transport preserves image messages, tools and streamed responses', async () => {
  const messages = [{ role: 'user', content: [{ type: 'image_url', image_url: { url: 'https://example.com/crop.jpg' } }] }];
  const tools = [{ type: 'function', function: { name: 'record' } }];
  const upstream = new Response('data: test\n\n', { headers: { 'content-type': 'text/event-stream' } });
  const transport: typeof fetch = async (url, init) => {
    assert(url === custom.AI_API_URL);
    assert(new Headers(init?.headers).get('Authorization') === 'Bearer custom-key');
    assert(init?.redirect === 'error');
    const body = JSON.parse(String(init?.body));
    assert(body.model === 'vision-model');
    assert(JSON.stringify(body.messages) === JSON.stringify(messages));
    assert(JSON.stringify(body.tools) === JSON.stringify(tools));
    assert(body.stream === true);
    return upstream;
  };
  const response = await fetchAI({ body: JSON.stringify({ model: 'google/gemini-2.5-flash', messages, tools, stream: true }) }, env(custom), transport);
  assert(response === upstream);
  assert(await response.text() === 'data: test\n\n');
});
Deno.test('upstream errors remain errors for existing handlers', async () => {
  const response = await fetchAI({ body: JSON.stringify({ messages: [] }) }, env(custom), async () => new Response('rate limit', { status: 429 }));
  assert(response.status === 429);
  assert(await response.text() === 'rate limit');
});
Deno.test('video is detected from actual request content before calling a provider', async () => {
  let called = false;
  let failed = false;
  try {
    await fetchAI({ body: JSON.stringify({ messages: [{ content: [{ type: 'video_url', video_url: { url: 'https://example.com/video.mp4' } }] }] }) }, env(custom), async () => { called = true; return new Response(); });
  } catch { failed = true; }
  assert(failed && !called);
});
