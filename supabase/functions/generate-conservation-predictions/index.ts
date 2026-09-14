import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';
import { requireAuthenticatedUser, getAnonClient, getServiceClient } from '../_shared/auth.ts';
import { getCorsHeaders } from '../_shared/cors.ts';
import { enforceRateLimit, RATE_LIMITS } from '../_shared/rateLimiter.ts';

const conservationSchema = z.object({
  fieldId: z.string().uuid(),
  practiceType: z.string().min(1).max(100),
  /** @deprecated Ignored — history is loaded from owned assessments. */
  fieldHistory: z.any().optional(),
  /** @deprecated Ignored — weather is loaded from weather_events, never client invent. */
  weatherForecast: z.any().optional()
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
    const admin = getServiceClient();

    const rateLimit = await enforceRateLimit(supabase, user.id, {
      functionName: 'generate-conservation-predictions',
      maxRequests: RATE_LIMITS['generate-conservation-predictions'].maxRequests,
      windowMs: RATE_LIMITS['generate-conservation-predictions'].windowMs,
    }, req);
    if (!rateLimit.allowed) {
      return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again shortly.' }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const rawBody = await req.json();
    const validation = conservationSchema.safeParse(rawBody);
    
    if (!validation.success) {
      return new Response(JSON.stringify({ error: 'Invalid input data' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Client fieldHistory / weatherForecast intentionally ignored (schema accepts for back-compat).
    const { fieldId, practiceType } = validation.data;

    // Ownership first — then load server-side history/weather only.
    const { data: fieldData } = await supabase
      .from('fields')
      .select('*')
      .eq('id', fieldId)
      .maybeSingle();

    if (!fieldData || fieldData.user_id !== user.id) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const [fieldAssessments, communityPractices, weatherData] = await Promise.all([
      supabase
        .from('assessments')
        .select('health_score, analyzed_at')
        .eq('field_id', fieldId)
        .order('analyzed_at', { ascending: false })
        .limit(30)
        .then(res => res.data || []),
      
      supabase
        .from('conservation_adoption_metrics')
        .select('*')
        .eq('practice_type', practiceType)
        .order('total_adopters', { ascending: false })
        .limit(5)
        .then(res => res.data || []),
      
      supabase
        .from('weather_events')
        .select('*')
        .order('event_date', { ascending: false })
        .limit(10)
        .then(res => res.data || [])
    ]);
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Health trend only when enough scored assessments exist — never invent 0% trend
    const scoredAssessments = fieldAssessments.filter(
      (a) => a.health_score != null && Number.isFinite(Number(a.health_score))
    );
    const healthTrend =
      scoredAssessments.length >= 5
        ? scoredAssessments.slice(0, 5).reduce((sum, a) => sum + Number(a.health_score), 0) / 5 -
          scoredAssessments.slice(-5).reduce((sum, a) => sum + Number(a.health_score), 0) / 5
        : null;
    const healthTrendLabel =
      healthTrend == null
        ? 'unknown (insufficient scored assessments)'
        : healthTrend > 0
          ? `+${healthTrend.toFixed(1)} pts`
          : `${healthTrend.toFixed(1)} pts`;

    const aiPrompt = `You are AgurateAI's conservation prediction engine for Louisiana Delta farming.

UNIFIED INTELLIGENCE CONTEXT:

Field Profile:
- Crop: ${fieldData.crop_type}
- Acreage: ${fieldData.acreage}
- Soil Type: ${fieldData.soil_type}
- Health Trend: ${healthTrendLabel}

Conservation Practice: ${practiceType}

Historical Field Performance:
Average Health: ${scoredAssessments.length > 0 ? (scoredAssessments.reduce((sum, a) => sum + Number(a.health_score), 0) / scoredAssessments.length).toFixed(1) : 'N/A'}

Community Adoption Data (${practiceType}):
${communityPractices.map(p => {
  // Use real conservation_adoption_metrics columns only (average_savings).
  // No success_rate on this table — never invent one.
  const savings = p.average_savings != null && Number.isFinite(Number(p.average_savings))
    ? `$${p.average_savings}`
    : 'not recorded';
  const adopters = p.total_adopters != null && Number.isFinite(Number(p.total_adopters))
    ? p.total_adopters
    : 'not recorded';
  return `- ${adopters} farmers: reported community avg savings ${savings} (community-reported, not this farm's measured savings)`;
}).join('\n')}

Weather Context (Recent Events):
${weatherData.slice(0, 5).map(w => `- ${w.event_type}: ${w.event_date}`).join('\n')}

LSU AgCenter Research (public guidance framing only — not measured farm savings):
- No-till / cover crops / precision fert: cite directional soil/input effects; do NOT invent farm-specific $/year

CRITICAL HONESTY RULES:
- Do NOT invent dollar savings ($/year or $/acre) for this farm.
- current_impact / predicted_impact_* MUST be relative planning INDEX scores from 0–100 (not dollars).
- If cost inputs were not provided (they were not), never convert indexes into currency.

TASK: Generate predictive conservation impact analysis:
1. current_impact: relative planning index 0–100 for near-term practice benefit
2. predicted_impact_1_year: relative planning index 0–100 at 1 year
3. predicted_impact_5_year: relative planning index 0–100 at 5 years
4. climate_factor (0-1)
5. soil_health_improvement (0-1)
6. confidence_score (0-1) based on community data quality / sample size

Return JSON with: current_impact, predicted_impact_1_year, predicted_impact_5_year, climate_factor, soil_health_improvement, confidence_score.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'You are a conservation agriculture expert specializing in Louisiana Delta farming.' },
          { role: 'user', content: aiPrompt }
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('AI gateway error:', error);
      throw new Error('AI prediction failed');
    }

    const aiData = await response.json();
    const aiResponse = aiData.choices[0].message.content;
    
    // Parse AI response (assuming JSON format)
    let predictionData;
    try {
      predictionData = JSON.parse(aiResponse);
    } catch {
      throw new Error('Conservation prediction AI returned unparseable JSON — refusing to invent scores');
    }
    if (predictionData.confidence_score == null || Number.isNaN(Number(predictionData.confidence_score))) {
      throw new Error('Conservation prediction omitted confidence_score');
    }

    const indexFields = [
      'current_impact',
      'predicted_impact_1_year',
      'predicted_impact_5_year',
    ] as const;
    for (const field of indexFields) {
      const value = Number(predictionData[field]);
      if (!Number.isFinite(value) || value < 0 || value > 100) {
        throw new Error(`Conservation prediction ${field} must be a 0–100 planning index`);
      }
      predictionData[field] = value;
    }

    const ratioFields = ['climate_factor', 'soil_health_improvement'] as const;
    for (const field of ratioFields) {
      const value = Number(predictionData[field]);
      if (!Number.isFinite(value) || value < 0 || value > 1) {
        throw new Error(`Conservation prediction ${field} must be a finite 0–1 planning factor`);
      }
      predictionData[field] = value;
    }

    const confidenceScore = Number(predictionData.confidence_score);
    if (!Number.isFinite(confidenceScore) || confidenceScore < 0 || confidenceScore > 1) {
      throw new Error('Conservation prediction confidence_score must be a finite 0–1 value');
    }
    predictionData.confidence_score = confidenceScore;

    // Save to database (service role — clients can no longer insert AI metric rows)
    const { data, error } = await admin
      .from('conservation_predictions')
      .insert({
        field_id: fieldId,
        practice_type: practiceType,
        current_impact: predictionData.current_impact,
        predicted_impact_1_year: predictionData.predicted_impact_1_year,
        predicted_impact_5_year: predictionData.predicted_impact_5_year,
        climate_factor: predictionData.climate_factor,
        soil_health_improvement: predictionData.soil_health_improvement,
        confidence_score: predictionData.confidence_score,
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
      JSON.stringify({ error: 'Unable to generate prediction. Please try again.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
