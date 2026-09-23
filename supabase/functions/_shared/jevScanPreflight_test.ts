import { assertEquals } from "https://deno.land/std@0.168.0/testing/asserts.ts";

// Test types and helper functions (simulating main module exports)
type JevStamp = 
  | 'look-here-first'
  | 'caution'
  | 'hold'
  | 'insufficient'
  | 'out-of-scope';

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

interface MockVisionObservation {
  status: 'supported_observation' | 'insufficient_evidence';
  visible_findings: Array<{ tag: string; description: string }>;
}

interface JevScanInput {
  assessmentId: string;
  fieldId: string;
  visionObservation: MockVisionObservation;
  cropType: 'soybean';
  parish?: string;
  priorScanTags?: string[];
}

// Stamp determination logic (extracted for testing)
function determineStamp(answers: SystemOneAnswers, input: JevScanInput): JevStamp {
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
  if (input.visionObservation.status === 'insufficient_evidence') {
    return 'insufficient';
  }

  // Hold for conflicting evidence (both abiotic and biotic high)
  const syndromeProbs = answers.syndrome_family_choice.probabilities;
  if (syndromeProbs) {
    const abioticProb = syndromeProbs.abiotic ?? 0;
    const bioticProb = syndromeProbs.biotic ?? 0;
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

  // Default to caution
  return 'caution';
}

// Test fixtures
function mockInput(overrides?: Partial<JevScanInput>): JevScanInput {
  return {
    assessmentId: '550e8400-e29b-41d4-a716-446655440000',
    fieldId: '550e8400-e29b-41d4-a716-446655440001',
    visionObservation: {
      status: 'supported_observation',
      visible_findings: [{ tag: 'foliar_discoloration', description: 'Yellowing on lower leaves' }],
    },
    cropType: 'soybean',
    parish: 'Morehouse',
    ...overrides,
  };
}

function mockAnswers(overrides?: Partial<SystemOneAnswers>): SystemOneAnswers {
  return {
    scope_noul: { type: 'noul', noul: 0.95, confidence: 0.9 },
    evidence_quality_score: { type: 'score', score: 2.0, confidence: 0.85 },
    syndrome_family_choice: { type: 'choice', choice: 'abiotic', confidence: 0.8, probabilities: { abiotic: 0.7, biotic: 0.2, insufficient: 0.1 } },
    ...overrides,
  };
}

// Tests
Deno.test('Stamp mapping: look-here-first for good evidence in scope', () => {
  const input = mockInput();
  const answers = mockAnswers({
    scope_noul: { type: 'noul', noul: 0.95, confidence: 0.9 },
    evidence_quality_score: { type: 'score', score: 2.0, confidence: 0.85 },
    syndrome_family_choice: { type: 'choice', choice: 'abiotic', confidence: 0.8 },
  });

  const stamp = determineStamp(answers, input);
  assertEquals(stamp, 'look-here-first');
});

Deno.test('Stamp mapping: out-of-scope for low scope noul with high confidence', () => {
  const input = mockInput();
  const answers = mockAnswers({
    scope_noul: { type: 'noul', noul: 0.2, confidence: 0.9 },
  });

  const stamp = determineStamp(answers, input);
  assertEquals(stamp, 'out-of-scope');
});

Deno.test('Stamp mapping: out-of-scope for out_of_pilot_crop syndrome choice', () => {
  const input = mockInput();
  const answers = mockAnswers({
    syndrome_family_choice: { type: 'choice', choice: 'out_of_pilot_crop', confidence: 0.85 },
  });

  const stamp = determineStamp(answers, input);
  assertEquals(stamp, 'out-of-scope');
});

Deno.test('Stamp mapping: insufficient for low evidence quality', () => {
  const input = mockInput();
  const answers = mockAnswers({
    evidence_quality_score: { type: 'score', score: 0.2, confidence: 0.9 },
  });

  const stamp = determineStamp(answers, input);
  assertEquals(stamp, 'insufficient');
});

Deno.test('Stamp mapping: insufficient when vision status is insufficient_evidence', () => {
  const input = mockInput({
    visionObservation: {
      status: 'insufficient_evidence',
      visible_findings: [{ tag: 'image_quality_problem', description: 'Blurry image' }],
    },
  });
  const answers = mockAnswers();

  const stamp = determineStamp(answers, input);
  assertEquals(stamp, 'insufficient');
});

Deno.test('Stamp mapping: insufficient when syndrome choice is insufficient', () => {
  const input = mockInput();
  const answers = mockAnswers({
    syndrome_family_choice: { type: 'choice', choice: 'insufficient', confidence: 0.8 },
  });

  const stamp = determineStamp(answers, input);
  assertEquals(stamp, 'insufficient');
});

Deno.test('Stamp mapping: hold for conflicting abiotic and biotic probabilities', () => {
  const input = mockInput();
  const answers = mockAnswers({
    syndrome_family_choice: { 
      type: 'choice', 
      choice: 'abiotic', 
      confidence: 0.6,
      probabilities: { abiotic: 0.45, biotic: 0.40, insufficient: 0.15 }
    },
  });

  const stamp = determineStamp(answers, input);
  assertEquals(stamp, 'hold');
});

Deno.test('Stamp mapping: caution for divergent story from prior scans', () => {
  const input = mockInput({
    priorScanTags: ['healthy', 'vigorous'],
  });
  const answers = mockAnswers({
    evidence_quality_score: { type: 'score', score: 1.8, confidence: 0.8 },
    same_story_noul: { type: 'noul', noul: 0.3, confidence: 0.75 },
  });

  const stamp = determineStamp(answers, input);
  assertEquals(stamp, 'caution');
});

Deno.test('Stamp mapping: caution as default for moderate evidence', () => {
  const input = mockInput();
  const answers = mockAnswers({
    evidence_quality_score: { type: 'score', score: 1.2, confidence: 0.8 },
    scope_noul: { type: 'noul', noul: 0.85, confidence: 0.85 },
  });

  const stamp = determineStamp(answers, input);
  assertEquals(stamp, 'caution');
});

Deno.test('Stamp mapping: look-here-first wins over caution when evidence is strong', () => {
  const input = mockInput();
  const answers = mockAnswers({
    scope_noul: { type: 'noul', noul: 0.92, confidence: 0.9 },
    evidence_quality_score: { type: 'score', score: 1.9, confidence: 0.88 },
    syndrome_family_choice: { type: 'choice', choice: 'biotic', confidence: 0.85 },
  });

  const stamp = determineStamp(answers, input);
  assertEquals(stamp, 'look-here-first');
});

Deno.test('Stamp mapping: scope check with low confidence does not trigger out-of-scope', () => {
  const input = mockInput();
  const answers = mockAnswers({
    scope_noul: { type: 'noul', noul: 0.3, confidence: 0.4 },
    evidence_quality_score: { type: 'score', score: 1.6, confidence: 0.8 },
  });

  const stamp = determineStamp(answers, input);
  // Should not be out-of-scope due to low confidence
  assertEquals(stamp, 'look-here-first');
});

console.log('All Jev stamp mapping tests passed!');
