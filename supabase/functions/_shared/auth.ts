import { createClient, type User, type SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { handleAuthError } from './errorHandler.ts';

export function getServiceClient(): SupabaseClient {
  return createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );
}

export function getAnonClient(authHeader: string): SupabaseClient {
  return createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? Deno.env.get('SUPABASE_PUBLISHABLE_KEY') ?? '',
    {
      global: {
        headers: { Authorization: authHeader },
      },
    }
  );
}

export async function requireAuthenticatedUser(
  req: Request,
  corsHeaders: Record<string, string>
): Promise<{ user: User; authHeader: string } | Response> {
  const authHeader = req.headers.get('Authorization') ?? req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return handleAuthError(corsHeaders);
  }

  const token = authHeader.replace(/^Bearer\s+/i, '');
  const supabaseAuth = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? Deno.env.get('SUPABASE_PUBLISHABLE_KEY') ?? ''
  );

  const { data: { user }, error } = await supabaseAuth.auth.getUser(token);
  if (error || !user) {
    return handleAuthError(corsHeaders);
  }

  return { user, authHeader };
}

export function requireSetupSecret(
  req: Request,
  corsHeaders: Record<string, string>
): true | Response {
  const expected = Deno.env.get('DEMO_SETUP_SECRET');
  if (!expected) {
    return new Response(
      JSON.stringify({
        error: 'Demo setup is disabled. Set DEMO_SETUP_SECRET to enable this endpoint.',
      }),
      {
        status: 503,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  const provided =
    req.headers.get('x-demo-setup-secret') ??
    req.headers.get('X-Demo-Setup-Secret');

  if (!provided || !timingSafeEqual(provided, expected)) {
    return new Response(
      JSON.stringify({ error: 'Forbidden' }),
      {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  return true;
}

function timingSafeEqual(a: string, b: string): boolean {
  const encoder = new TextEncoder();
  const aBytes = encoder.encode(a);
  const bBytes = encoder.encode(b);
  if (aBytes.length !== bBytes.length) {
    return false;
  }
  let mismatch = 0;
  for (let i = 0; i < aBytes.length; i++) {
    mismatch |= aBytes[i] ^ bBytes[i];
  }
  return mismatch === 0;
}
