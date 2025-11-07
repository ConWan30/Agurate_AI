/**
 * Test Fixtures - Assessments
 * Sample assessment data for testing
 */

import type { Assessment } from '@/types';

export const mockAssessment: Assessment = {
  id: 'assessment-1',
  field_id: 'field-1',
  image_url: 'https://example.com/crop-image.jpg',
  health_score: 85,
  stress_level: 'healthy',
  symptoms: [],
  confidence_score: 0.92,
  analyzed_at: '2024-10-30T12:00:00Z',
};

export const mockAssessments: Assessment[] = [
  mockAssessment,
  {
    id: 'assessment-2',
    field_id: 'field-1',
    image_url: 'https://example.com/crop-image-2.jpg',
    health_score: 65,
    stress_level: 'moderate',
    symptoms: ['yellowing', 'wilting'],
    confidence_score: 0.88,
    analyzed_at: '2024-10-29T12:00:00Z',
  },
];

