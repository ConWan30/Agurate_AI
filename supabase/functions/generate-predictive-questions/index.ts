import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { requireAuthenticatedUser, getAnonClient } from '../_shared/auth.ts';
import { getCorsHeaders } from '../_shared/cors.ts';
import { enforceRateLimit, RATE_LIMITS } from '../_shared/rateLimiter.ts';

function toHealthPercent(score: number | null | undefined): number {
  if (score == null || Number.isNaN(Number(score))) return 0;
  const n = Number(score);
  if (n <= 1) return Math.round(n * 1000) / 10;
  return Math.min(100, Math.max(0, Math.round(n * 10) / 10));
}

function hasHealthScore(score: unknown): score is number {
  return score != null && !Number.isNaN(Number(score));
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const auth = await requireAuthenticatedUser(req, corsHeaders);
    if (auth instanceof Response) return auth;
    const { user, authHeader } = auth;
    const rateLimitClient = getAnonClient(authHeader);

    const rateLimit = await enforceRateLimit(rateLimitClient, user.id, {
      functionName: 'generate-predictive-questions',
      maxRequests: RATE_LIMITS['generate-predictive-questions'].maxRequests,
      windowMs: RATE_LIMITS['generate-predictive-questions'].windowMs,
    }, req);
    if (!rateLimit.allowed) {
      return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again shortly.' }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Parse request body — IDs only; hydrate owned field/assessment server-side.
    const body = await req.json();
    const {
      fieldId,
      assessmentId,
      conversationHistory = [],
      maxQuestions = 3,
    } = body;

    if (!fieldId || !assessmentId) {
      return new Response(
        JSON.stringify({ error: 'fieldId and assessmentId are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const { data: field, error: fieldError } = await rateLimitClient
      .from('fields')
      .select('id, crop_type, user_id')
      .eq('id', fieldId)
      .eq('user_id', user.id)
      .maybeSingle();
    if (fieldError) throw fieldError;
    if (!field) {
      return new Response(
        JSON.stringify({ error: 'Field not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const { data: assessment, error: assessmentError } = await rateLimitClient
      .from('assessments')
      .select('id, field_id, health_score, stress_level, symptoms, disease_identified, pest_identified')
      .eq('id', assessmentId)
      .eq('field_id', fieldId)
      .maybeSingle();
    if (assessmentError) throw assessmentError;
    if (!assessment) {
      return new Response(
        JSON.stringify({ error: 'Assessment not found for field' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Build context prompt for AI from persisted rows only
    let contextPrompt = 'You are Delta Intelligence, an AI assistant for Louisiana Delta farmers.\n\n';

    const cropType = field.crop_type || 'crops';
    contextPrompt += `FIELD STATUS:\n`;
    contextPrompt += `- Crop Type: ${cropType}\n`;
    if (hasHealthScore(assessment.health_score)) {
      const healthScore = toHealthPercent(assessment.health_score);
      contextPrompt += `- Health Score: ${healthScore.toFixed(0)}%\n`;
      if (assessment.stress_level) {
        contextPrompt += `- Stress Level: ${assessment.stress_level}\n`;
      }
    } else {
      contextPrompt += `- Health Score: not available — do not invent health, stress, or urgency\n`;
    }

    const symptoms = Array.isArray(assessment.symptoms) ? assessment.symptoms : [];
    const diseases = Array.isArray(assessment.disease_identified) ? assessment.disease_identified : [];
    const pests = Array.isArray(assessment.pest_identified) ? assessment.pest_identified : [];
    if (symptoms.length > 0) {
      contextPrompt += `- Symptoms: ${symptoms.join(', ')}\n`;
    }
    if (diseases.length > 0) {
      contextPrompt += `- Diseases Detected: ${diseases.join(', ')}\n`;
    }
    if (pests.length > 0) {
      contextPrompt += `- Pests Detected: ${pests.join(', ')}\n`;
    }

    if (conversationHistory.length > 0) {
      contextPrompt += `\nRECENT CONVERSATION:\n`;
      conversationHistory.slice(-5).forEach((msg: { role: string; content: string }) => {
        contextPrompt += `${msg.role}: ${msg.content.substring(0, 200)}\n`;
      });
    }

    contextPrompt += `\nTASK: Generate ${maxQuestions} highly relevant, actionable questions that a farmer would likely want to ask based on this field status and context.`;
    contextPrompt += `\n\nREQUIREMENTS:`;
    contextPrompt += `\n- Questions should be specific to Louisiana Delta agriculture`;
    contextPrompt += `\n- Questions should be actionable (not just informational)`;
    contextPrompt += `\n- Questions should address immediate concerns or next steps`;
    contextPrompt += `\n- Use natural, conversational language`;
    contextPrompt += `\n- Each question should be concise (max 15 words)`;
    contextPrompt += `\n- Prioritize urgent issues if health score is low`;
    contextPrompt += `\n\nReturn ONLY a JSON array of question strings, no other text. Example: ["Should I apply fungicide now?", "What's causing the yellowing in my rice?", "How much will treatment cost?"]`;

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
        max_tokens: 200,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI Gateway error:', errorText);
      throw new Error(`AI Gateway error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const aiContent = aiData.choices?.[0]?.message?.content || '[]';

    // Parse AI response — fail closed on unparseable invent
    let questions: string[] = [];
    try {
      const parsed = JSON.parse(aiContent);
      if (Array.isArray(parsed)) {
        questions = parsed
          .filter((q: unknown): q is string => typeof q === 'string')
          .map((q: string) => q.trim())
          .filter((q: string) => q.length > 10 && q.length < 100)
          .slice(0, maxQuestions);
      }
    } catch {
      throw new Error('Predictive questions AI returned unparseable JSON — refusing to invent questions');
    }

    // Generic fallbacks only — never invent stress narratives from health bands
    if (questions.length === 0) {
      questions = [
        `What should I check in my ${cropType} this week?`,
        'Any weather concerns I should plan around?',
        'When should I take my next field assessment?',
      ].slice(0, maxQuestions);
    }

    return new Response(
      JSON.stringify({ questions: questions.slice(0, maxQuestions) }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error generating predictive questions:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

