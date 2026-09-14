import { serve } from 'https://deno.land/std@0.178.0/http/server.ts';
import { requireAuthenticatedUser, getAnonClient } from '../_shared/auth.ts';
import { getCorsHeaders } from '../_shared/cors.ts';
import { enforceRateLimit, RATE_LIMITS } from '../_shared/rateLimiter.ts';
import { corsHeaders, handleError } from '../_shared/errorHandler.ts';

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const auth = await requireAuthenticatedUser(req, corsHeaders);
    if (auth instanceof Response) return auth;
    const { user, authHeader } = auth;
    const rateLimitClient = getAnonClient(authHeader);

    const rateLimit = await enforceRateLimit(rateLimitClient, user.id, {
      functionName: 'compare-images',
      maxRequests: RATE_LIMITS['compare-images'].maxRequests,
      windowMs: RATE_LIMITS['compare-images'].windowMs,
    }, req);
    if (!rateLimit.allowed) {
      return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again shortly.' }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { image1_url, image2_url, assessment1_data, assessment2_data } = await req.json();

    if (!image1_url || !image2_url) {
      return new Response(
        JSON.stringify({ error: 'Both image URLs are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calculate basic comparison from assessment data
    const healthChange = assessment2_data.health_score - assessment1_data.health_score;
    const healthTrend = healthChange > 5 ? 'improving' : healthChange < -5 ? 'declining' : 'stable';

    // Use Gemini Vision to analyze visual differences
    const comparisonPrompt = `You are analyzing two crop health assessment images taken at different times.

FIRST IMAGE (${new Date(assessment1_data.analyzed_at).toLocaleDateString()}):
- Health Score: ${assessment1_data.health_score}%
- Stress Level: ${assessment1_data.stress_level}
- Symptoms: ${(assessment1_data.symptoms || []).join(', ') || 'None detected'}

SECOND IMAGE (${new Date(assessment2_data.analyzed_at).toLocaleDateString()}):
- Health Score: ${assessment2_data.health_score}%
- Stress Level: ${assessment2_data.stress_level}
- Symptoms: ${(assessment2_data.symptoms || []).join(', ') || 'None detected'}

Analyze the visual differences between these two images and provide:
1. Visual changes observed (e.g., "Leaf color improved", "Disease spread reduced")
2. Symptom progression (which symptoms improved, worsened, or appeared)
3. Treatment effectiveness assessment (if applicable)
4. Projected recovery timeline (if improving)

Return your analysis as a JSON object with:
{
  "visual_changes": ["change1", "change2"],
  "symptom_progression": ["symptom1 improved", "symptom2 appeared"],
  "treatment_effectiveness": "Assessment of treatment if applicable",
  "projected_recovery": "Timeline estimate if improving"
}`;

    // Call Gemini Vision API with both images
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
            role: 'user',
            content: [
              {
                type: 'text',
                text: comparisonPrompt,
              },
              {
                type: 'image_url',
                image_url: { url: image1_url },
              },
              {
                type: 'image_url',
                image_url: { url: image2_url },
              },
            ],
          },
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      throw new Error('AI comparison failed');
    }

    const data = await response.json();
    const aiAnalysis = data.choices[0].message.content;

    // Try to parse JSON from AI response
    let parsedAnalysis;
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = aiAnalysis.match(/```json\n([\s\S]*?)\n```/) || aiAnalysis.match(/```\n([\s\S]*?)\n```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : aiAnalysis;
      parsedAnalysis = JSON.parse(jsonStr);
    } catch {
      throw new Error('Image comparison AI returned unparseable JSON — refusing to invent structured analysis');
    }

    const result = {
      health_trend: healthTrend,
      health_change: healthChange,
      symptom_progression: parsedAnalysis.symptom_progression || [],
      visual_changes: parsedAnalysis.visual_changes || [],
      treatment_effectiveness: parsedAnalysis.treatment_effectiveness || null,
      projected_recovery: parsedAnalysis.projected_recovery || null,
    };

    return new Response(
      JSON.stringify(result),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    return handleError(error, 'compare-images', corsHeaders);
  }
});

