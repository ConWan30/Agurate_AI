import { fetchAI, getAIKey } from '../_shared/ai.ts';
import { serve } from 'https://deno.land/std@0.178.0/http/server.ts';
import { requireAuthenticatedUser, getAnonClient } from '../_shared/auth.ts';
import { getCorsHeaders } from '../_shared/cors.ts';
import { enforceRateLimit, RATE_LIMITS } from '../_shared/rateLimiter.ts';
import { corsHeaders, handleError } from '../_shared/errorHandler.ts';

const AI_API_KEY = getAIKey();

interface AnnotationRequest {
  assessment_id: string;
  /** @deprecated Ignored — image is loaded from the owned assessment.image_url. */
  image_url?: string;
  /** @deprecated Ignored — context is loaded from the owned assessment. */
  analysis_context?: unknown;
}

interface Annotation {
  type: 'circle' | 'arrow' | 'rectangle' | 'text';
  x: number;
  y: number;
  radius?: number;
  width?: number;
  height?: number;
  label: string;
  color?: string;
  severity?: 'critical' | 'warning' | 'info' | 'success';
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
    const rateLimitClient = getAnonClient(authHeader);

    const rateLimit = await enforceRateLimit(rateLimitClient, user.id, {
      functionName: 'generate-image-annotations',
      maxRequests: RATE_LIMITS['generate-image-annotations'].maxRequests,
      windowMs: RATE_LIMITS['generate-image-annotations'].windowMs,
    }, req);
    if (!rateLimit.allowed) {
      return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again shortly.' }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { assessment_id }: AnnotationRequest = await req.json();

    if (!assessment_id) {
      return new Response(
        JSON.stringify({ error: 'assessment_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Bind image from owned assessment — never trust client image_url invent.
    const { data: assessment, error: assessmentError } = await rateLimitClient
      .from('assessments')
      .select('id, field_id, image_url, health_score, stress_level, symptoms, disease_identified, pest_identified')
      .eq('id', assessment_id)
      .maybeSingle();

    if (assessmentError) throw assessmentError;
    if (!assessment) {
      return new Response(
        JSON.stringify({ error: 'Assessment not found for authenticated user' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: ownedField, error: fieldError } = await rateLimitClient
      .from('fields')
      .select('id')
      .eq('id', assessment.field_id)
      .eq('user_id', user.id)
      .maybeSingle();
    if (fieldError) throw fieldError;
    if (!ownedField) {
      return new Response(
        JSON.stringify({ error: 'Assessment not found for authenticated user' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const imageUrl =
      typeof assessment.image_url === 'string' && assessment.image_url.trim()
        ? assessment.image_url.trim()
        : null;
    if (!imageUrl) {
      return new Response(
        JSON.stringify({ error: 'Assessment has no recorded image_url to annotate' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const healthScore =
      assessment.health_score != null && Number.isFinite(Number(assessment.health_score))
        ? Number(assessment.health_score)
        : null;
    const symptoms = Array.isArray(assessment.symptoms) ? assessment.symptoms : [];
    const diseases = Array.isArray(assessment.disease_identified) ? assessment.disease_identified : [];
    const pests = Array.isArray(assessment.pest_identified) ? assessment.pest_identified : [];
    const allowHealthyMarkers =
      healthScore != null &&
      (healthScore > 1 ? healthScore >= 75 : healthScore >= 0.75);

    // Use Gemini Vision to analyze image and generate annotation coordinates
    const annotationPrompt = `You are analyzing a crop health image. Mark only visually supportable findings with annotation coordinates.

CONTEXT (from persisted assessment only — do not invent missing findings):
- Health Score: ${healthScore != null ? `${healthScore}%` : 'not recorded'}
- Stress Level: ${assessment.stress_level ?? 'not recorded'}
- Symptoms: ${symptoms.length ? symptoms.join(', ') : 'not recorded'}
- Diseases: ${diseases.length ? diseases.join(', ') : 'not recorded'}
- Pests: ${pests.length ? pests.join(', ') : 'not recorded'}

HONESTY:
- If nothing is visually supportable, return an empty JSON array [].
- Do NOT invent disease names, pest names, or "Healthy area" markers without visual evidence.
- severity "success" (healthy reference) is ${allowHealthyMarkers ? 'allowed only for clearly healthy tissue' : 'NOT allowed for this assessment — health is not recorded as high'}.
- Prefer empty [] over speculative labels.

Each annotation object:
- type: "circle" | "arrow" | "rectangle" | "text"
- x, y: 0–100 percentages
- radius / width / height: optional percentages
- label: short descriptive text grounded in the image
- severity: "critical" | "warning" | "info"${allowHealthyMarkers ? ' | "success"' : ''}

Return ONLY a JSON array (no markdown). Schema example (do not copy these labels):
[{"type":"circle","x":0,"y":0,"radius":1,"label":"string","severity":"warning"}]`;

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
            role: 'user',
            content: [
              {
                type: 'text',
                text: annotationPrompt,
              },
              {
                type: 'image_url',
                image_url: { url: imageUrl },
              },
            ],
          },
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      throw new Error('AI annotation generation failed');
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    // Parse JSON from AI response
    let annotations: Annotation[] = [];
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = aiResponse.match(/```json\n([\s\S]*?)\n```/) || aiResponse.match(/```\n([\s\S]*?)\n```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : aiResponse;
      annotations = JSON.parse(jsonStr);
    } catch {
      try {
        annotations = JSON.parse(aiResponse);
      } catch {
        throw new Error('Image annotation AI returned unparseable JSON — refusing to invent annotations');
      }
    }

    // Validate and clean annotations — strip invent healthy/success when health is not high.
    const allowedSeverities = allowHealthyMarkers
      ? new Set(['critical', 'warning', 'info', 'success'])
      : new Set(['critical', 'warning', 'info']);
    const validAnnotations = annotations
      .filter((ann: any) => ann.type && ann.x !== undefined && ann.y !== undefined && ann.label)
      .map((ann: any) => {
        const rawSeverity =
          typeof ann.severity === 'string' && allowedSeverities.has(ann.severity)
            ? (ann.severity as Annotation['severity'])
            : undefined;
        // Drop success-labeled "healthy" invent when not allowed.
        if (!allowHealthyMarkers && /healthy/i.test(String(ann.label ?? ''))) {
          return null;
        }
        return {
          type: ann.type as Annotation['type'],
          x: Math.max(0, Math.min(100, Number(ann.x))),
          y: Math.max(0, Math.min(100, Number(ann.y))),
          radius: ann.radius ? Math.max(1, Math.min(20, Number(ann.radius))) : undefined,
          width: ann.width ? Math.max(1, Math.min(50, Number(ann.width))) : undefined,
          height: ann.height ? Math.max(1, Math.min(50, Number(ann.height))) : undefined,
          label: String(ann.label).slice(0, 120),
          color: ann.color,
          ...(rawSeverity ? { severity: rawSeverity } : {}),
        };
      })
      .filter((ann): ann is NonNullable<typeof ann> => ann != null);

    return new Response(
      JSON.stringify({ annotations: validAnnotations }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    return handleError(error, 'generate-image-annotations', corsHeaders);
  }
});

