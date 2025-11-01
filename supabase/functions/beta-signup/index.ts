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

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const formData: BetaSignupData = await req.json();

    // Check current beta farmer count
    const { data: countData, error: countError } = await supabase
      .rpc('get_beta_farmer_count');

    if (countError) {
      console.error('Error getting beta count:', countError);
      throw countError;
    }

    const currentBetaCount = countData || 0;

    // Check if beta program is full (100 farmers max)
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
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Check if email already exists
    const { data: existingUser } = await supabase.auth.admin.listUsers();
    const emailExists = existingUser?.users?.some(
      (user) => user.email?.toLowerCase() === formData.email.toLowerCase()
    );

    if (emailExists) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'email_exists',
          message: 'This email is already registered. Sign in to access your account.',
          signInLink: '/auth',
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Create user account with auto-generated password
    const password = crypto.randomUUID();
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: formData.email,
      password: password,
      email_confirm: true, // Auto-confirm for beta users
      user_metadata: {
        name: formData.name,
        farm_name: formData.farm_name,
        beta_farmer: true,
      },
    });

    if (authError) {
      console.error('Error creating auth user:', authError);
      throw authError;
    }

    // Update profile with beta farmer information
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: authData.user.id,
        user_id: authData.user.id,
        name: formData.name,
        email: formData.email,
        farm_name: formData.farm_name,
        beta_farmer: true,
        beta_signup_date: new Date().toISOString(),
        beta_feedback_provided: false,
      });

    if (profileError) {
      console.error('Error updating profile:', profileError);
      // Don't throw - account is created, profile update can retry
    }

    // Create first field if location and crop provided
    if (formData.location && formData.primary_crop) {
      const { error: fieldError } = await supabase
        .from('fields')
        .insert({
          user_id: authData.user.id,
          name: formData.farm_name || 'Main Field',
          crop_type: formData.primary_crop.toLowerCase().replace(' ', ''),
          acreage: formData.acreage,
          // Map location to approximate coordinates (Morehouse Parish area)
          location_lat: 32.73,
          location_lng: -91.76,
        });

      if (fieldError) {
        console.error('Error creating field:', fieldError);
        // Don't throw - account is created, field can be created later
      }
    }

    // Send password reset email so user can set their own password
    const { error: resetError } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email: formData.email,
    });

    if (resetError) {
      console.error('Error sending password reset:', resetError);
      // Don't throw - account is created, user can request reset later
    }

    // Get updated beta count
    const { data: newCountData } = await supabase.rpc('get_beta_farmer_count');
    const betaNumber = newCountData || currentBetaCount + 1;

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Welcome to AgurateAI Beta! Check your email to set your password.',
        userId: authData.user.id,
        betaNumber: betaNumber,
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
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
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
