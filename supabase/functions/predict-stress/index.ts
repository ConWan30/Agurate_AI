import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';
import { requireAuthenticatedUser, getAnonClient } from '../_shared/auth.ts';
import { handleError, handleRateLimitError } from '../_shared/errorHandler.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const predictStressSchema = z.object({
  days: z.number().int().min(1).max(30).default(7)
});

serve(async (req) => {
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

    // Rate limiting: Check request frequency (5 predictions per minute)
    const { data: recentRequests } = await supabaseClient
      .from('request_logs')
      .select('created_at')
      .eq('user_id', user.id)
      .eq('function_name', 'predict-stress')
      .gte('created_at', new Date(Date.now() - 60000).toISOString());

    if (recentRequests && recentRequests.length >= 5) {
      return handleRateLimitError(corsHeaders);
    }

    // Log this request
    await supabaseClient
      .from('request_logs')
      .insert({
        user_id: user.id,
        function_name: 'predict-stress',
        ip_address: req.headers.get('x-forwarded-for') || 'unknown',
        user_agent: req.headers.get('user-agent') || 'unknown'
      });

    // Gather comprehensive context data
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
      
      supabaseClient
        .from('water_stress_intelligence')
        .select('*')
        .eq('user_id', user.id)
        .order('measurement_date', { ascending: false })
        .limit(10)
        .then(res => res.data || []),
      
      supabaseClient
        .from('community_intelligence')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5)
        .then(res => res.data || [])
    ]);

    const assessError = !assessments;

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

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
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
      date: w.measurement_date,
      stress_index: w.stress_index,
      soil_moisture: w.soil_moisture_percent,
      irrigation_needed: w.irrigation_recommendation
    }));

    const communityPatterns = communityInsights.map(c => ({
      pattern_type: c.pattern_type,
      insight: c.insight_summary,
      confidence: c.confidence_score
    }));

    // Generate predictions using Lovable AI
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are AgurateAI's predictive stress analysis engine for Louisiana Delta farming.
Current date: ${new Date().toISOString().split('T')[0]}

**LSU AGCENTER RESEARCH FOUNDATION:**
- Water Stress: LSU Rice Research Station, "Water Management for Louisiana Rice Production" (2024)
  - Water stress during reproductive stages causes 20-40% yield reduction
  - Critical periods: Panicle initiation, flowering, grain fill
- Heat Stress: LSU AgCenter climate research shows >95°F temperatures reduce photosynthesis by 30%
- Louisiana Delta Climate: Subtropical with high humidity, frequent heat waves June-August

UNIFIED INTELLIGENCE CONTEXT:
- Historical crop health patterns from field assessments
- Water stress intelligence and irrigation data
- Community-wide patterns and early warnings
- Regional weather event correlations
- LSU AgCenter research-informed stress thresholds (public guidance; not an official validation)

Analyze all available data streams to predict crop stress for the next ${days} days.
Consider: heat stress (>90°F), water stress, disease patterns, Louisiana's climate, and community intelligence.
Base predictions on LSU AgCenter research and historical Delta weather patterns.`
          },
          {
            role: 'user',
            content: `UNIFIED CONTEXT DATA:

Historical Assessments (Last 10): ${JSON.stringify(recentAssessments)}

Water Stress Intelligence: ${JSON.stringify(waterStressSummary)}

Community Patterns: ${JSON.stringify(communityPatterns)}

Recent Weather Events: ${JSON.stringify(weatherEvents || [])}

TASK: Generate ${days}-day forecast predicting crop stress levels using ALL context sources. 
Leverage community patterns for early warning signals and water stress data for irrigation timing.
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

    const aiData = await response.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall) {
      throw new Error('No predictions generated');
    }

    const predictions = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(predictions), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[predict-stress] Error:', error);
    return handleError(error, 'predict-stress', corsHeaders);
  }
});
