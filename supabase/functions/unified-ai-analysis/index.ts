import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';
import { requireAuthenticatedUser, getAnonClient, getServiceClient } from '../_shared/auth.ts';
import { getCorsHeaders } from '../_shared/cors.ts';
import { enforceRateLimit, RATE_LIMITS } from '../_shared/rateLimiter.ts';

const unifiedAnalysisSchema = z.object({
  imageUrl: z.string().url().max(2048),
  fieldId: z.string().uuid(),
  assessmentId: z.string().uuid().optional()
});

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
      functionName: 'unified-ai-analysis',
      maxRequests: RATE_LIMITS['unified-ai-analysis'].maxRequests,
      windowMs: RATE_LIMITS['unified-ai-analysis'].windowMs,
    }, req);
    if (!rateLimit.allowed) {
      return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again shortly.' }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const rawBody = await req.json();
    const validation = unifiedAnalysisSchema.safeParse(rawBody);
    
    if (!validation.success) {
      return new Response(JSON.stringify({ error: 'Invalid input data' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { imageUrl, fieldId, assessmentId } = validation.data;

    // Verify field ownership
    const { data: field, error: fieldError } = await supabase
      .from('fields')
      .select('user_id')
      .eq('id', fieldId)
      .single();

    if (fieldError || !field) {
      console.error('Field not found:', fieldError);
      return new Response(JSON.stringify({ error: 'Field not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (field.user_id !== user.id) {
      console.error('Unauthorized field access attempt');
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Use service role for database operations after auth check
    const supabaseAdmin = getServiceClient();

    console.log('🌾 Starting unified AI analysis for field:', fieldId);

    // STEP 1: Gather unified context from all systems
    const context = await gatherUnifiedContext(supabaseAdmin, fieldId);
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // STEP 2: Enhanced Gemini Vision Analysis with full context
    const visionAnalysis = await enhancedVisionAnalysis(
      LOVABLE_API_KEY,
      imageUrl,
      context
    );

    // STEP 3: Parallel AI operations with shared context
    const [waterStress, conservation, variety, community, predictions] = await Promise.all([
      analyzeWaterStress(LOVABLE_API_KEY, { visionAnalysis, context }),
      analyzeConservation(LOVABLE_API_KEY, { visionAnalysis, context }),
      analyzeVariety(LOVABLE_API_KEY, { visionAnalysis, context }),
      analyzeCommunity(LOVABLE_API_KEY, { visionAnalysis, context }),
      generatePredictions(LOVABLE_API_KEY, { visionAnalysis, context })
    ]);

    // STEP 4: Update AI intelligence pool
    await updateIntelligencePool(supabaseAdmin, fieldId, {
      visionAnalysis,
      waterStress,
      conservation,
      variety,
      community,
      predictions
    });

    // STEP 5: Generate unified recommendations
    const recommendations = await generateUnifiedRecommendations(LOVABLE_API_KEY, {
      vision: visionAnalysis,
      waterStress,
      conservation,
      variety,
      community,
      predictions,
      context
    });

    console.log('✅ Unified AI analysis complete');

    return new Response(
      JSON.stringify({
        success: true,
        visionAnalysis,
        waterStress,
        conservation,
        variety,
        community,
        predictions,
        recommendations,
        context_sources: ['vision', 'historical', 'conservation', 'variety', 'weather', 'community']
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('❌ Unified AI analysis error:', error);
    return new Response(
      JSON.stringify({ error: 'Unable to complete analysis. Please try again.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function gatherUnifiedContext(supabase: any, fieldId: string) {
  const [
    { data: fieldData },
    { data: assessmentHistory },
    { data: conservationData },
    { data: varietyData },
    { data: waterStressData },
    { data: predictiveData },
    { data: intelligencePool }
  ] = await Promise.all([
    supabase.from('fields').select('*').eq('id', fieldId).single(),
    supabase.from('assessments').select('*').eq('field_id', fieldId).order('created_at', { ascending: false }).limit(10),
    supabase.from('conservation_predictions').select('*').eq('field_id', fieldId).order('created_at', { ascending: false }).limit(5),
    supabase.from('variety_performance_metrics').select('*').eq('field_id', fieldId).order('created_at', { ascending: false }).limit(5),
    supabase.from('water_stress_events').select('*').eq('field_id', fieldId).order('created_at', { ascending: false }).limit(5),
    supabase.from('predictive_models').select('*').eq('field_id', fieldId).order('created_at', { ascending: false }).limit(3),
    supabase.from('ai_intelligence_pool').select('*').eq('field_id', fieldId).order('snapshot_date', { ascending: false }).limit(1)
  ]);

  return {
    fieldData: fieldData || {},
    assessmentHistory: assessmentHistory || [],
    conservationData: conservationData || [],
    varietyData: varietyData || [],
    waterStressData: waterStressData || [],
    predictiveData: predictiveData || [],
    intelligencePool: intelligencePool?.[0] || {}
  };
}

async function enhancedVisionAnalysis(apiKey: string, imageUrl: string, context: any) {
  const contextPrompt = `
UNIFIED FIELD CONTEXT:
- Crop: ${context.fieldData.crop_type}
- Historical Health Trend: ${context.assessmentHistory.map((a: any) => a.health_score).join(' → ')}
- Recent Symptoms: ${context.assessmentHistory.map((a: any) => a.symptoms?.join(', ')).filter(Boolean).join('; ')}
- Conservation Practices Active: ${context.conservationData.map((c: any) => c.practice_type).join(', ') || 'None'}
- Water Stress Events: ${context.waterStressData.length} in last 30 days

CRITICAL: Analyze this image considering all historical context above.`;

  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [
        { role: 'system', content: 'You are an expert crop pathologist with access to comprehensive field history.' },
        { role: 'user', content: contextPrompt + '\n\nAnalyze crop health from image and return JSON with: health_score, stress_level, symptoms, confidence_score, historical_comparison' }
      ],
      temperature: 0.3,
    }),
  });

  const data = await response.json();
  const content = data.choices[0].message.content;
  
  try {
    return JSON.parse(content);
  } catch {
    throw new Error('AI analysis returned unparseable JSON — refusing to invent health scores');
  }
}

async function analyzeWaterStress(_apiKey: string, _args: any) {
  // Enrichment models are not shipped yet — do not invent stress/confidence.
  return { available: false, reason: 'water_stress_enrichment_not_configured' };
}

async function analyzeConservation(_apiKey: string, _args: any) {
  return { available: false, reason: 'conservation_enrichment_not_configured' };
}

async function analyzeVariety(_apiKey: string, _args: any) {
  return { available: false, reason: 'variety_enrichment_not_configured' };
}

async function analyzeCommunity(_apiKey: string, _args: any) {
  return { available: false, reason: 'community_enrichment_not_configured' };
}

async function generatePredictions(_apiKey: string, _args: any) {
  return { available: false, reason: 'prediction_enrichment_not_configured' };
}

async function updateIntelligencePool(supabase: any, fieldId: string, data: any) {
  await supabase.from('ai_intelligence_pool').insert({
    field_id: fieldId,
    image_analysis_patterns: { symptoms: data.visionAnalysis?.symptoms ?? [] },
    variety_intelligence: {},
    conservation_effectiveness: {},
    weather_correlations: {},
    community_patterns: {},
    predictive_insights: {},
    confidence_scores: {
      vision_analysis: data.visionAnalysis?.confidence_score ?? null,
      water_stress: data.waterStress?.available === false ? null : data.waterStress?.confidence ?? null,
      variety_match: data.variety?.available === false ? null : data.variety?.confidence ?? null,
      community_alignment: data.community?.available === false ? null : data.community?.confidence ?? null,
    },
  });
}

async function generateUnifiedRecommendations(_apiKey: string, data: any) {
  const visionScore = data.vision?.confidence_score ?? data.visionAnalysis?.confidence_score;
  const health = data.vision?.health_score ?? data.visionAnalysis?.health_score;
  return {
    prioritized: [
      {
        title: 'Review latest vision result',
        recommendation:
          health == null
            ? 'Vision enrichment completed without a health score — re-run analysis if needed.'
            : `Latest vision health score is available for this field. Treat it as a decision aid, not a validated diagnosis.`,
        urgency: 'routine',
        contributing_systems: ['vision'],
        enrichment_status: {
          water_stress: data.waterStress?.available === false ? 'not_configured' : 'present',
          conservation: data.conservation?.available === false ? 'not_configured' : 'present',
          variety: data.variety?.available === false ? 'not_configured' : 'present',
          community: data.community?.available === false ? 'not_configured' : 'present',
          predictions: data.predictions?.available === false ? 'not_configured' : 'present',
        },
        research_framing: 'Informed by publicly available agronomic guidance — not an official LSU partnership or validation',
        vision_confidence: visionScore ?? null,
      },
    ],
  };
}
