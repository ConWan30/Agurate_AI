import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BetaSignupData {
  name: string;
  email: string;
  farm_name?: string;
  location: string;
  primary_crop: string;
  acreage?: number;
  why_interested?: string;
  email_consent: boolean;
}

/** Simple per-isolate IP rate limit (best-effort across cold starts). */
const recentAttempts = new Map<string, number[]>();
const RATE_WINDOW_MS = 15 * 60 * 1000;
const RATE_MAX = 5;

function clientIp(req: Request): string {
  return (
    req.headers.get('cf-connecting-ip') ??
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    'unknown'
  );
}

function allowAttempt(ip: string): boolean {
  const now = Date.now();
  const prior = (recentAttempts.get(ip) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
  if (prior.length >= RATE_MAX) {
    recentAttempts.set(ip, prior);
    return false;
  }
  prior.push(now);
  recentAttempts.set(ip, prior);
  return true;
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 255;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const ip = clientIp(req);
    if (!allowAttempt(ip)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'rate_limited',
          message: 'Too many signup attempts. Please try again later.',
        }),
        {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const formData: BetaSignupData = await req.json();

    if (!formData.name?.trim() || !formData.email?.trim() || !formData.location?.trim() || !formData.primary_crop?.trim()) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'validation_error',
          message: 'Name, email, location, and primary crop are required.',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (!isValidEmail(formData.email) || !formData.email_consent) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'validation_error',
          message: 'A valid email and consent are required.',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const { data: countData, error: countError } = await supabase
      .rpc('get_beta_farmer_count');

    if (countError) {
      console.error('Error getting beta count:', countError);
      throw countError;
    }

    const currentBetaCount = countData || 0;

    if (currentBetaCount >= 100) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'beta_full',
          message: 'Beta program is full. Join our waitlist to be notified when spots open.',
          waitlist: true,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Create user — rely on Auth uniqueness instead of listing all users
    const password = crypto.randomUUID();
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: formData.email.trim().toLowerCase(),
      password: password,
      email_confirm: true,
      user_metadata: {
        name: formData.name.trim(),
        farm_name: formData.farm_name,
        beta_farmer: true,
      },
    });

    if (authError) {
      const msg = (authError.message || '').toLowerCase();
      if (msg.includes('already') || msg.includes('registered') || msg.includes('exists')) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'email_exists',
            message: 'This email is already registered. Sign in to access your account.',
            signInLink: '/auth',
          }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
      console.error('Error creating auth user:', authError);
      throw authError;
    }

    if (!authData.user) {
      throw new Error('User creation returned no user');
    }

    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: authData.user.id,
        user_id: authData.user.id,
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        farm_name: formData.farm_name,
        beta_farmer: true,
        beta_signup_date: new Date().toISOString(),
        beta_feedback_provided: false,
      });

    if (profileError) {
      console.error('Error updating profile:', profileError);
    }

    if (formData.location && formData.primary_crop) {
      const { error: fieldError } = await supabase
        .from('fields')
        .insert({
          user_id: authData.user.id,
          name: formData.farm_name || 'Main Field',
          crop_type: formData.primary_crop.toLowerCase().replace(' ', ''),
          acreage: formData.acreage,
          location_lat: 32.73,
          location_lng: -91.76,
        });

      if (fieldError) {
        console.error('Error creating field:', fieldError);
      }
    }

    const { error: resetError } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email: formData.email.trim().toLowerCase(),
    });

    if (resetError) {
      console.error('Error sending password reset:', resetError);
    }

    const { data: newCountData } = await supabase.rpc('get_beta_farmer_count');
    const betaNumber = newCountData || currentBetaCount + 1;

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Welcome to AgurateAI Beta! Check your email to set your password.',
        betaNumber: betaNumber,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Beta signup error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'server_error',
        message: 'An error occurred during signup. Please try again.',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
