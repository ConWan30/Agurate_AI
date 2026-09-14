import { describe, it, expect } from 'vitest';
import {
  getTreatmentType,
  extractTreatmentName,
  computeTreatmentSuccess,
  generateFallbackPredictiveQuestions,
} from '@/lib/phase4-helpers';

describe('Phase 4 treatment outcome helpers', () => {
  it('maps recommendation categories to treatment types', () => {
    expect(getTreatmentType('pest_management')).toBe('fungicide');
    expect(getTreatmentType('disease control')).toBe('fungicide');
    expect(getTreatmentType('fertilization')).toBe('fertilizer');
    expect(getTreatmentType('irrigation schedule')).toBe('irrigation');
    expect(getTreatmentType('herbicide pass')).toBe('herbicide');
    expect(getTreatmentType('other')).toBe('general');
  });

  it('extracts known treatment names from recommendation text', () => {
    expect(extractTreatmentName('Apply azoxystrobin at label rate')).toBe('azoxystrobin');
    expect(extractTreatmentName('Side dress nitrogen this week')).toBe('nitrogen');
    expect(extractTreatmentName('Scout fields twice weekly')).toBe('Scout fields twice');
  });

  it('computes success from outcome and improvement', () => {
    expect(
      computeTreatmentSuccess({
        outcome: 'success',
        healthScoreBefore: 60,
        healthScoreAfter: 70,
      }).success
    ).toBe(true);

    expect(
      computeTreatmentSuccess({
        outcome: 'failure',
        healthScoreBefore: 60,
        healthScoreAfter: 70,
      }).success
    ).toBe(false);

    expect(
      computeTreatmentSuccess({
        outcome: 'partial',
        healthScoreBefore: 60,
        healthScoreAfter: 64,
      }).success
    ).toBe(true);

    expect(
      computeTreatmentSuccess({
        outcome: 'partial',
        healthScoreBefore: 60,
        healthScoreAfter: 61,
      }).success
    ).toBe(false);
  });
});

describe('Phase 4 predictive question fallbacks', () => {
  it('returns stress-focused questions for low health', () => {
    const questions = generateFallbackPredictiveQuestions({
      hasRecentAssessment: true,
      healthScore: 55,
      cropType: 'rice',
    });

    expect(questions[0]).toContain('stress in my rice');
    expect(questions).toHaveLength(4);
  });

  it('returns default questions without assessment context', () => {
    const questions = generateFallbackPredictiveQuestions({
      hasRecentAssessment: false,
    });

    expect(questions[0]).toContain('Morehouse Parish');
  });


  it('uses general monitoring prompts when healthScore is missing', () => {
    const questions = generateFallbackPredictiveQuestions({
      hasRecentAssessment: true,
      cropType: 'soybean',
    });
    expect(questions[0]).toMatch(/monitor/i);
    expect(questions.some((q) => /stress/i.test(q))).toBe(false);
  });
});
