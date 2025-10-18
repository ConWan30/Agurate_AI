import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { days = 7 } = await req.json();
    
    const authHeader = req.headers.get('Authorization')!;
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_PUBLISHABLE_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    // Get user ID from auth
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      throw new Error('Unauthorized');
    }

    // Fetch historical assessments
    const { data: assessments, error: assessError } = await supabaseClient
      .from('assessment_details')
      .select('*')
      .eq('user_id', user.id)
      .order('analyzed_at', { ascending: false })
      .limit(50);

    if (assessError) throw assessError;

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

    // Fetch recent weather events
    const { data: weatherEvents } = await supabaseClient
      .from('weather_events')
      .select('*')
      .order('event_date', { ascending: false })
      .limit(10);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Prepare data summary for AI
    const recentAssessments = assessments.slice(0, 10).map(a => ({
      date: a.analyzed_at,
      crop: a.crop_type,
      health: a.health_score,
      stress: a.stress_level,
      temp: a.weather_temp_f,
      precip: a.weather_precipitation_mm,
      symptoms: a.symptoms
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
            content: `You are an agricultural AI analyzing crop stress patterns in Louisiana's Delta region. 
Current date: ${new Date().toISOString().split('T')[0]}
Analyze historical assessment data and predict crop stress for the next ${days} days.
Consider: heat stress (>90°F), water stress, disease patterns, and Louisiana's climate.`
          },
          {
            role: 'user',
            content: `Historical assessments: ${JSON.stringify(recentAssessments)}
Recent weather: ${JSON.stringify(weatherEvents || [])}

Generate ${days}-day forecast predicting crop stress levels. Return JSON only.`
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
    console.error('Prediction error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Prediction failed',
        forecast: [],
        summary: 'Unable to generate predictions at this time.',
        high_risk_days: 0
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
