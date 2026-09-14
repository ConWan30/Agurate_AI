import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { requireAuthenticatedUser, getAnonClient } from '../_shared/auth.ts';
import { getCorsHeaders } from '../_shared/cors.ts';
import { enforceRateLimit, RATE_LIMITS } from '../_shared/rateLimiter.ts';

// Open-Meteo API for weather data (free, no API key required)
const getWeatherData = async (latitude: number, longitude: number) => {
  try {
    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weathercode&timezone=America/Chicago&forecast_days=1`
    );
    
    if (!response.ok) {
      throw new Error('Weather API failed');
    }
    
    const data = await response.json();
    const daily = data.daily;
    
    return {
      highTemp: daily.temperature_2m_max[0],
      lowTemp: daily.temperature_2m_min[0],
      precipitation: daily.precipitation_sum[0],
      weatherCode: daily.weathercode[0],
      date: daily.time[0],
    };
  } catch (error) {
    console.error('Error fetching weather:', error);
    return null;
  }
};

// Default coordinates for Louisiana Delta (Morehouse Parish)
const DEFAULT_LAT = 32.8;
const DEFAULT_LON = -91.8;


function toHealthPercent(score: number | null | undefined): number {
  if (score == null || Number.isNaN(Number(score))) return 0;
  const n = Number(score);
  if (n <= 1) return Math.round(n * 1000) / 10;
  return Math.min(100, Math.max(0, Math.round(n * 10) / 10));
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const auth = await requireAuthenticatedUser(req, corsHeaders);
    if (auth instanceof Response) return auth;
    const { user, authHeader } = auth;
    const supabaseClient = getAnonClient(authHeader);

    const rateLimit = await enforceRateLimit(supabaseClient, user.id, {
      functionName: 'generate-daily-briefing',
      maxRequests: RATE_LIMITS['generate-daily-briefing'].maxRequests,
      windowMs: RATE_LIMITS['generate-daily-briefing'].windowMs,
    }, req);
    if (!rateLimit.allowed) {
      return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again shortly.' }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch user's fields
    const { data: fields } = await supabaseClient
      .from('fields')
      .select('id, name, crop_type, location_lat, location_lng')
      .eq('user_id', user.id);

    if (!fields || fields.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No fields found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get weather data (use first field's location or default)
    const firstField = fields[0];
    const lat = firstField.location_lat || DEFAULT_LAT;
    const lon = firstField.location_lng || DEFAULT_LON;
    const weather = await getWeatherData(lat, lon);

    // Fetch recent assessments for each field
    const fieldAssessments = await Promise.all(
      fields.map(async (field) => {
        const { data: assessment } = await supabaseClient
          .from('assessments')
          .select('health_score, stress_level, analyzed_at, symptoms, disease_identified, pest_identified')
          .eq('field_id', field.id)
          .order('analyzed_at', { ascending: false })
          .limit(1)
          .single();

        return {
          ...field,
          latestAssessment: assessment,
        };
      })
    );

    // Build context for AI
    let contextPrompt = 'You are Delta Intelligence, generating a daily morning briefing for a Louisiana Delta farmer.\n\n';
    contextPrompt += `TODAY'S DATE: ${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}\n\n`;
    
    if (weather) {
      contextPrompt += `WEATHER TODAY:\n`;
      contextPrompt += `- High: ${weather.highTemp}°F\n`;
      contextPrompt += `- Low: ${weather.lowTemp}°F\n`;
      contextPrompt += `- Precipitation: ${weather.precipitation}mm\n\n`;
    }

    contextPrompt += `FIELD STATUS:\n`;
    fieldAssessments.forEach((field) => {
      const healthScore = toHealthPercent(field.latestAssessment?.health_score);
      contextPrompt += `- ${field.name} (${field.crop_type}): ${healthScore.toFixed(0)}% health, ${field.latestAssessment?.stress_level || 'unknown'} stress\n`;
      if (field.latestAssessment?.disease_identified) {
        contextPrompt += `  Diseases: ${field.latestAssessment.disease_identified.join(', ')}\n`;
      }
      if (field.latestAssessment?.pest_identified) {
        contextPrompt += `  Pests: ${field.latestAssessment.pest_identified.join(', ')}\n`;
      }
    });

    contextPrompt += `\nTASK: Generate a concise, actionable daily briefing with:\n`;
    contextPrompt += `1. Top 3 priorities (urgent/monitor/routine) with specific actions\n`;
    contextPrompt += `2. Weather-based recommendations (spray windows, irrigation needs, etc.)\n`;
    contextPrompt += `3. Time-specific guidance (e.g., "Spray between 7-11 AM before heat")`;
    contextPrompt += `\n\nFormat as JSON:\n`;
    contextPrompt += `{\n`;
    contextPrompt += `  "priorities": [\n`;
    contextPrompt += `    {"fieldName": "Field 3", "issue": "Rice blast detected", "urgency": "high", "action": "Scout today for spread. If lesions increased, spray azoxystrobin by evening."},\n`;
    contextPrompt += `    {"fieldName": "Field 5", "issue": "Heat stress predicted", "urgency": "medium", "action": "Check at 3 PM for leaf wilting. Increase irrigation if severe."}\n`;
    contextPrompt += `  ],\n`;
    contextPrompt += `  "weatherRecommendation": "Warm and dry conditions. Consider irrigation for stressed fields.",\n`;
    contextPrompt += `  "sprayWindow": "7 AM - 11 AM (before heat + wind pickup)",\n`;
    contextPrompt += `  "achievements": ["3 fields in excellent health", "No critical issues detected"]\n`;
    contextPrompt += `}\n\n`;
    contextPrompt += `Return ONLY valid JSON, no other text.`;

    // Call AI Gateway
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('LOVABLE_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: contextPrompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 800,
      }),
    });

    if (!aiResponse.ok) {
      throw new Error(`AI Gateway error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const aiContent = aiData.choices?.[0]?.message?.content || '{}';

    // Parse AI response
    let briefingData: any = {};
    try {
      // Extract JSON from response (might have markdown code blocks)
      const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        briefingData = JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      console.error('Error parsing AI response:', error);
    }

    // Fallback if AI parsing failed
    if (!briefingData.priorities || briefingData.priorities.length === 0) {
      briefingData = {
        priorities: fieldAssessments
          .filter((f) => {
            const pct = toHealthPercent(f.latestAssessment?.health_score);
            return f.latestAssessment && pct > 0 && pct < 75;
          })
          .slice(0, 3)
          .map((field) => {
            const pct = toHealthPercent(field.latestAssessment?.health_score);
            return {
              fieldName: field.name,
              issue: `Health score: ${pct.toFixed(0)}%`,
              urgency: pct < 50 ? 'high' : 'medium',
              action: 'Monitor closely and consider treatment if symptoms worsen.',
            };
          }),
        weatherRecommendation: weather
          ? `High: ${weather.highTemp}°F, Low: ${weather.lowTemp}°F. ${weather.precipitation > 0 ? `${weather.precipitation}mm rain expected.` : 'Dry conditions.'}`
          : 'Check local weather forecast for today.',
        sprayWindow: '7 AM - 11 AM (optimal conditions)',
        achievements: [],
      };
    }

    return new Response(
      JSON.stringify({
        ...briefingData,
        weather: weather || null,
        date: new Date().toISOString(),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error generating daily briefing:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

