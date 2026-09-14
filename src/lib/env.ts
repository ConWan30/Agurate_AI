/**
 * Fail-fast environment validation for production deploys.
 * Values are resolved lazily so test suites can stub env before first access.
 */

function requireEnv(name: string): string {
  const value = import.meta.env[name];
  if (!value || typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(
      `[AgurateAI] Missing required environment variable: ${name}. ` +
        'Set it in .env / hosting secrets before starting the app.'
    );
  }
  return value.trim();
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
      supabaseProjectId: import.meta.env.VITE_SUPABASE_PROJECT_ID as string | undefined,
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
