import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { requireAuthenticatedUser, getAnonClient } from '../_shared/auth.ts';
import { enforceRateLimit, RATE_LIMITS } from '../_shared/rateLimiter.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};


function toHealthPercent(score: number | null | undefined): number {
  if (score == null || Number.isNaN(Number(score))) return 0;
  const n = Number(score);
  if (n <= 1) return Math.round(n * 1000) / 10;
  return Math.min(100, Math.max(0, Math.round(n * 10) / 10));
}

serve(async (req) => {
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

    // Parse request body
    const body = await req.json();
    const {
      fieldContext,
      conversationHistory = [],
      maxQuestions = 3,
    } = body;

    // Build context prompt for AI
    let contextPrompt = 'You are Delta Intelligence, an AI assistant for Louisiana Delta farmers.\n\n';
    
    if (fieldContext?.recentAssessment) {
      const healthScore = toHealthPercent(fieldContext.healthScore);
      const cropType = fieldContext.cropType || 'crops';
      const stressLevel = fieldContext.stressLevel || 'unknown';
      
      contextPrompt += `FIELD STATUS:\n`;
      contextPrompt += `- Crop Type: ${cropType}\n`;
      contextPrompt += `- Health Score: ${healthScore.toFixed(0)}%\n`;
      contextPrompt += `- Stress Level: ${stressLevel}\n`;
      
      if (fieldContext.symptoms && fieldContext.symptoms.length > 0) {
        contextPrompt += `- Symptoms: ${fieldContext.symptoms.join(', ')}\n`;
      }
      
      if (fieldContext.diseases && fieldContext.diseases.length > 0) {
        contextPrompt += `- Diseases Detected: ${fieldContext.diseases.join(', ')}\n`;
      }
      
      if (fieldContext.pests && fieldContext.pests.length > 0) {
        contextPrompt += `- Pests Detected: ${fieldContext.pests.join(', ')}\n`;
      }
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

    // Parse AI response (might be JSON or text)
    let questions: string[] = [];
    try {
      // Try to parse as JSON first
      const parsed = JSON.parse(aiContent);
      if (Array.isArray(parsed)) {
        questions = parsed;
      } else if (typeof parsed === 'string') {
        // Sometimes AI returns a single string, try to split it
        questions = [parsed];
      }
    } catch {
      // If not JSON, try to extract questions from text
      const lines = aiContent.split('\n').filter((line: string) => line.trim());
      questions = lines
        .map((line: string) => {
          // Remove numbering, quotes, etc.
          return line
            .replace(/^\d+\.\s*/, '')
            .replace(/^[-*]\s*/, '')
            .replace(/^["']|["']$/g, '')
            .trim();
        })
        .filter((q: string) => q.length > 10 && q.length < 100)
        .slice(0, maxQuestions);
    }

    // Fallback to default questions if AI didn't generate good ones
    if (questions.length === 0 || questions.some((q: string) => q.length < 10)) {
      const healthScore = toHealthPercent(fieldContext?.healthScore);
      const cropType = fieldContext?.cropType || 'crops';
      
      if (healthScore < 70) {
        questions = [
          `What's causing the stress in my ${cropType}?`,
          'Should I treat immediately or wait?',
          'How much will treatment cost vs. potential loss?',
        ];
      } else if (healthScore < 85) {
        questions = [
          `Is my ${cropType} recovery on track?`,
          'Do I need additional monitoring?',
          'What preventive measures should I take?',
        ];
      } else {
        questions = [
          `What should I monitor in my ${cropType} this week?`,
          'Any upcoming weather concerns?',
          'Best practices for maintaining health?',
        ];
      }
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

