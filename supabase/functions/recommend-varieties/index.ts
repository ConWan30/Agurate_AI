import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';
import { requireAuthenticatedUser, getAnonClient } from '../_shared/auth.ts';
import { getCorsHeaders } from '../_shared/cors.ts';
import { enforceRateLimit, RATE_LIMITS } from '../_shared/rateLimiter.ts';

const varietySchema = z.object({
  fieldId: z.string().uuid(),
  cropType: z.preprocess((v) => (v === 'soybeans' ? 'soybean' : v), z.enum(['rice', 'soybean', 'cotton', 'corn'])),
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
  const corsHeaders = getCorsHeaders(req);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const auth = await requireAuthenticatedUser(req, corsHeaders);
    if (auth instanceof Response) return auth;
    const { user, authHeader } = auth;
    const supabase = getAnonClient(authHeader);

    const rateLimit = await enforceRateLimit(supabase, user.id, {
      functionName: 'recommend-varieties',
      maxRequests: RATE_LIMITS['recommend-varieties'].maxRequests,
      windowMs: RATE_LIMITS['recommend-varieties'].windowMs,
    }, req);
    if (!rateLimit.allowed) {
      return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again shortly.' }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const rawBody = await req.json();
    const validation = varietySchema.safeParse(rawBody);
    
    if (!validation.success) {
      return new Response(JSON.stringify({ error: 'Invalid input data' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { fieldId, cropType, currentVariety, fieldHistory, diseasePressure } = validation.data;

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
    const scoredAssessments = fieldAssessments.filter(
      (a) => a.health_score != null && !Number.isNaN(Number(a.health_score))
    );
    const avgHealth = scoredAssessments.length > 0
      ? scoredAssessments.reduce((sum, a) => sum + Number(a.health_score), 0) / scoredAssessments.length
      : null;
    
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
- Average Health Score: ${avgHealth == null ? "no scored assessments yet" : avgHealth.toFixed(1)}

Historical Performance (Last 20 Assessments):
${fieldAssessments.map((a, i) => `  ${i + 1}. Health: ${a.health_score != null && Number.isFinite(Number(a.health_score)) ? a.health_score : 'not recorded'}, Stress: ${a.stress_level ?? 'not recorded'}`).join('\n')}

Disease Pressure Patterns:
${diseaseSymptoms.length > 0 ? diseaseSymptoms.slice(0, 10).join(', ') : 'No significant disease pressure'}

Community Intelligence (Best Performing Varieties):
${communityInsights.map(c => `- ${c.practice_name}: ${c.success_rate != null && Number.isFinite(Number(c.success_rate)) ? `${c.success_rate}% success` : 'success not recorded'}, ${c.adoption_count} farmers`).join('\n')}

Conservation Context:
${conservationData.length > 0 ? `Soil health trending ${conservationData[0].soil_health_improvement > 0.5 ? 'upward' : 'stable'}` : 'No conservation data'}

LSU AgCenter published variety references: ${lsuVarieties.join(', ')}

TASK: Recommend the most suitable publicly listed LSU-related variety for this field based on:
1. Historical health patterns
2. Disease resistance needs
3. Soil type compatibility
4. Community success rates
5. Optional planning yield-delta only when grounded in cited public trial ranges — otherwise null

HONESTY:
- Do NOT invent expected_improvement percentages without a cited public LSU/variety trial basis.
- If no cited basis exists, set expected_improvement to null.

Return JSON with: recommended_variety, expected_improvement (decimal 0-1 or null), risk_assessment (low/medium/high), lsu_research_basis (array of citations).`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'You are a crop variety decision-aid assistant. Cite publicly available LSU AgCenter variety guidance as context only — do not claim official approval or partnership.' },
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
      throw new Error('Variety recommendation AI returned unparseable JSON — refusing to invent recommendations');
    }
    if (!recommendationData.recommended_variety) {
      throw new Error('Variety recommendation omitted recommended_variety');
    }

    const rawImprovement = recommendationData.expected_improvement;
    const hasCitedBasis =
      Array.isArray(recommendationData.lsu_research_basis) &&
      recommendationData.lsu_research_basis.length > 0;
    const expectedImprovement =
      hasCitedBasis &&
      rawImprovement != null &&
      Number.isFinite(Number(rawImprovement)) &&
      Number(rawImprovement) >= 0 &&
      Number(rawImprovement) <= 1
        ? Number(rawImprovement)
        : null;

    // Save to database (use regular client, RLS allows user to insert their own data)
    const { data, error } = await supabase
      .from('variety_recommendations')
      .insert({
        field_id: fieldId,
        current_variety: currentVariety,
        recommended_variety: recommendationData.recommended_variety,
        expected_improvement: expectedImprovement,
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
