import { fetchAI, getAIKey } from '../_shared/ai.ts';
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';
import { requireAuthenticatedUser, getAnonClient, getServiceClient } from '../_shared/auth.ts';
import { getCorsHeaders } from '../_shared/cors.ts';
import { enforceRateLimit, RATE_LIMITS } from '../_shared/rateLimiter.ts';

const waterStressSchema = z.object({
  fieldId: z.string().uuid(),
  assessmentId: z.string().uuid(),
  /** @deprecated Ignored — health is loaded from the owned assessment. */
  healthScore: z.number().min(0).max(100).optional(),
  /** @deprecated Ignored — symptoms are loaded from the owned assessment. */
  symptoms: z.array(z.string()).max(50).optional(),
  weatherData: z.any().optional(), // @deprecated ignored — never trust client weather invent
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

    const { fieldId, assessmentId } = validation.data;

    // Verify field ownership + load coords for server weather (ignore client weatherData).
    const { data: field, error: fieldError } = await supabase
      .from('fields')
      .select('user_id, location_lat, location_lng')
      .eq('id', fieldId)
      .single();

    if (fieldError || !field || field.user_id !== user.id) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Trust persisted assessment only — never client healthScore/symptoms invent.
    const { data: assessment, error: assessmentError } = await supabase
      .from('assessments')
      .select('id, field_id, health_score, disease_identified, pest_identified, stress_level')
      .eq('id', assessmentId)
      .eq('field_id', fieldId)
      .maybeSingle();

    if (assessmentError || !assessment) {
      return new Response(JSON.stringify({ error: 'Assessment not found for field' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const healthScore =
      assessment.health_score != null && Number.isFinite(Number(assessment.health_score))
        ? Number(assessment.health_score)
        : null;
    const labelThreat = (item: unknown): string | null => {
      if (typeof item === 'string' && item.trim()) return item.trim();
      if (item && typeof item === 'object') {
        const o = item as Record<string, unknown>;
        const name = o.name ?? o.disease ?? o.pest;
        return typeof name === 'string' && name.trim() ? name.trim() : null;
      }
      return null;
    };
    const symptoms = [
      ...(Array.isArray(assessment.disease_identified)
        ? assessment.disease_identified.map(labelThreat).filter((s): s is string => !!s)
        : []),
      ...(Array.isArray(assessment.pest_identified)
        ? assessment.pest_identified.map(labelThreat).filter((s): s is string => !!s)
        : []),
      ...(assessment.stress_level ? [String(assessment.stress_level)] : []),
    ];
    
    const AI_API_KEY = getAIKey();
    if (!AI_API_KEY) {
      throw new Error('AI_API_KEY not configured');
    }

    // Server-fetched weather only — never persist client weather invent.
    let weatherContext: Record<string, unknown> | null = null;
    const lat = field.location_lat != null ? Number(field.location_lat) : null;
    const lng = field.location_lng != null ? Number(field.location_lng) : null;
    if (lat != null && lng != null && Number.isFinite(lat) && Number.isFinite(lng)) {
      try {
        const weatherRes = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&temperature_unit=fahrenheit&precipitation_unit=inch&forecast_days=7&timezone=America/Chicago`,
        );
        if (weatherRes.ok) {
          const weatherJson = await weatherRes.json();
          weatherContext = {
            source: 'open-meteo',
            latitude: lat,
            longitude: lng,
            daily: weatherJson.daily ?? null,
          };
        }
      } catch (weatherErr) {
        console.error('Open-Meteo fetch failed; continuing without weather context', weatherErr);
      }
    }

    const aiPrompt = `You are AgurateAI's water stress prediction engine for Louisiana Delta crops.

Current Assessment:
- Health Score: ${healthScore != null ? `${healthScore}%` : 'not recorded'}
- Symptoms: ${symptoms.length ? symptoms.join(', ') : 'not recorded'}
- Weather: ${weatherContext != null ? JSON.stringify(weatherContext) : 'not available — do not invent weather conditions'}

Analyze water stress risk for next 7 days:
1. Calculate stress probability per day (0-1 scale)
2. Determine severity level (mild/moderate/severe)
3. Identify symptoms indicating water stress
4. Recommend if DIRT irrigation tool consultation needed
5. Calculate confidence score

Return JSON with daily predictions and DIRT recommendation.`;

    const response = await fetchAI({
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${AI_API_KEY}`,
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
      throw new Error('Water-stress prediction AI returned unparseable JSON — refusing to invent scores');
    }
    if (predictionData.confidence == null || Number.isNaN(Number(predictionData.confidence))) {
      throw new Error('Water-stress prediction omitted confidence');
    }
    if (predictionData.stress_score == null || Number.isNaN(Number(predictionData.stress_score))) {
      throw new Error('Water-stress prediction omitted stress_score');
    }

    const stressScore = Number(predictionData.stress_score);
    if (!Number.isFinite(stressScore) || stressScore < 0 || stressScore > 1) {
      throw new Error('Water-stress prediction stress_score must be a finite 0–1 value');
    }
    const confidence = Number(predictionData.confidence);
    if (!Number.isFinite(confidence) || confidence < 0 || confidence > 1) {
      throw new Error('Water-stress prediction confidence must be a finite 0–1 value');
    }
    const allowedSeverities = new Set(['none', 'mild', 'moderate', 'severe', 'critical', 'unknown']);
    const severity = String(predictionData.severity ?? 'unknown');
    if (!allowedSeverities.has(severity)) {
      throw new Error('Water-stress prediction severity is invalid — refusing to invent severity');
    }

    // Save to database (service role — clients can no longer insert AI metric rows)
    const { data, error } = await admin
      .from('water_stress_events')
      .insert({
        field_id: fieldId,
        assessment_id: assessmentId,
        stress_score: stressScore,
        severity,
        confidence,
        weather_context: weatherContext,
        symptoms_detected: Array.isArray(predictionData.symptoms_detected)
          ? predictionData.symptoms_detected
          : [],
        dirt_recommendation: predictionData.dirt_recommendation ?? null,
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
