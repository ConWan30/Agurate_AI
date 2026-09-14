import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { requireSetupSecret } from '../_shared/auth.ts';
import { enforceIpRateLimit, RATE_LIMITS } from '../_shared/rateLimiter.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-demo-setup-secret',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const secretCheck = requireSetupSecret(req, corsHeaders);
    if (secretCheck !== true) {
      return secretCheck;
    }

    const ip = req.headers.get('cf-connecting-ip')
      ?? req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      ?? req.headers.get('x-real-ip')
      ?? 'unknown';
    // Reuse service client created below when possible; create a minimal one for rate limiting.
    const rateClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );
    const ipLimit = await enforceIpRateLimit(rateClient, ip, {
      bucket: 'setup-demo-account',
      maxRequests: RATE_LIMITS['setup-demo-account'].maxRequests,
      windowMs: RATE_LIMITS['setup-demo-account'].windowMs,
    });
    if (!ipLimit.allowed) {
      return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Starting demo account setup...');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Prefer an explicit demo user id secret to avoid listing all auth users.
    const demoUserId = Deno.env.get('DEMO_USER_ID');
    let demoUser: { id: string; email?: string } | null = null;

    if (demoUserId) {
      const { data, error: userError } = await supabase.auth.admin.getUserById(demoUserId);
      if (userError || !data.user) {
        return new Response(
          JSON.stringify({
            error: 'Demo user not found for DEMO_USER_ID. Create the account first.',
          }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      demoUser = data.user;
    } else {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, email')
        .eq('email', 'demo@agurateai.com')
        .maybeSingle();

      if (!profile?.id) {
        return new Response(
          JSON.stringify({
            error:
              'Demo user not found. Create demo@agurateai.com first, or set DEMO_USER_ID.',
          }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      demoUser = { id: profile.id, email: profile.email ?? 'demo@agurateai.com' };
    }

    console.log('✅ Demo user found:', demoUser.id);

    // STEP 1: Create profile
    await supabase.from('profiles').upsert({
      id: demoUser.id,
      full_name: 'Demo Farmer',
      email: 'demo@agurateai.com',
      farm_name: 'Demo Delta Farms',
      beta_farmer: true,
      primary_crops: ['rice', 'soybean', 'cotton'],
    });

    // STEP 2: Create 3 fields (crop_type must match fields CHECK: rice|soybean|cotton|corn)
    const fieldsData = [
      {
        user_id: demoUser.id,
        name: 'North Rice Field',
        crop_type: 'rice',
        acreage: 120,
        location_lat: 32.7340,
        location_lng: -91.7573,
        rice_variety: 'CL153',
      },
      {
        user_id: demoUser.id,
        name: 'South Soybean Field',
        crop_type: 'soybean',
        acreage: 180,
        location_lat: 32.7300,
        location_lng: -91.7600,
        soybean_variety: 'Asgrow AG48X9',
      },
      {
        user_id: demoUser.id,
        name: 'West Cotton Field',
        crop_type: 'cotton',
        acreage: 90,
        location_lat: 32.7380,
        location_lng: -91.7550,
        cotton_variety: 'DP 2012 B3XF',
      },
    ];

    const { data: fields, error: fieldsError } = await supabase
      .from('fields')
      .upsert(fieldsData, { onConflict: 'user_id,name' })
      .select();

    if (fieldsError) throw fieldsError;
    console.log(`✅ Created ${fields.length} fields`);

    // STEP 3: Create realistic assessments (15 total)
    const assessmentsData = [
      // Rice Field - 5 assessments
      {
        field_id: fields[0].id,
        image_url: 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=800',
        health_score: 68,
        stress_level: 'moderate',
        symptoms: ['Yellowing lower leaves', 'Stunted growth'],
        confidence_score: 94,
        analyzed_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() // 5 days ago
      },
      {
        field_id: fields[0].id,
        image_url: 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=800',
        health_score: 58,
        stress_level: 'severe',
        symptoms: ['Diamond-shaped lesions', 'Gray centers on leaves'],
        confidence_score: 96,
        analyzed_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() // 1 day ago
      },
      {
        field_id: fields[0].id,
        image_url: 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=800',
        health_score: 91,
        stress_level: 'healthy',
        symptoms: [],
        confidence_score: 92,
        analyzed_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() // 2 days ago
      },
      {
        field_id: fields[0].id,
        image_url: 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=800',
        health_score: 72,
        stress_level: 'moderate',
        symptoms: ['Slight yellowing', 'Reduced vigor'],
        confidence_score: 88,
        analyzed_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days ago
      },
      {
        field_id: fields[0].id,
        image_url: 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=800',
        health_score: 85,
        stress_level: 'healthy',
        symptoms: [],
        confidence_score: 90,
        analyzed_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString() // 10 days ago
      },
      // Soybean Field - 5 assessments
      {
        field_id: fields[1].id,
        image_url: 'https://images.unsplash.com/photo-1578387825676-b314a7b84e79?w=800',
        health_score: 72,
        stress_level: 'moderate',
        symptoms: ['Yellowing leaf margins', 'Brown spots'],
        confidence_score: 89,
        analyzed_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString() // 4 days ago
      },
      {
        field_id: fields[1].id,
        image_url: 'https://images.unsplash.com/photo-1578387825676-b314a7b84e79?w=800',
        health_score: 88,
        stress_level: 'healthy',
        symptoms: [],
        confidence_score: 93,
        analyzed_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() // 3 days ago
      },
      {
        field_id: fields[1].id,
        image_url: 'https://images.unsplash.com/photo-1578387825676-b314a7b84e79?w=800',
        health_score: 55,
        stress_level: 'severe',
        symptoms: ['Circular lesions', 'Frogeye spots'],
        confidence_score: 91,
        analyzed_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString() // 6 days ago
      },
      {
        field_id: fields[1].id,
        image_url: 'https://images.unsplash.com/photo-1578387825676-b314a7b84e79?w=800',
        health_score: 74,
        stress_level: 'moderate',
        symptoms: ['Purple spots', 'Leaf discoloration'],
        confidence_score: 87,
        analyzed_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString() // 8 days ago
      },
      {
        field_id: fields[1].id,
        image_url: 'https://images.unsplash.com/photo-1578387825676-b314a7b84e79?w=800',
        health_score: 82,
        stress_level: 'healthy',
        symptoms: [],
        confidence_score: 90,
        analyzed_at: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString() // 9 days ago
      },
      // Cotton Field - 5 assessments
      {
        field_id: fields[2].id,
        image_url: 'https://images.unsplash.com/photo-1615485500710-37102f8fbed8?w=800',
        health_score: 63,
        stress_level: 'moderate',
        symptoms: ['Wilting leaves', 'Reduced growth'],
        confidence_score: 87,
        analyzed_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() // 3 days ago
      },
      {
        field_id: fields[2].id,
        image_url: 'https://images.unsplash.com/photo-1615485500710-37102f8fbed8?w=800',
        health_score: 79,
        stress_level: 'healthy',
        symptoms: [],
        confidence_score: 91,
        analyzed_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() // 2 days ago
      },
      {
        field_id: fields[2].id,
        image_url: 'https://images.unsplash.com/photo-1615485500710-37102f8fbed8?w=800',
        health_score: 71,
        stress_level: 'moderate',
        symptoms: ['Yellowing lower leaves'],
        confidence_score: 85,
        analyzed_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() // 5 days ago
      },
      {
        field_id: fields[2].id,
        image_url: 'https://images.unsplash.com/photo-1615485500710-37102f8fbed8?w=800',
        health_score: 86,
        stress_level: 'healthy',
        symptoms: [],
        confidence_score: 92,
        analyzed_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days ago
      },
      {
        field_id: fields[2].id,
        image_url: 'https://images.unsplash.com/photo-1615485500710-37102f8fbed8?w=800',
        health_score: 68,
        stress_level: 'moderate',
        symptoms: ['Water stress indicators'],
        confidence_score: 88,
        analyzed_at: new Date(Date.now() - 11 * 24 * 60 * 60 * 1000).toISOString() // 11 days ago
      }
    ];

    const { data: assessments, error: assessError } = await supabase
      .from('assessments')
      .upsert(assessmentsData)
      .select();

    if (assessError) throw assessError;
    console.log(`✅ Created ${assessments.length} assessments`);

    // STEP 4: Create insurance claim for hail damage
    const { data: claim } = await supabase
      .from('insurance_claims')
      .insert({
        field_id: fields[0].id,
        event_type: 'hail',
        event_date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        description: 'Severe hail damage during storm on June 15, 2025. Extensive damage to rice crop at panicle initiation stage.',
        estimated_damage_cost: 28500,
        status: 'submitted'
      })
      .select()
      .single();

    if (claim) {
      // Link assessments to claim (use the severe rice assessment)
      await supabase.from('claim_assessments').insert({
        claim_id: claim.id,
        assessment_id: assessments[1].id // The severe rice assessment
      });
      console.log('✅ Created insurance claim with linked assessment');
    }

    // STEP 5: Create cooperative
    const { data: coop } = await supabase
      .from('cooperatives')
      .insert({
        created_by: demoUser.id,
        name: 'Delta Farmers Cooperative',
        description: 'Northeast Louisiana farmer collaborative for shared insights and bulk purchasing',
        member_count: 25
      })
      .select()
      .single();

    if (coop) {
      await supabase.from('cooperative_members').insert({
        cooperative_id: coop.id,
        user_id: demoUser.id,
        role: 'member',
        data_sharing_enabled: true
      });
      console.log('✅ Created cooperative with demo user as member');
    }

    console.log('✅ Demo account setup complete!');

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Demo account fully populated',
        data: {
          user_id: demoUser.id,
          fields: fields.length,
          assessments: assessments.length,
          insurance_claim: !!claim,
          cooperative: !!coop
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error: any) {
    console.error('❌ Demo setup error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
