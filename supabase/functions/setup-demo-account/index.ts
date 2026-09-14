import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { requireSetupSecret } from '../_shared/auth.ts';

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

    console.log('Starting demo account setup...');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get demo user (must be created manually first: demo@agurateai.com)
    const { data: { users }, error: userError } = await supabase.auth.admin.listUsers();
    const demoUser = users?.find(u => u.email === 'demo@agurateai.com');

    if (!demoUser) {
      return new Response(
        JSON.stringify({ 
          error: 'Demo user not found. Please create demo@agurateai.com account first.' 
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ Demo user found:', demoUser.id);

    // STEP 1: Create profile
    await supabase.from('profiles').upsert({
      id: demoUser.id,
      user_id: demoUser.id,
      name: 'Demo Farmer',
      email: 'demo@agurateai.com',
      farm_name: 'Demo Delta Farms',
      beta_farmer: true
    });

    // STEP 2: Create 3 fields
    const fieldsData = [
      {
        user_id: demoUser.id,
        name: 'North Rice Field',
        crop_type: 'rice',
        acreage: 120,
        soil_type: 'alluvial',
        location_lat: 32.7340,
        location_lng: -91.7573,
        planting_date: '2025-04-15',
        irrigation_type: 'flood',
        rice_variety: 'CL153'
      },
      {
        user_id: demoUser.id,
        name: 'South Soybean Field',
        crop_type: 'soybeans',
        acreage: 180,
        soil_type: 'claypan',
        location_lat: 32.7300,
        location_lng: -91.7600,
        planting_date: '2025-05-01',
        soybean_variety: 'Asgrow AG48X9'
      },
      {
        user_id: demoUser.id,
        name: 'West Cotton Field',
        crop_type: 'cotton',
        acreage: 90,
        soil_type: 'mixed',
        location_lat: 32.7380,
        location_lng: -91.7550,
        planting_date: '2025-04-20',
        cotton_variety: 'DP 2012 B3XF'
      }
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
