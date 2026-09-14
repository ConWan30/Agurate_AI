import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';
import { requireAuthenticatedUser, getAnonClient, getServiceClient } from '../_shared/auth.ts';
import { getCorsHeaders } from '../_shared/cors.ts';
import { enforceRateLimit, RATE_LIMITS } from '../_shared/rateLimiter.ts';

const cropEnum = z.enum(['rice', 'soybean', 'cotton', 'corn']);
const comprehensivePredictionSchema = z.object({
  fieldId: z.string().uuid(),
  /** @deprecated Ignored when field crop_type is present — field crop is authoritative. */
  cropType: z.preprocess((v) => (v === 'soybeans' ? 'soybean' : v), cropEnum).optional(),
  /** @deprecated Ignored — client weather invent is not trusted. */
  weatherForecast: z.any().optional()
});

function normalizeCrop(raw: unknown): z.infer<typeof cropEnum> | null {
  if (typeof raw !== 'string') return null;
  const v = raw.toLowerCase() === 'soybeans' ? 'soybean' : raw.toLowerCase();
  const parsed = cropEnum.safeParse(v);
  return parsed.success ? parsed.data : null;
}

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
    const admin = getServiceClient();

    const rateLimit = await enforceRateLimit(supabase, user.id, {
      functionName: 'generate-comprehensive-predictions',
      maxRequests: RATE_LIMITS['generate-comprehensive-predictions'].maxRequests,
      windowMs: RATE_LIMITS['generate-comprehensive-predictions'].windowMs,
    }, req);
    if (!rateLimit.allowed) {
      return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again shortly.' }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const rawBody = await req.json();
    const validation = comprehensivePredictionSchema.safeParse(rawBody);
    
    if (!validation.success) {
      return new Response(JSON.stringify({ error: 'Invalid input data' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { fieldId } = validation.data;

    // Verify field ownership and load authoritative crop (ignore client crop/weather invent).
    const { data: field, error: fieldError } = await supabase
      .from('fields')
      .select('*')
      .eq('id', fieldId)
      .maybeSingle();

    if (fieldError || !field || field.user_id !== user.id) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const cropType = normalizeCrop(field.crop_type);
    if (!cropType) {
      return new Response(
        JSON.stringify({ error: 'Field crop_type is missing or unsupported for predictions' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }
    const weatherForecast = null; // never trust client-supplied weather invent

    const { data: assessments } = await supabase
      .from('assessments')
      .select('*')
      .eq('field_id', fieldId)
      .order('analyzed_at', { ascending: false })
      .limit(10);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const scoredAssessments = (assessments || []).filter(
      (a: { health_score?: number | null }) =>
        a.health_score != null && Number.isFinite(Number(a.health_score))
    );

    const aiPrompt = `You are AgurateAI's comprehensive predictive analytics engine for Louisiana Delta farming.

Field Data:
- Crop: ${cropType}
- Acreage: ${field?.acreage ?? 'not recorded'}
- Scored Assessments (health only when recorded): ${JSON.stringify(scoredAssessments)}
- Weather Forecast: not provided (do not invent weather conditions)

HONESTY RULES:
- Do NOT invent bushels/acre yield numbers or dollar profitability.
- Do NOT invent economic_forecast, revenue, or cost figures — farmer cost/price inputs were not provided.
- yield_outlook and disease_risk must be relative planning INDEX scores from 0–100 (not measured farm outcomes).
- weather_impact must be a short qualitative risk note or null — not invented stress percentages.
- If scored assessment history is insufficient (<3), lower confidence and say so in recommendations.

Generate planning forecasts for next 30 days:
1. yield_outlook: relative planning index 0–100 (not bushels)
2. disease_risk: outbreak risk index 0–100
3. weather_impact: qualitative stress note or null
4. recommendations: actionable monitoring/treatment questions (no invented $/acre rates)
5. confidence_score: 0–1 based on data quality

Return JSON with: yield_outlook, disease_risk, weather_impact, recommendations, confidence_score.
Do NOT include economic_forecast, yield_prediction bushels, or currency fields.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'You are a comprehensive agricultural predictive analytics expert specializing in Louisiana Delta farming.' },
          { role: 'user', content: aiPrompt }
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      throw new Error('AI prediction failed');
    }

    const aiData = await response.json();
    const aiResponse = aiData.choices[0].message.content;
    
    let predictionData;
    try {
      predictionData = JSON.parse(aiResponse);
    } catch {
      throw new Error('Comprehensive prediction AI returned unparseable JSON — refusing to invent scores');
    }
    if (predictionData.confidence_score == null || Number.isNaN(Number(predictionData.confidence_score))) {
      throw new Error('Comprehensive prediction omitted confidence_score');
    }

    // Strip invented yield/$ fields if the model still emits them
    const {
      economic_forecast: _economic,
      yield_prediction: _yieldBu,
      profitability: _profit,
      ...safePrediction
    } = predictionData as Record<string, unknown>;

    const yieldOutlook = Number(safePrediction.yield_outlook);
    if (!Number.isFinite(yieldOutlook) || yieldOutlook < 0 || yieldOutlook > 100) {
      throw new Error('Comprehensive prediction yield_outlook must be a 0–100 planning index');
    }
    safePrediction.yield_outlook = yieldOutlook;

    const diseaseRisk = Number(safePrediction.disease_risk);
    if (!Number.isFinite(diseaseRisk) || diseaseRisk < 0 || diseaseRisk > 100) {
      throw new Error('Comprehensive prediction disease_risk must be a 0–100 planning index');
    }
    safePrediction.disease_risk = diseaseRisk;

    const confidenceScore = Number(predictionData.confidence_score);
    if (!Number.isFinite(confidenceScore) || confidenceScore < 0 || confidenceScore > 1) {
      throw new Error('Comprehensive prediction confidence_score must be a finite 0–1 value');
    }

    // Save predictive model
    const { data, error } = await admin
      .from('predictive_models')
      .insert({
        model_type: 'comprehensive',
        field_id: fieldId,
        prediction_horizon: 30,
        // DB CHECK requires 0–1; do not convert to 0–100 health percent.
        confidence_score: confidenceScore,
        prediction_data: safePrediction,
        lsu_validation: false,
      })
      .select()
      .single();

    if (error) throw error;

    return new Response(
      JSON.stringify({ success: true, prediction: data }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: 'Unable to generate predictions. Please try again.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
