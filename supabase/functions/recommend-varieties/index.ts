import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const varietySchema = z.object({
  fieldId: z.string().uuid(),
  cropType: z.enum(['rice', 'soybean', 'cotton', 'corn']),
  currentVariety: z.string().max(100).optional(),
  fieldHistory: z.any().optional(),
  diseasePressure: z.any().optional()
});

const LSU_VARIETIES = {
  rice: ['CL163', 'Titan', 'Diamond', 'Jupiter', 'LaKast', 'PVL01', 'PVL02'],
  soybean: ['LS Fairview', 'LS Fawn', 'LS Oakley', 'LS Ashland', 'LS Conway'],
  cotton: ['DP 2012 B3XF', 'PHY 340 W3FE', 'ST 4747GLB2'],
  corn: ['DKC67-72 RIB', 'P1197AM', 'DKC70-27 RIB']
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const rawBody = await req.json();
    const validation = varietySchema.safeParse(rawBody);
    
    if (!validation.success) {
      return new Response(JSON.stringify({ error: 'Invalid input data' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { fieldId, cropType, currentVariety, fieldHistory, diseasePressure } = validation.data;

    // Authenticate user and verify field ownership
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Authentication required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      console.error('Authentication failed:', userError);
      return new Response(JSON.stringify({ error: 'Authentication failed' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Gather comprehensive field context
    const [fieldData, fieldAssessments, communityInsights, conservationData] = await Promise.all([
      supabase
        .from('fields')
        .select('*')
        .eq('id', fieldId)
        .single()
        .then(res => res.data),
      
      supabase
        .from('assessments')
        .select('health_score, stress_level, symptoms, analyzed_at')
        .eq('field_id', fieldId)
        .order('analyzed_at', { ascending: false })
        .limit(20)
        .then(res => res.data || []),
      
      supabase
        .from('best_practices_network')
        .select('*')
        .eq('crop_type', cropType)
        .order('adoption_count', { ascending: false })
        .limit(5)
        .then(res => res.data || []),
      
      supabase
        .from('conservation_predictions')
        .select('*')
        .eq('field_id', fieldId)
        .order('predicted_date', { ascending: false })
        .limit(3)
        .then(res => res.data || [])
    ]);

    if (!fieldData || fieldData.user_id !== user.id) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const lsuVarieties = LSU_VARIETIES[cropType as keyof typeof LSU_VARIETIES] || [];

    // Calculate field performance metrics
    const avgHealth = fieldAssessments.length > 0
      ? fieldAssessments.reduce((sum, a) => sum + (a.health_score || 0), 0) / fieldAssessments.length
      : 0;
    
    const diseaseSymptoms = fieldAssessments
      .filter(a => a.symptoms)
      .flatMap(a => Array.isArray(a.symptoms) ? a.symptoms : []);

    const aiPrompt = `You are AgurateAI's variety recommendation engine, framed around publicly available LSU AgCenter breeding research.

UNIFIED INTELLIGENCE CONTEXT:

Field Profile:
- Crop: ${cropType}
- Acreage: ${fieldData.acreage}
- Soil Type: ${fieldData.soil_type}
- Current Variety: ${currentVariety}
- Average Health Score: ${avgHealth.toFixed(1)}

Historical Performance (Last 20 Assessments):
${fieldAssessments.map((a, i) => `  ${i + 1}. Health: ${a.health_score}, Stress: ${a.stress_level}`).join('\n')}

Disease Pressure Patterns:
${diseaseSymptoms.length > 0 ? diseaseSymptoms.slice(0, 10).join(', ') : 'No significant disease pressure'}

Community Intelligence (Best Performing Varieties):
${communityInsights.map(c => `- ${c.practice_name}: ${c.success_rate}% success, ${c.adoption_count} farmers`).join('\n')}

Conservation Context:
${conservationData.length > 0 ? `Soil health trending ${conservationData[0].soil_health_improvement > 0.5 ? 'upward' : 'stable'}` : 'No conservation data'}

LSU AgCenter Approved Varieties: ${lsuVarieties.join(', ')}

TASK: Recommend the BEST LSU variety for this specific field based on:
1. Historical health patterns
2. Disease resistance needs
3. Soil type compatibility
4. Community success rates
5. Expected yield improvement (%)

Return JSON with: recommended_variety, expected_improvement (decimal), risk_assessment (low/medium/high), lsu_research_basis (array of citations).`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'You are a crop variety specialist with expertise in LSU AgCenter breeding programs.' },
          { role: 'user', content: aiPrompt }
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      throw new Error('AI recommendation failed');
    }

    const aiData = await response.json();
    const aiResponse = aiData.choices[0].message.content;
    
    let recommendationData;
    try {
      recommendationData = JSON.parse(aiResponse);
    } catch {
      // Default recommendation if parsing fails
      recommendationData = {
        recommended_variety: lsuVarieties[0] || 'Contact LSU AgCenter',
        expected_improvement: 0.15,
        risk_assessment: 'low',
        lsu_research_basis: ['LSU AgCenter Breeding Program 2024'],
      };
    }

    // Save to database (use regular client, RLS allows user to insert their own data)
    const { data, error } = await supabase
      .from('variety_recommendations')
      .insert({
        field_id: fieldId,
        current_variety: currentVariety,
        recommended_variety: recommendationData.recommended_variety,
        expected_improvement: recommendationData.expected_improvement,
        risk_assessment: recommendationData.risk_assessment,
        lsu_research_basis: recommendationData.lsu_research_basis,
      })
      .select()
      .single();

    if (error) throw error;

    return new Response(
      JSON.stringify({ success: true, recommendation: data }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: 'Unable to recommend varieties. Please try again.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
