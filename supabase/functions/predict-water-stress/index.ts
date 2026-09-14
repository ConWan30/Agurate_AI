import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';
import { requireAuthenticatedUser, getAnonClient } from '../_shared/auth.ts';
import { getCorsHeaders } from '../_shared/cors.ts';
import { enforceRateLimit, RATE_LIMITS } from '../_shared/rateLimiter.ts';

const waterStressSchema = z.object({
  fieldId: z.string().uuid(),
  assessmentId: z.string().uuid().optional(),
  healthScore: z.number().min(0).max(100),
  symptoms: z.array(z.string()).max(50),
  weatherData: z.any().optional()
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
      functionName: 'predict-water-stress',
      maxRequests: RATE_LIMITS['predict-water-stress'].maxRequests,
      windowMs: RATE_LIMITS['predict-water-stress'].windowMs,
    }, req);
    if (!rateLimit.allowed) {
      return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again shortly.' }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const rawBody = await req.json();
    const validation = waterStressSchema.safeParse(rawBody);
    
    if (!validation.success) {
      return new Response(JSON.stringify({ error: 'Invalid input data' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { fieldId, assessmentId, healthScore, symptoms, weatherData } = validation.data;

    // Verify field ownership
    const { data: field, error: fieldError } = await supabase
      .from('fields')
      .select('user_id')
      .eq('id', fieldId)
      .single();

    if (fieldError || !field || field.user_id !== user.id) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const aiPrompt = `You are AgurateAI's water stress prediction engine for Louisiana Delta crops.

Current Assessment:
- Health Score: ${healthScore}%
- Symptoms: ${symptoms.join(', ')}
- Weather: ${JSON.stringify(weatherData)}

Analyze water stress risk for next 7 days:
1. Calculate stress probability per day (0-1 scale)
2. Determine severity level (mild/moderate/severe)
3. Identify symptoms indicating water stress
4. Recommend if DIRT irrigation tool consultation needed
5. Calculate confidence score

Return JSON with daily predictions and DIRT recommendation.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'You are a crop water stress expert specializing in Louisiana Delta agriculture.' },
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
      predictionData = {
        stress_score: healthScore < 70 ? 0.7 : 0.3,
        severity: healthScore < 60 ? 'severe' : healthScore < 75 ? 'moderate' : 'mild',
        confidence: 0.8,
        dirt_recommendation: healthScore < 70,
        symptoms_detected: symptoms,
      };
    }

    // Save to database (use regular client, RLS allows user to insert their own data)
    const { data, error } = await supabase
      .from('water_stress_events')
      .insert({
        field_id: fieldId,
        assessment_id: assessmentId,
        stress_score: predictionData.stress_score,
        severity: predictionData.severity,
        confidence: predictionData.confidence,
        weather_context: weatherData,
        symptoms_detected: predictionData.symptoms_detected,
        dirt_recommendation: predictionData.dirt_recommendation,
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
      JSON.stringify({ error: 'Unable to predict water stress. Please try again.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
