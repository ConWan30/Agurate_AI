import { describe, it, expect } from 'vitest';
import { env } from '@/lib/env';

describe('env fail-fast', () => {
  it('exposes required supabase config from validated env', () => {
    expect(env.supabaseUrl).toBeTruthy();
    expect(env.supabasePublishableKey).toBeTruthy();
    expect(env.supabaseUrl.startsWith('http')).toBe(true);
  });
});
