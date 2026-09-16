import { fetchAI, getAIKey } from '../_shared/ai.ts';
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { requireAuthenticatedUser, getAnonClient } from "../_shared/auth.ts";
import { getCorsHeaders } from '../_shared/cors.ts';
import { enforceRateLimit, RATE_LIMITS } from '../_shared/rateLimiter.ts';

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const auth = await requireAuthenticatedUser(req, corsHeaders);
    if (auth instanceof Response) {
      return auth;
    }
    const { user, authHeader } = auth;
    const rateLimitClient = getAnonClient(authHeader);

    const rateLimit = await enforceRateLimit(rateLimitClient, user.id, {
      functionName: 'ar-analyze',
      maxRequests: RATE_LIMITS['ar-analyze'].maxRequests,
      windowMs: RATE_LIMITS['ar-analyze'].windowMs,
    }, req);
    if (!rateLimit.allowed) {
      return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again shortly.' }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { imageData } = await req.json();
    const AI_API_KEY = getAIKey();

    if (!AI_API_KEY) {
      throw new Error('AI_API_KEY not configured');
    }

    // Quick AR analysis for real-time overlay — fail closed on invent/uncertain scores.
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
            content:
              'You are a crop health AR analyzer. Return brief visual assessment JSON only. Never invent scores for unclear or non-crop images: set image_usable=false, health_score=null, stress_level=null, confidence_score<=0.2, and put an honest uncertainty phrase in visual_cues. Only set scores when a crop is clearly visible.',
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Analyze this crop image and return JSON with: image_usable (boolean), health_score (finite 0-1 or null if not usable), stress_level ("healthy"|"moderate_stress"|"severe_stress"|null if not usable), visual_cues (non-empty, under 60 chars), confidence_score (finite 0-1). Never invent disease names or dollar impacts.',
              },
              {
                type: 'image_url',
                image_url: { url: imageData },
              },
            ],
          },
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'ar_overlay_data',
              description: 'Return AR overlay data for crop health',
              parameters: {
                type: 'object',
                properties: {
                  image_usable: { type: 'boolean' },
                  health_score: { type: ['number', 'null'], minimum: 0, maximum: 1 },
                  stress_level: {
                    type: ['string', 'null'],
                    enum: ['healthy', 'moderate_stress', 'severe_stress', null],
                  },
                  visual_cues: { type: 'string', minLength: 1, maxLength: 60 },
                  confidence_score: { type: 'number', minimum: 0, maximum: 1 },
                },
                required: ['image_usable', 'health_score', 'stress_level', 'visual_cues', 'confidence_score'],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: 'function', function: { name: 'ar_overlay_data' } },
      }),
    });

    if (!response.ok) {
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const aiData = await response.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall) {
      throw new Error('No tool call in AI response');
    }

    const result = JSON.parse(toolCall.function.arguments);
    const imageUsable = result.image_usable === true;
    const visualCues = typeof result.visual_cues === 'string' ? result.visual_cues.trim() : '';
    if (!visualCues) {
      throw new Error('AR analysis omitted visual_cues — refusing empty invent overlay');
    }
    const confidence = Number(result.confidence_score);
    if (!Number.isFinite(confidence) || confidence < 0 || confidence > 1) {
      throw new Error('AR analysis omitted or invented confidence_score (require finite 0–1)');
    }

    if (!imageUsable) {
      if (confidence > 0.2) {
        throw new Error('AR analysis claimed high confidence on unusable image — refusing invent overlay');
      }
      return new Response(
        JSON.stringify({
          image_usable: false,
          health_score: null,
          stress_level: null,
          visual_cues: visualCues.slice(0, 60),
          confidence_score: confidence,
          error: 'Image unclear or not a crop — no health score invented',
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      );
    }

    const healthScore = Number(result.health_score);
    if (!Number.isFinite(healthScore) || healthScore < 0 || healthScore > 1) {
      throw new Error('AR analysis omitted or out-of-range health_score (require finite 0–1)');
    }
    const allowedStress = new Set(['healthy', 'moderate_stress', 'severe_stress']);
    if (!allowedStress.has(String(result.stress_level))) {
      throw new Error('AR analysis omitted or invented stress_level');
    }

    return new Response(
      JSON.stringify({
        image_usable: true,
        health_score: healthScore,
        stress_level: result.stress_level,
        visual_cues: visualCues.slice(0, 60),
        confidence_score: confidence,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );

  } catch (error) {
    console.error('AR analysis error:', error);
    // Fail closed — never invent health/stress scores on error
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'AR analysis failed',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
