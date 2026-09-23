import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { requireAuthenticatedUser, getAnonClient, getServiceClient } from '../_shared/auth.ts';
import { getCorsHeaders } from '../_shared/cors.ts';
import type { VisionObservation } from '../_shared/visionObservation.ts';

const TYPE_SAFE_API_URL = 'https://api.typesafe.ai/v1/systemone';
const TYPE_SAFE_MODEL = 'jev-latest';

// Input validation schema
const jevScanPreflightSchema = z.object({
  assessmentId: z.string().uuid(),
  fieldId: z.string().uuid(),
  visionObservation: z.record(z.unknown()),
  cropType: z.enum(['soybean']),
  parish: z.string().optional(),
  growthStage: z.string().nullable().optional(),
  weather7d: z.record(z.unknown()).nullable().optional(),
  weather14d: z.record(z.unknown()).nullable().optional(),
  priorScanTags: z.array(z.string()).optional(),
  extensionPassages: z.array(z.object({
    text: z.string(),
    source: z.string(),
  })).optional(),
});

type JevScanPreflightInput = z.infer<typeof jevScanPreflightSchema>;

// Jev stamp types (code-owned decision)
export type JevStamp = 
  | 'look-here-first'
  | 'caution'
  | 'hold'
  | 'insufficient'
  | 'out-of-scope';

// TypeSafe System One response types
interface TypeSafeNoulAnswer {
  type: 'noul';
  noul: number;
  confidence: number | null;
}

interface TypeSafeChoiceAnswer {
  type: 'choice';
  choice: string;
  confidence: number | null;
  probabilities?: Record<string, number>;
}

interface TypeSafeScoreAnswer {
  type: 'score';
  score: number;
  confidence: number | null;
}

interface SystemOneAnswers {
  scope_noul: TypeSafeNoulAnswer;
  evidence_quality_score: TypeSafeScoreAnswer;
  syndrome_family_choice: TypeSafeChoiceAnswer;
  same_story_noul?: TypeSafeNoulAnswer;
}

interface JevScanResult {
  stamp: JevStamp;
  answers: SystemOneAnswers;
  reasoning: string;
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
    const supabaseAuth = getAnonClient(authHeader);

    // Validate input
    const rawBody = await req.json();
    const validation = jevScanPreflightSchema.safeParse(rawBody);
    
    if (!validation.success) {
      return new Response(
        JSON.stringify({ 
          error: "Invalid input data",
          details: validation.error.errors 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const input = validation.data;

    // Verify field ownership
    const { data: field, error: fieldError } = await supabaseAuth
      .from('fields')
      .select('user_id')
      .eq('id', input.fieldId)
      .maybeSingle();

    if (fieldError || !field) {
      return new Response(JSON.stringify({ error: 'Field not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (field.user_id !== user.id) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Check if TypeSafe API key is configured
    const typesafeApiKey = Deno.env.get('TYPESAFE_API_KEY')?.trim();
    if (!typesafeApiKey) {
      console.warn('TYPESAFE_API_KEY not configured — failing open with insufficient stamp');
      const failOpenResult: JevScanResult = {
        stamp: 'insufficient',
        answers: buildFailOpenAnswers(),
        reasoning: 'TypeSafe Jev unconfigured; fail-open insufficient stamp',
      };
      
      await persistJevResult(input.assessmentId, failOpenResult);
      
      return new Response(
        JSON.stringify(failOpenResult),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build System One request
    const systemOneRequest = buildSystemOneRequest(input);

    // Call TypeSafe System One API
    console.log('Calling TypeSafe System One for scan preflight:', input.assessmentId);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15_000);
    
    let jevResponse: Response;
    try {
      jevResponse = await fetch(TYPE_SAFE_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${typesafeApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(systemOneRequest),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }

    if (!jevResponse.ok) {
      console.error('TypeSafe System One error:', jevResponse.status);
      const failOpenResult: JevScanResult = {
        stamp: 'hold',
        answers: buildFailOpenAnswers(),
        reasoning: `TypeSafe System One returned ${jevResponse.status}; fail-open hold stamp`,
      };
      
      await persistJevResult(input.assessmentId, failOpenResult);
      
      return new Response(
        JSON.stringify(failOpenResult),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const jevData = await jevResponse.json();
    const answers = parseSystemOneResponse(jevData);

    // Map to stamps in code
    const stamp = determineStamp(answers, input);
    const reasoning = buildReasoning(stamp, answers, input);

    const result: JevScanResult = {
      stamp,
      answers,
      reasoning,
    };

    // Persist full probability vectors
    await persistJevResult(input.assessmentId, result);

    console.log('Jev scan preflight complete:', { assessmentId: input.assessmentId, stamp });

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('Error in jev-scan-preflight function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Jev scan preflight failed',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

function buildSystemOneRequest(input: JevScanPreflightInput) {
  const visionObs = input.visionObservation as VisionObservation;
  
  const state = {
    product: 'agurateai',
    stage: 'public',
    wedge: {
      parish: 'Morehouse',
      crop: 'soybean',
      validated: false,
    },
    scan: {
      assessment_id: input.assessmentId,
      field_id: input.fieldId,
      crop_type: input.cropType,
      parish: input.parish ?? null,
      growth_stage: input.growthStage ?? null,
      vision_status: visionObs.status,
      visible_findings_count: visionObs.visible_findings?.length ?? 0,
      interpretations_count: visionObs.interpretations?.length ?? 0,
      confidence: visionObs.confidence,
      has_weather_7d: Boolean(input.weather7d),
      has_weather_14d: Boolean(input.weather14d),
      prior_scan_tags: input.priorScanTags ?? [],
      extension_passages_count: input.extensionPassages?.length ?? 0,
    },
  };

  return {
    state,
    model: TYPE_SAFE_MODEL,
    questions: {
      scope_noul: {
        type: 'noul',
        instructions: 'Is this scan in the Morehouse Parish soybean evidence scope?',
        criteria: {
          true: 'Soybean scan with visible findings in Morehouse Parish soybean evidence wedge',
          false: 'Outside validated scope (wrong crop, parish, or no usable findings)',
        },
      },
      evidence_quality_score: {
        type: 'score',
        instructions: 'Rate the evidence quality for this soybean observation',
        criteria: [
          'none — no visible evidence or image quality problem',
          'weak leaf only — single leaf or fragment without canopy context',
          'canopy with context — field view with weather, growth stage, or history',
        ],
      },
      syndrome_family_choice: {
        type: 'choice',
        instructions: 'Choose the syndrome family from visible findings (closed set only)',
        criteria: {
          abiotic: 'Abiotic stress indicators (nutrient, water, environmental)',
          biotic: 'Biotic stress indicators (disease, pest patterns)',
          insufficient: 'Insufficient visible evidence to choose',
          out_of_pilot_crop: 'Not a soybean crop observation',
        },
      },
      same_story_noul: input.priorScanTags && input.priorScanTags.length > 0 ? {
        type: 'noul',
        instructions: 'Does this scan tell the same story as the prior scan tags?',
        criteria: {
          true: 'Current findings align with prior scan pattern',
          false: 'Current findings diverge from prior pattern',
        },
      } : undefined,
    },
  };
}

function parseSystemOneResponse(payload: unknown): SystemOneAnswers {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Invalid TypeSafe response payload');
  }

  const data = payload as { answers?: Record<string, unknown> };
  if (!data.answers || typeof data.answers !== 'object') {
    throw new Error('Missing TypeSafe answers');
  }

  const answers = data.answers;

  return {
    scope_noul: parseNoul(answers.scope_noul),
    evidence_quality_score: parseScore(answers.evidence_quality_score),
    syndrome_family_choice: parseChoice(answers.syndrome_family_choice),
    same_story_noul: answers.same_story_noul ? parseNoul(answers.same_story_noul) : undefined,
  };
}

function parseNoul(answer: unknown): TypeSafeNoulAnswer {
  if (!answer || typeof answer !== 'object') {
    throw new Error('Invalid noul answer');
  }
  const raw = answer as { type?: unknown; noul?: unknown; confidence?: unknown };
  if (raw.type !== 'noul') {
    throw new Error('Invalid noul answer type');
  }
  const value = clampProbability(raw.noul);
  const confidence = raw.confidence == null ? null : clampProbability(raw.confidence);
  return { type: 'noul', noul: value, confidence };
}

function parseScore(answer: unknown): TypeSafeScoreAnswer {
  if (!answer || typeof answer !== 'object') {
    throw new Error('Invalid score answer');
  }
  const raw = answer as { type?: unknown; score?: unknown; confidence?: unknown };
  if (raw.type !== 'score') {
    throw new Error('Invalid score answer type');
  }
  const score = Number(raw.score);
  if (!Number.isFinite(score)) {
    throw new Error('Invalid score value');
  }
  const confidence = raw.confidence == null ? null : clampProbability(raw.confidence);
  return { type: 'score', score, confidence };
}

function parseChoice(answer: unknown): TypeSafeChoiceAnswer {
  if (!answer || typeof answer !== 'object') {
    throw new Error('Invalid choice answer');
  }
  const raw = answer as { type?: unknown; choice?: unknown; confidence?: unknown; probabilities?: unknown };
  if (raw.type !== 'choice' || typeof raw.choice !== 'string') {
    throw new Error('Invalid choice answer type or missing choice');
  }
  const confidence = raw.confidence == null ? null : clampProbability(raw.confidence);
  const probabilities = raw.probabilities && typeof raw.probabilities === 'object'
    ? (raw.probabilities as Record<string, unknown>)
    : undefined;
  
  return { 
    type: 'choice', 
    choice: raw.choice, 
    confidence,
    probabilities: probabilities ? normalizeProbabilities(probabilities) : undefined,
  };
}

function clampProbability(value: unknown): number {
  const n = Number(value);
  if (!Number.isFinite(n)) {
    throw new Error('Invalid probability');
  }
  return Math.max(0, Math.min(1, n));
}

function normalizeProbabilities(raw: Record<string, unknown>): Record<string, number> {
  const result: Record<string, number> = {};
  for (const [key, val] of Object.entries(raw)) {
    const n = Number(val);
    if (Number.isFinite(n)) {
      result[key] = Math.max(0, Math.min(1, n));
    }
  }
  return result;
}

function determineStamp(answers: SystemOneAnswers, input: JevScanPreflightInput): JevStamp {
  // Out of scope check (fail-closed for non-Morehouse or non-soybean)
  if (answers.scope_noul.noul < 0.5 && (answers.scope_noul.confidence ?? 0) >= 0.6) {
    return 'out-of-scope';
  }

  // Syndrome family out-of-scope check
  if (answers.syndrome_family_choice.choice === 'out_of_pilot_crop') {
    return 'out-of-scope';
  }

  // Insufficient evidence check
  if (answers.syndrome_family_choice.choice === 'insufficient') {
    return 'insufficient';
  }

  // Evidence quality check (score 0 = none, 1 = weak, 2 = canopy)
  const evidenceScore = answers.evidence_quality_score.score;
  if (evidenceScore < 0.5 && (answers.evidence_quality_score.confidence ?? 0) >= 0.6) {
    return 'insufficient';
  }

  // Vision observation already flagged as insufficient
  const visionObs = input.visionObservation as VisionObservation;
  if (visionObs.status === 'insufficient_evidence') {
    return 'insufficient';
  }

  // Hold for conflicting evidence (supports AND contradicts both high)
  // This is where citation Choices would be checked if passages were provided
  // For now, check if syndrome findings are ambiguous
  const syndromeProbs = answers.syndrome_family_choice.probabilities;
  if (syndromeProbs) {
    const abioticProb = syndromeProbs.abiotic ?? 0;
    const bioticProb = syndromeProbs.biotic ?? 0;
    // If both abiotic and biotic have high probability, flag for desk review
    if (abioticProb >= 0.35 && bioticProb >= 0.35) {
      return 'hold';
    }
  }

  // Divergent story from prior scans
  if (answers.same_story_noul && answers.same_story_noul.noul < 0.4 && (answers.same_story_noul.confidence ?? 0) >= 0.6) {
    return 'caution';
  }

  // Look-here-first: good evidence, in scope, clear syndrome
  if (evidenceScore >= 1.5 && answers.scope_noul.noul >= 0.7) {
    return 'look-here-first';
  }

  // Default to caution for remaining cases
  return 'caution';
}

function buildReasoning(stamp: JevStamp, answers: SystemOneAnswers, input: JevScanPreflightInput): string {
  const parts: string[] = [];
  
  parts.push(`Stamp: ${stamp}`);
  parts.push(`Scope: ${(answers.scope_noul.noul * 100).toFixed(0)}% (confidence: ${((answers.scope_noul.confidence ?? 0) * 100).toFixed(0)}%)`);
  parts.push(`Evidence quality: ${answers.evidence_quality_score.score.toFixed(1)}/2`);
  parts.push(`Syndrome family: ${answers.syndrome_family_choice.choice}`);
  
  if (answers.same_story_noul) {
    parts.push(`Same story vs prior: ${(answers.same_story_noul.noul * 100).toFixed(0)}%`);
  }

  const visionObs = input.visionObservation as VisionObservation;
  parts.push(`Vision status: ${visionObs.status}`);
  
  return parts.join(' | ');
}

function buildFailOpenAnswers(): SystemOneAnswers {
  return {
    scope_noul: { type: 'noul', noul: 0.5, confidence: 0 },
    evidence_quality_score: { type: 'score', score: 0, confidence: 0 },
    syndrome_family_choice: { type: 'choice', choice: 'insufficient', confidence: 0 },
  };
}

async function persistJevResult(assessmentId: string, result: JevScanResult): Promise<void> {
  const admin = getServiceClient();
  
  const { error } = await admin
    .from('jev_scan_results')
    .insert({
      assessment_id: assessmentId,
      stamp: result.stamp,
      answers: result.answers,
      reasoning: result.reasoning,
    });

  if (error) {
    console.error('Failed to persist Jev scan result:', error);
    throw new Error('Failed to persist Jev scan result');
  }
}
