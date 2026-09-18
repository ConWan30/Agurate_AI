import {
  buildImageGateState,
  localFallbackGate,
  runImageGate,
  type ImageGateState,
} from './typesafeImageGate.ts';

function assert(value: unknown, message = 'Assertion failed'): asserts value {
  if (!value) throw new Error(message);
}

const baseState = (overrides: Partial<ImageGateState['request']> = {}) =>
  buildImageGateState({
    cropType: overrides.crop_type ?? 'soybean',
    parishHint: overrides.parish_hint ?? 'Morehouse Parish, Louisiana',
    fieldId: overrides.field_id ?? null,
    mediaType: overrides.media_type ?? 'image',
    imageUrl: overrides.has_image_url === false ? null : 'https://example.com/soybean.jpg',
    clientQualityHints: {
      declaredBlurry: overrides.client_quality_hints?.declared_blurry ?? false,
      declaredTooFar: overrides.client_quality_hints?.declared_too_far ?? false,
      bytesHint: overrides.client_quality_hints?.bytes_hint ?? null,
    },
  });

Deno.test('missing TypeSafe key uses local fallback without network', async () => {
  let called = false;
  const decision = await runImageGate(
    baseState(),
    () => undefined,
    async () => {
      called = true;
      return new Response('{}');
    },
  );

  assert(!called, 'Missing TYPESAFE_API_KEY must not call the network');
  assert(decision.source === 'local_fallback');
  assert(decision.scope_route === 'analyze_in_wedge');
});

Deno.test('local fallback defers non-soybean requests', () => {
  const decision = localFallbackGate(baseState({ crop_type: 'corn' }));

  assert(decision.scope_route === 'defer_out_of_wedge');
  assert(decision.scope_route_confidence === 1);
  assert(decision.overclaim_risk >= 1);
});

Deno.test('local fallback asks for retake when quality hints say blurry', () => {
  const decision = localFallbackGate(baseState({
    client_quality_hints: {
      declared_blurry: true,
      declared_too_far: false,
      bytes_hint: null,
    },
  }));

  assert(decision.scope_route === 'retake_image');
  assert(decision.image_usable === false);
  assert(decision.overclaim_risk === 2);
});

Deno.test('local fallback allows clean soybean request to continue analysis path', () => {
  const decision = localFallbackGate(baseState());

  assert(decision.scope_route === 'analyze_in_wedge');
  assert(decision.image_usable === true);
  assert(decision.overclaim_risk === 0);
});

Deno.test('TypeSafe response parser consumes typed answers only', async () => {
  const decision = await runImageGate(
    baseState(),
    (name) => name === 'TYPESAFE_API_KEY' ? 'test-key' : undefined,
    async (_url, init) => {
      const body = JSON.parse(String(init?.body));
      assert(body.model === 'jev-latest');
      assert(body.questions.image_usable.type === 'noul');
      assert(body.questions.scope_route.type === 'choice');
      assert(body.questions.overclaim_risk.type === 'score');
      return new Response(JSON.stringify({
        answers: {
          image_usable: { type: 'noul', noul: 0.93, free_text: 'ignore me' },
          scope_route: {
            type: 'choice',
            choice: 'analyze_in_wedge',
            probabilities: { analyze_in_wedge: 0.91, defer_out_of_wedge: 0.03, retake_image: 0.03, unknown_hold: 0.03 },
            confidence: 0.88,
            explanation: 'ignore me',
          },
          overclaim_risk: {
            type: 'score',
            score: 0.1,
            legend: { '0': 'honest decision-aid framing', '1': 'mild overclaim risk if we proceed', '2': 'high invent/diagnosis risk - hold' },
            probabilities: { '0': 0.9, '1': 0.08, '2': 0.02 },
            confidence: 0.86,
          },
        },
        usage: { input_tokens: 1, output_tokens: 1 },
      }));
    },
  );

  assert(decision.source === 'typesafe');
  assert(decision.scope_route === 'analyze_in_wedge');
  assert(decision.image_usable_probability === 0.93);
  assert(decision.overclaim_risk === 0);
});
