import { fetchAI, getAIKey } from '../_shared/ai.ts';
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';
import { requireAuthenticatedUser, getAnonClient } from '../_shared/auth.ts';
import { getCorsHeaders } from '../_shared/cors.ts';
import { enforceRateLimit, RATE_LIMITS } from '../_shared/rateLimiter.ts';
import { handleError, handleRateLimitError } from '../_shared/errorHandler.ts';

const predictStressSchema = z.object({
  days: z.number().int().min(1).max(30).default(7)
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
    const supabaseClient = getAnonClient(authHeader);

    const rawBody = await req.json();
    const validation = predictStressSchema.safeParse(rawBody);
    
    if (!validation.success) {
      return new Response(JSON.stringify({ error: 'Invalid input data', forecast: [], summary: '', high_risk_days: 0 }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { days } = validation.data;
    
    console.log('[predict-stress] User authenticated:', user.id);

    
    const rateLimit = await enforceRateLimit(supabaseClient, user.id, {
      functionName: 'predict-stress',
      maxRequests: RATE_LIMITS['predict-stress'].maxRequests,
      windowMs: RATE_LIMITS['predict-stress'].windowMs,
    }, req);
    if (!rateLimit.allowed) {
      return handleRateLimitError(corsHeaders);
    }

    // Gather context from real tables only — never query invent / non-existent relations.
    const { data: ownedFields } = await supabaseClient
      .from('fields')
      .select('id')
      .eq('user_id', user.id);
    const ownedFieldIds = (ownedFields || []).map((f: { id: string }) => f.id);

    const [assessments, weatherEvents, waterStress, communityInsights] = await Promise.all([
      supabaseClient
        .from('assessment_details')
        .select('*')
        .eq('user_id', user.id)
        .order('analyzed_at', { ascending: false })
        .limit(50)
        .then(res => res.data || []),
      
      supabaseClient
        .from('weather_events')
        .select('*')
        .order('event_date', { ascending: false })
        .limit(10)
        .then(res => res.data || []),
      
      ownedFieldIds.length > 0
        ? supabaseClient
            .from('water_stress_events')
            .select('field_id, stress_score, severity, confidence, symptoms_detected, irrigation_applied, created_at')
            .in('field_id', ownedFieldIds)
            .order('created_at', { ascending: false })
            .limit(10)
            .then(res => res.data || [])
        : Promise.resolve([] as Array<Record<string, unknown>>),
      
      // Real community_insights rows only — omit savings / lsu_validation invent amplification.
      supabaseClient
        .from('community_insights')
        .select('insight_type, practice, outcome, community_rating, created_at')
        .order('created_at', { ascending: false })
        .limit(5)
        .then(res => res.data || [])
    ]);

    if (!assessments || assessments.length < 3) {
      return new Response(
        JSON.stringify({
          forecast: [],
          summary: 'Need at least 3 historical assessments to generate predictions. Keep analyzing your crops!',
          high_risk_days: 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const AI_API_KEY = getAIKey();
    if (!AI_API_KEY) {
      throw new Error('AI_API_KEY not configured');
    }

    // Prepare enhanced data summary for AI with unified context
    const recentAssessments = assessments.slice(0, 10).map(a => ({
      date: a.analyzed_at,
      crop: a.crop_type,
      health: a.health_score,
      stress: a.stress_level,
      temp: a.weather_temp_f,
      precip: a.weather_precipitation_mm,
      symptoms: a.symptoms
    }));

    const waterStressSummary = waterStress.map(w => ({
      field_id: w.field_id,
      date: w.created_at,
      stress_score: w.stress_score,
      severity: w.severity,
      confidence: w.confidence,
      irrigation_applied: w.irrigation_applied,
      symptoms: w.symptoms_detected,
    }));

    const communityPatterns = communityInsights.map(c => ({
      insight_type: c.insight_type,
      practice: c.practice,
      outcome: c.outcome,
      // community_rating only when finite — never invent 0
      rating:
        c.community_rating != null && Number.isFinite(Number(c.community_rating))
          ? Number(c.community_rating)
          : null,
    }));

    // Generate predictions using Lovable AI
    const response = await fetchAI({
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${AI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are AgurateAI's predictive stress analysis engine for Louisiana Delta farming.
Current date: ${new Date().toISOString().split('T')[0]}

**LSU AGCENTER RESEARCH FOUNDATION (public guidance framing only — do not invent farm-specific %):**
- Water Stress: LSU Rice Research Station water-management guidance (public)
  - Reproductive-stage water stress can reduce yield; cite directional risk only — do NOT invent numeric % losses
  - Critical periods: Panicle initiation, flowering, grain fill
- Heat Stress: LSU AgCenter climate guidance notes high heat can reduce photosynthetic efficiency — do NOT invent a fixed % reduction
- Louisiana Delta Climate: Subtropical with high humidity, frequent heat waves June-August
- Never invent quantitative LSU trial percentages unless the caller provided a cited source

UNIFIED INTELLIGENCE CONTEXT:
- Historical crop health patterns from field assessments
- Recorded water stress events (when present)
- Community-reported practices/outcomes (when present — not farm savings invent)
- Regional weather event correlations
- LSU AgCenter research-informed stress thresholds (public guidance; not an official validation)

Analyze all available data streams to predict crop stress for the next ${days} days.
Consider: heat stress (>90°F), water stress, disease patterns, Louisiana's climate, and community signals.
If water stress or community context is empty, say so — do not invent metrics.
Base predictions on LSU AgCenter research and historical Delta weather patterns.`
          },
          {
            role: 'user',
            content: `UNIFIED CONTEXT DATA:

Historical Assessments (Last 10): ${JSON.stringify(recentAssessments)}

Water Stress Events: ${waterStressSummary.length > 0 ? JSON.stringify(waterStressSummary) : 'none recorded for owned fields'}

Community Insights: ${communityPatterns.length > 0 ? JSON.stringify(communityPatterns) : 'none recorded'}

Recent Weather Events: ${JSON.stringify(weatherEvents || [])}

TASK: Generate ${days}-day forecast predicting crop stress levels using ONLY the context above.
Do not invent missing water-stress or community metrics.
Return JSON only with structured predictions.`
          }
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'generate_forecast',
              description: 'Generate stress predictions',
              parameters: {
                type: 'object',
                properties: {
                  forecast: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        day: { type: 'number' },
                        date: { type: 'string' },
                        risk_level: { type: 'string', enum: ['low', 'medium', 'high'] },
                        predicted_stress: { type: 'string' },
                        confidence: { type: 'number', minimum: 0, maximum: 1 },
                        weather_factor: { type: 'string', maxLength: 100 },
                        recommendation: { type: 'string', maxLength: 200 }
                      },
                      required: ['day', 'date', 'risk_level', 'predicted_stress', 'confidence', 'weather_factor', 'recommendation']
                    },
                    minItems: days,
                    maxItems: days
                  },
                  summary: { type: 'string', maxLength: 300 },
                  high_risk_days: { type: 'number', minimum: 0 }
                },
                required: ['forecast', 'summary', 'high_risk_days'],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: 'function', function: { name: 'generate_forecast' } }
      }),
    });

    if (!response.ok) {
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const aiPayload = await response.json();
    const toolCall = aiPayload.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall) {
      throw new Error('No forecast generated');
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(toolCall.function.arguments);
    } catch {
      throw new Error('Forecast payload was not valid JSON');
    }

    const predictions = sanitizeForecastPayload(parsed, days);

    return new Response(JSON.stringify(predictions), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[predict-stress] Error:', error);
    return handleError(error, 'predict-stress', corsHeaders);
  }
});

const ALLOWED_RISK = new Set(['low', 'medium', 'high']);

/** Fail-closed: drop invent rows; never invent low risk for unknown levels. */
function sanitizeForecastPayload(raw: unknown, days: number) {
  const empty = {
    forecast: [] as Array<Record<string, unknown>>,
    summary: 'Predictions unavailable — model returned incomplete risk data.',
    high_risk_days: 0,
  };

  if (!raw || typeof raw !== 'object') return empty;
  const obj = raw as Record<string, unknown>;
  const rows = Array.isArray(obj.forecast) ? obj.forecast : [];
  const forecast: Array<Record<string, unknown>> = [];

  for (const item of rows) {
    if (!item || typeof item !== 'object') continue;
    const row = item as Record<string, unknown>;
    const risk = String(row.risk_level ?? '').trim().toLowerCase();
    if (!ALLOWED_RISK.has(risk)) continue;

    const confidence = Number(row.confidence);
    if (!Number.isFinite(confidence) || confidence < 0 || confidence > 1) continue;

    const day = Number(row.day);
    if (!Number.isFinite(day) || day < 1) continue;

    const date = typeof row.date === 'string' ? row.date : '';
    if (!date) continue;

    const predicted_stress =
      typeof row.predicted_stress === 'string' && row.predicted_stress.trim()
        ? row.predicted_stress.trim().slice(0, 120)
        : null;
    if (!predicted_stress) continue;

    forecast.push({
      day,
      date,
      risk_level: risk,
      predicted_stress,
      confidence,
      weather_factor:
        typeof row.weather_factor === 'string'
          ? row.weather_factor.slice(0, 100)
          : '',
      recommendation:
        typeof row.recommendation === 'string'
          ? row.recommendation.slice(0, 200)
          : '',
    });

    if (forecast.length >= days) break;
  }

  if (forecast.length === 0) return empty;

  const high_risk_days = forecast.filter((f) => f.risk_level === 'high').length;
  const summary =
    typeof obj.summary === 'string' && obj.summary.trim()
      ? obj.summary.trim().slice(0, 300)
      : 'Stress outlook generated from available field history.';

  return { forecast, summary, high_risk_days };
}