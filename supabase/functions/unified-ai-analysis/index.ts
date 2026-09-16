import { fetchAI, getAIKey } from '../_shared/ai.ts';
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
    
    const AI_API_KEY = getAIKey();
    if (!AI_API_KEY) {
      throw new Error('AI_API_KEY not configured');
    }

    // STEP 2: Enhanced Gemini Vision Analysis with full context
    const visionAnalysis = await enhancedVisionAnalysis(
      AI_API_KEY,
      imageUrl,
      context
    );

    // STEP 3: Parallel AI operations with shared context
    const [waterStress, conservation, variety, community, predictions] = await Promise.all([
      analyzeWaterStress(AI_API_KEY, { visionAnalysis, context }),
      analyzeConservation(AI_API_KEY, { visionAnalysis, context }),
      analyzeVariety(AI_API_KEY, { visionAnalysis, context }),
      analyzeCommunity(AI_API_KEY, { visionAnalysis, context }),
      generatePredictions(AI_API_KEY, { visionAnalysis, context })
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
    const recommendations = await generateUnifiedRecommendations(AI_API_KEY, {
      vision: visionAnalysis,
      waterStress,
      conservation,
      variety,
      community,
      predictions,
      context
    });

    console.log('✅ Unified AI analysis complete');

    // Only claim sources that gatherUnifiedContext actually loaded — weather is not wired.
    const context_sources = [
      'vision',
      Array.isArray(context?.assessmentHistory) && context.assessmentHistory.length > 0
        ? 'historical'
        : null,
      Array.isArray(context?.conservationData) && context.conservationData.length > 0
        ? 'conservation'
        : null,
      Array.isArray(context?.varietyData) && context.varietyData.length > 0 ? 'variety' : null,
      Array.isArray(context?.waterStressData) && context.waterStressData.length > 0
        ? 'water_stress'
        : null,
    ].filter(Boolean);

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
        context_sources,
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
  const scoredHistory = (context.assessmentHistory || []).filter(
    (a: any) => a.health_score != null && Number.isFinite(Number(a.health_score)),
  );
  const healthTrendLabel =
    scoredHistory.length > 0
      ? scoredHistory.map((a: any) => a.health_score).join(' → ')
      : 'no scored assessments yet';

  const contextPrompt = `
UNIFIED FIELD CONTEXT:
- Crop: ${context.fieldData.crop_type ?? 'not recorded'}
- Historical Health Trend: ${healthTrendLabel}
- Recent Symptoms: ${context.assessmentHistory.map((a: any) => a.symptoms?.join(', ')).filter(Boolean).join('; ') || 'none recorded'}
- Conservation Practices Active: ${context.conservationData.map((c: any) => c.practice_type).join(', ') || 'None'}
- Water Stress Events: ${context.waterStressData.length} in last 30 days

CRITICAL: Analyze this image considering all historical context above.
Do not invent health_score, stress_level, or confidence_score — omit the field if uncertain.`;

  const response = await fetchAI({
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [
        { role: 'system', content: 'You are an expert crop pathologist with access to comprehensive field history. Fail closed: never invent numeric scores.' },
        { role: 'user', content: [
          { type: 'text', text: contextPrompt + '\n\nAnalyze crop health from image and return JSON with: health_score (0-100), stress_level (healthy|moderate|severe), symptoms (array), confidence_score (0-1), historical_comparison (string or null)' },
          { type: 'image_url', image_url: { url: imageUrl } },
        ] }
      ],
      temperature: 0.3,
    }),
  });

  if (!response.ok) throw new Error(`AI analysis failed (HTTP ${response.status})`);
  const data = await response.json();
  const content = data.choices[0].message.content;
  
  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error('AI analysis returned unparseable JSON — refusing to invent health scores');
  }
  return sanitizeVisionAnalysis(parsed);
}

/** Fail-closed vision payload before intelligence-pool write. */
function sanitizeVisionAnalysis(raw: unknown) {
  if (!raw || typeof raw !== 'object') {
    throw new Error('Vision analysis omitted structured result');
  }
  const o = raw as Record<string, unknown>;

  const healthRaw = Number(o.health_score);
  if (!Number.isFinite(healthRaw)) {
    throw new Error('Vision analysis omitted health_score');
  }
  // Accept 0–1 fractions or 0–100 percents; store as 0–100.
  const health_score =
    healthRaw <= 1 && healthRaw >= 0
      ? Math.round(healthRaw * 1000) / 10
      : Math.min(100, Math.max(0, Math.round(healthRaw * 10) / 10));
  if (health_score < 0 || health_score > 100) {
    throw new Error('Vision analysis health_score out of range');
  }

  const confidenceRaw = Number(o.confidence_score);
  if (!Number.isFinite(confidenceRaw) || confidenceRaw < 0 || confidenceRaw > 1) {
    throw new Error('Vision analysis omitted or invalid confidence_score (require 0–1)');
  }

  const stressRaw = String(o.stress_level ?? '').trim().toLowerCase();
  let stress_level: 'healthy' | 'moderate' | 'severe';
  if (stressRaw.includes('severe')) stress_level = 'severe';
  else if (stressRaw.includes('mild') || stressRaw.includes('moderate')) stress_level = 'moderate';
  else if (stressRaw.includes('healthy')) stress_level = 'healthy';
  else {
    throw new Error(`Vision analysis unrecognized stress_level: ${o.stress_level}`);
  }

  const symptoms = Array.isArray(o.symptoms)
    ? o.symptoms.filter((s): s is string => typeof s === 'string').slice(0, 20)
    : [];

  return {
    health_score,
    stress_level,
    confidence_score: confidenceRaw,
    symptoms,
    historical_comparison:
      typeof o.historical_comparison === 'string' ? o.historical_comparison.slice(0, 500) : null,
  };
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
