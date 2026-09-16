/**
 * Environment resolution for AgurateAI.
 *
 * Normal deployments still fail fast when required Vite variables are missing.
 * The canonical Lovable production host gets a narrow fallback because Lovable
 * Cloud already exposes this project's public URL/publishable key to the browser,
 * and a publish without Vite env injection would otherwise crash before React mounts.
 */

const LOVABLE_PRODUCTION_HOST = 'agurateai.lovable.app';
const LOVABLE_CLOUD_DEFAULTS: Record<string, string> = {
  VITE_SUPABASE_URL: 'https://rkfvefhjyuyhjmcljzev.lovable.cloud',
  VITE_SUPABASE_PUBLISHABLE_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJrZnZlZmhqeXV5aGptY2xqemV2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA3MjI1MjIsImV4cCI6MjA3NjI5ODUyMn0.JsbFUDVbgjjuPi99QCwcF7udD_tLtfJmyQsUvpTPPZE',
  VITE_SUPABASE_PROJECT_ID: 'rkfvefhjyuyhjmcljzev',
};

function isCanonicalLovableProduction(): boolean {
  return typeof window !== 'undefined' && window.location.hostname === LOVABLE_PRODUCTION_HOST;
}

function optionalEnv(name: string): string | undefined {
  const value = import.meta.env[name];
  if (typeof value === 'string' && value.trim().length > 0) return value.trim();
  if (isCanonicalLovableProduction()) return LOVABLE_CLOUD_DEFAULTS[name];
  return undefined;
}

function requireEnv(name: string): string {
  const value = optionalEnv(name);
  if (!value) {
    throw new Error(
      `[AgurateAI] Missing required environment variable: ${name}. ` +
        'Set it in hosting environment variables before starting the app.'
    );
  }
  return value;
}

let cached: {
  supabaseUrl: string;
  supabasePublishableKey: string;
  supabaseProjectId: string | undefined;
} | null = null;

function resolve() {
  if (!cached) {
    cached = {
      supabaseUrl: requireEnv('VITE_SUPABASE_URL'),
      supabasePublishableKey: requireEnv('VITE_SUPABASE_PUBLISHABLE_KEY'),
      supabaseProjectId: optionalEnv('VITE_SUPABASE_PROJECT_ID'),
    };
  }
  return cached;
}

/** Reset cached env (test helper). */
export function resetEnvCache() {
  cached = null;
}

export const env = {
  get supabaseUrl() {
    return resolve().supabaseUrl;
  },
  get supabasePublishableKey() {
    return resolve().supabasePublishableKey;
  },
  get supabaseProjectId() {
    return resolve().supabaseProjectId;
  },
  get isDev() {
    return import.meta.env.DEV;
  },
  get isProd() {
    return import.meta.env.PROD;
  },
};
