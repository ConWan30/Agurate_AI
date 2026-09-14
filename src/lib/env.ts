/**
 * Fail-fast environment validation for production deploys.
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

export const env = {
  supabaseUrl: requireEnv('VITE_SUPABASE_URL'),
  supabasePublishableKey: requireEnv('VITE_SUPABASE_PUBLISHABLE_KEY'),
  supabaseProjectId: import.meta.env.VITE_SUPABASE_PROJECT_ID as string | undefined,
  isDev: import.meta.env.DEV,
  isProd: import.meta.env.PROD,
} as const;
