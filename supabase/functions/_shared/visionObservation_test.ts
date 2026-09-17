import {
  buildVisionObservation,
  getConfiguredSpecialistDetector,
  getServerVisionProvider,
  VISION_ONTOLOGY,
} from './visionObservation.ts';

function assert(value: unknown, message = 'Assertion failed'): asserts value {
  if (!value) throw new Error(message);
}

Deno.test('vision observation separates visible findings from interpretations with provenance', () => {
  const observation = buildVisionObservation({
    imageReference: 'user-1/soybean.jpg',
    cropType: 'soybean',
    fieldId: 'field-1',
    location: 'Morehouse Parish, Louisiana',
    weatherAvailable: true,
    modelConfig: { provider: 'test-provider', model: 'vision-test', modelVersion: '2026-09-17' },
    imageAnalysis: {
      confidence_score: 0.82,
      visual_cues: 'Several leaves show small circular brown spots with yellowing around portions of the canopy.',
      visible_findings: [
        {
          tag: 'lesions_spots',
          description: 'Small circular spots visible on soybean leaves',
          confidence: 0.78,
          evidence: ['spots are visible on multiple leaf surfaces'],
        },
      ],
      disease_identified: ['possible frogeye leaf spot'],
      pest_identified: [],
      growth_stage: 'R3',
    },
  });

  assert(observation.schema_version === 'agurateai.vision_observation.v1');
  assert(observation.status === 'supported_observation');
  assert(observation.visible_findings[0].tag === 'lesions_spots');
  assert(observation.interpretations[0].label === 'possible frogeye leaf spot');
  assert(observation.interpretations[0].caveat.includes('Interpretation only'));
  assert(observation.provenance.provider === 'test-provider');
  assert(observation.scope.parish === 'Morehouse');
  assert(observation.scope.crop === 'soybean');
  assert(observation.scope.validated === false);
});

Deno.test('vision observation fails closed on low confidence and suppresses interpretations', () => {
  const observation = buildVisionObservation({
    imageReference: 'user-1/unclear.jpg',
    cropType: 'soybean',
    weatherAvailable: false,
    modelConfig: { provider: 'test-provider', model: 'vision-test' },
    imageAnalysis: {
      confidence_score: 0.31,
      visual_cues: 'Image is blurred and too distant to inspect leaves.',
      symptoms: ['blurred canopy image'],
      disease_identified: ['invented disease should not pass'],
      pest_identified: ['invented pest should not pass'],
    },
  });

  assert(observation.status === 'insufficient_evidence');
  assert(observation.fail_closed_reason !== null);
  assert(observation.interpretations.length === 0);
  assert(observation.supporting_evidence.some((item) => item.includes('blurred')));
});

Deno.test('ontology contains the initial soybean vision categories', () => {
  for (const tag of [
    'healthy_uncertain_tissue',
    'foliar_discoloration',
    'lesions_spots',
    'defoliation',
    'insect_feeding_damage',
    'lodging_stem_abnormalities',
    'canopy_stress',
    'image_quality_problem',
  ]) {
    assert((VISION_ONTOLOGY as readonly string[]).includes(tag));
  }
});

Deno.test('specialist detector is an explicit future interface, not an implied trained model', () => {
  assert(getConfiguredSpecialistDetector(() => undefined) === null);
});

Deno.test('provider identity is resolved server-side without exposing a key', () => {
  assert(getServerVisionProvider(() => undefined, 'https://provider.example/v1/chat/completions') === 'provider.example');
  assert(getServerVisionProvider((name) => name === 'AI_PROVIDER' ? 'configured-provider' : undefined, 'https://provider.example/v1') === 'configured-provider');
});
