import { serve } from 'https://deno.land/std@0.178.0/http/server.ts';
import { requireAuthenticatedUser, getAnonClient } from '../_shared/auth.ts';
import { getCorsHeaders } from '../_shared/cors.ts';
import { enforceRateLimit, RATE_LIMITS } from '../_shared/rateLimiter.ts';
import { corsHeaders, handleError } from '../_shared/errorHandler.ts';

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

interface AnnotationRequest {
  image_url: string;
  analysis_context?: {
    health_score?: number;
    stress_level?: string;
    symptoms?: string[];
    diseases?: string[];
    pests?: string[];
  };
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

    const { image_url, analysis_context }: AnnotationRequest = await req.json();

    if (!image_url) {
      return new Response(
        JSON.stringify({ error: 'Image URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use Gemini Vision to analyze image and generate annotation coordinates
    const annotationPrompt = `You are analyzing a crop health image. Identify specific areas that need attention and provide annotation coordinates.

${analysis_context ? `
CONTEXT:
- Health Score: ${analysis_context.health_score || 'Unknown'}%
- Stress Level: ${analysis_context.stress_level || 'Unknown'}
- Symptoms: ${(analysis_context.symptoms || []).join(', ') || 'None'}
- Diseases: ${(analysis_context.diseases || []).join(', ') || 'None'}
- Pests: ${(analysis_context.pests || []).join(', ') || 'None'}
` : ''}

Analyze this image and return a JSON array of annotations. Each annotation should have:
- type: "circle", "arrow", "rectangle", or "text"
- x: percentage (0-100) from left
- y: percentage (0-100) from top
- radius: percentage for circles (optional)
- width/height: percentage for rectangles (optional)
- label: descriptive text
- severity: "critical", "warning", "info", or "success"

Focus on:
1. Disease/pest locations (use circles, mark as critical or warning)
2. Healthy reference areas (use circles, mark as success)
3. Areas needing attention (use arrows or rectangles)
4. Key findings (use text annotations)

Return ONLY valid JSON array, no markdown, no code blocks. Example format:
[
  {"type": "circle", "x": 25, "y": 30, "radius": 5, "label": "Rice blast lesion", "severity": "critical"},
  {"type": "circle", "x": 75, "y": 50, "radius": 4, "label": "Healthy area", "severity": "success"}
]`;

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
                text: annotationPrompt,
              },
              {
                type: 'image_url',
                image_url: { url: image_url },
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

    // Validate and clean annotations
    const validAnnotations = annotations
      .filter((ann: any) => ann.type && ann.x !== undefined && ann.y !== undefined && ann.label)
      .map((ann: any) => ({
        type: ann.type as Annotation['type'],
        x: Math.max(0, Math.min(100, ann.x)),
        y: Math.max(0, Math.min(100, ann.y)),
        radius: ann.radius ? Math.max(1, Math.min(20, ann.radius)) : undefined,
        width: ann.width ? Math.max(1, Math.min(50, ann.width)) : undefined,
        height: ann.height ? Math.max(1, Math.min(50, ann.height)) : undefined,
        label: ann.label,
        color: ann.color,
        ...(typeof ann.severity === 'string' &&
        ['critical', 'warning', 'info', 'success'].includes(ann.severity)
          ? { severity: ann.severity as Annotation['severity'] }
          : {}),
      }));

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

