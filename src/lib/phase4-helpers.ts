/**
 * Pure helpers extracted for treatment outcome logging.
 * Kept separate so Phase 4 behavior can be unit-tested without dialog UI.
 */

export function getTreatmentType(category: string): string {
  const categoryLower = category.toLowerCase();
  if (categoryLower.includes('pest') || categoryLower.includes('disease')) return 'fungicide';
  if (categoryLower.includes('fertil')) return 'fertilizer';
  if (categoryLower.includes('irrigat')) return 'irrigation';
  if (categoryLower.includes('herbic')) return 'herbicide';
  return 'general';
}

export function extractTreatmentName(text: string): string {
  const treatments = [
    'azoxystrobin', 'propiconazole', 'tebuconazole', 'flutriafol',
    'urea', 'ammonium', 'nitrogen', 'phosphorus', 'potassium',
    'glyphosate', '2,4-D', 'atrazine'
  ];

  const textLower = text.toLowerCase();
  for (const treatment of treatments) {
    if (textLower.includes(treatment)) {
      return treatment;
    }
  }

  return text.split(' ').slice(0, 3).join(' ');
}

export function computeTreatmentSuccess(params: {
  outcome: 'success' | 'partial' | 'failure';
  healthScoreBefore?: number | null;
  healthScoreAfter: number;
}): { improvement: number | null; improvementPercentage: number | null; success: boolean } {
  const before =
    params.healthScoreBefore != null && Number.isFinite(params.healthScoreBefore)
      ? params.healthScoreBefore
      : null;
  const improvement = before != null ? params.healthScoreAfter - before : null;
  const improvementPercentage =
    before != null && before > 0 && improvement != null
      ? (improvement / before) * 100
      : null;

  const success =
    params.outcome === 'success' ||
    (params.outcome === 'partial' &&
      improvementPercentage != null &&
      improvementPercentage > 5);

  return { improvement, improvementPercentage, success };
}

export function generateFallbackPredictiveQuestions(input: {
  hasRecentAssessment: boolean;
  healthScore?: number;
  cropType?: string;
}): string[] {
  const cropType = input.cropType || 'crops';

  if (!input.hasRecentAssessment) {
    return [
      'What rice varieties work best in Morehouse Parish?',
      'How do I identify soybean rust early?',
      'Best cotton planting practices for Delta soils?',
      'When should I apply nitrogen to corn fields?',
    ];
  }

  // Missing health score → general monitoring prompts (do not assume 100/healthy)
  if (input.healthScore == null || Number.isNaN(Number(input.healthScore))) {
    return [
      `What should I monitor in my ${cropType} this week?`,
      'Any upcoming weather concerns?',
      'Best practices for maintaining crop health?',
      'When should I schedule the next field check?',
    ];
  }
  const healthScore = Number(input.healthScore);
  if (healthScore < 70) {
    return [
      `What's causing the stress in my ${cropType}?`,
      'Should I treat immediately or wait?',
      'How much will treatment cost vs. potential loss?',
      'Will weather affect my treatment timing?',
    ];
  }
  if (healthScore < 85) {
    return [
      `Is my ${cropType} recovery on track?`,
      'Do I need additional monitoring?',
      'What preventive measures should I take?',
    ];
  }
  return [
    `What should I monitor in my ${cropType} this week?`,
    'Any upcoming weather concerns?',
    'Best practices for maintaining health?',
  ];
}
