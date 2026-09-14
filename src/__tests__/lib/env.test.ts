import { afterEach, describe, expect, it, vi } from 'vitest';
import { env, resetEnvCache } from '@/lib/env';

describe('env fail-fast', () => {
  afterEach(() => {
    resetEnvCache();
    vi.unstubAllEnvs();
  });

  it('exposes required supabase config when present', () => {
    vi.stubEnv('VITE_SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY', 'test-publishable-key');
    resetEnvCache();

    expect(env.supabaseUrl).toBe('https://example.supabase.co');
    expect(env.supabasePublishableKey).toBe('test-publishable-key');
    expect(env.supabaseUrl.startsWith('http')).toBe(true);
  });

  it('throws when required supabase URL is missing', () => {
    vi.stubEnv('VITE_SUPABASE_URL', '');
    vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY', 'test-publishable-key');
    resetEnvCache();

    expect(() => env.supabaseUrl).toThrow(/VITE_SUPABASE_URL/);
  });
});
