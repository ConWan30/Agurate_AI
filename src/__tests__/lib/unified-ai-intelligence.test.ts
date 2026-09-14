/**
 * Tests for Unified AI Intelligence System
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

const single = vi.fn();
const limit = vi.fn();
const order = vi.fn();
const eq = vi.fn();
const select = vi.fn();
const from = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: (...args: unknown[]) => from(...args),
  },
}));

import { gatherUnifiedContext, formatContextForAI } from '@/lib/unified-ai-intelligence';
import type { UnifiedContext } from '@/types';

function mockQueryResult(result: { data: unknown; error: null }) {
  const builder: Record<string, unknown> = {};
  builder.select = select.mockReturnValue(builder);
  builder.eq = eq.mockReturnValue(builder);
  builder.order = order.mockReturnValue(builder);
  builder.limit = limit.mockResolvedValue(result);
  builder.single = single.mockResolvedValue(result);
  return builder;
}

describe('gatherUnifiedContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should gather context from all systems', async () => {
    const mockField = { id: 'field-1', name: 'Test Field', crop_type: 'rice' };
    const mockAssessments = [{ id: 'assess-1', health_score: 85, analyzed_at: '2024-01-01', stress_level: 'low', symptoms: [] }];

    from.mockImplementation((table: string) => {
      if (table === 'fields') {
        return mockQueryResult({ data: mockField, error: null });
      }
      if (table === 'assessments') {
        return mockQueryResult({ data: mockAssessments, error: null });
      }
      return mockQueryResult({ data: [], error: null });
    });

    const context = await gatherUnifiedContext('field-1');

    expect(context).toBeDefined();
    expect(context.fieldData).toEqual(mockField);
    expect(context.assessmentHistory).toEqual(mockAssessments);
    expect(context.weatherData).toBeDefined();
    // Do not invent readings — empty object is honest until weather is wired
    expect(context.weatherData).toEqual({});
    expect(from).toHaveBeenCalledWith('fields');
  });

  it('should return empty context on error', async () => {
    from.mockImplementation(() => {
      throw new Error('Database error');
    });

    const context = await gatherUnifiedContext('field-1');

    expect(context.fieldData).toBeNull();
    expect(context.assessmentHistory).toEqual([]);
  });
});

describe('formatContextForAI', () => {
  it('should format context as string', () => {
    const context: UnifiedContext = {
      fieldData: {
        id: 'field-1',
        user_id: 'user-1',
        name: 'Test Field',
        crop_type: 'rice',
        created_at: '2024-01-01T00:00:00Z',
      },
      assessmentHistory: [],
      conservationData: [],
      varietyData: [],
      weatherData: {
        current_temp: 85,
        humidity: 75,
        days_since_rain: 3,
      },
      communityData: [],
      waterStressData: [],
      predictiveData: [],
      intelligencePool: { field_id: 'field-1' },
    };

    const formatted = formatContextForAI(context);

    expect(formatted).toContain('rice');
    expect(formatted).toContain('85');
    expect(formatted).toContain('UNIFIED FIELD INTELLIGENCE CONTEXT');
  });
});
