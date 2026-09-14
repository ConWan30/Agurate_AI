import { serve } from 'https://deno.land/std@0.178.0/http/server.ts';
import { requireAuthenticatedUser, getAnonClient } from '../_shared/auth.ts';
import { getCorsHeaders } from '../_shared/cors.ts';
import { enforceRateLimit, RATE_LIMITS } from '../_shared/rateLimiter.ts';
import { handleError } from '../_shared/errorHandler.ts';

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
    const supabase = getAnonClient(authHeader);

    const rateLimit = await enforceRateLimit(supabase, user.id, {
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

    const body = await req.json();
    const assessment1Id = body.assessment1_id ?? body.assessment_id_1;
    const assessment2Id = body.assessment2_id ?? body.assessment_id_2;
    const image1_url = body.image1_url;
    const image2_url = body.image2_url;

    if (!assessment1Id || !assessment2Id) {
      return new Response(
        JSON.stringify({ error: 'assessment1_id and assessment2_id are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    if (!image1_url || !image2_url) {
      return new Response(
        JSON.stringify({ error: 'Both image URLs are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const { data: assessments, error: assessmentError } = await supabase
      .from('assessments')
      .select('id, field_id, health_score, stress_level, symptoms, analyzed_at, fields!inner(user_id)')
      .in('id', [assessment1Id, assessment2Id]);

    if (assessmentError) throw assessmentError;

    const owned = (assessments ?? []).filter(
      (a: { fields?: { user_id?: string } }) => a.fields?.user_id === user.id,
    );
    const assessment1 = owned.find((a: { id: string }) => a.id === assessment1Id);
    const assessment2 = owned.find((a: { id: string }) => a.id === assessment2Id);

    if (!assessment1 || !assessment2) {
      return new Response(
        JSON.stringify({ error: 'Assessments not found for authenticated user' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const health1 =
      assessment1.health_score != null && Number.isFinite(Number(assessment1.health_score))
        ? Number(assessment1.health_score)
        : null;
    const health2 =
      assessment2.health_score != null && Number.isFinite(Number(assessment2.health_score))
        ? Number(assessment2.health_score)
        : null;
    const healthChange = health1 != null && health2 != null ? health2 - health1 : null;
    const healthTrend =
      healthChange == null
        ? 'unknown'
        : healthChange > 5
          ? 'improving'
          : healthChange < -5
            ? 'declining'
            : 'stable';

    const symptoms1 = Array.isArray(assessment1.symptoms) ? assessment1.symptoms : [];
    const symptoms2 = Array.isArray(assessment2.symptoms) ? assessment2.symptoms : [];
    const analyzed1 = assessment1.analyzed_at
      ? new Date(assessment1.analyzed_at).toLocaleDateString()
      : 'date not recorded';
    const analyzed2 = assessment2.analyzed_at
      ? new Date(assessment2.analyzed_at).toLocaleDateString()
      : 'date not recorded';

    const comparisonPrompt = `You are analyzing two crop health assessment images taken at different times.

FIRST IMAGE (${analyzed1}):
- Health Score: ${health1 != null ? `${health1}%` : 'not recorded'}
- Stress Level: ${assessment1.stress_level ?? 'not recorded'}
- Symptoms: ${symptoms1.length ? symptoms1.join(', ') : 'not recorded'}

SECOND IMAGE (${analyzed2}):
- Health Score: ${health2 != null ? `${health2}%` : 'not recorded'}
- Stress Level: ${assessment2.stress_level ?? 'not recorded'}
- Symptoms: ${symptoms2.length ? symptoms2.join(', ') : 'not recorded'}

Analyze the visual differences between these two images and provide:
1. Visual changes observed
2. Symptom progression (improved, worsened, or appeared) — do not invent symptoms absent from both the images and recorded lists
3. Treatment effectiveness assessment only if evidence is present
4. Projected recovery timeline only if improving with supporting evidence

Return your analysis as a JSON object with:
{
  "visual_changes": ["change1", "change2"],
  "symptom_progression": ["symptom1 improved", "symptom2 appeared"],
  "treatment_effectiveness": "Assessment of treatment if applicable",
  "projected_recovery": "Timeline estimate if improving"
}`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: comparisonPrompt },
              { type: 'image_url', image_url: { url: image1_url } },
              { type: 'image_url', image_url: { url: image2_url } },
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

    let parsedAnalysis;
    try {
      const jsonMatch =
        aiAnalysis.match(/```json\n([\s\S]*?)\n```/) || aiAnalysis.match(/```\n([\s\S]*?)\n```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : aiAnalysis;
      parsedAnalysis = JSON.parse(jsonStr);
    } catch {
      throw new Error(
        'Image comparison AI returned unparseable JSON — refusing to invent structured analysis',
      );
    }

    const result = {
      health_trend: healthTrend,
      health_change: healthChange,
      health_scores_recorded: health1 != null && health2 != null,
      symptom_progression: parsedAnalysis.symptom_progression || [],
      visual_changes: parsedAnalysis.visual_changes || [],
      treatment_effectiveness: parsedAnalysis.treatment_effectiveness || null,
      projected_recovery: parsedAnalysis.projected_recovery || null,
    };

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return handleError(error, 'compare-images', corsHeaders);
  }
});
