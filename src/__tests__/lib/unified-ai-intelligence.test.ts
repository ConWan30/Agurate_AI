/**
 * Tests for Unified AI Intelligence System
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { gatherUnifiedContext, formatContextForAI } from '@/lib/unified-ai-intelligence';
import { mockSupabaseClient } from '../mocks/supabase';
import type { UnifiedContext } from '@/types';

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: mockSupabaseClient,
}));

describe('gatherUnifiedContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should gather context from all systems', async () => {
    const mockField = { id: 'field-1', name: 'Test Field', crop_type: 'rice' };
    const mockAssessments = [{ id: 'assess-1', health_score: 85 }];

    // Mock Supabase responses
    mockSupabaseClient.from.mockReturnValue(mockSupabaseClient);
    mockSupabaseClient.select.mockReturnValue(mockSupabaseClient);
    mockSupabaseClient.eq.mockReturnValue(mockSupabaseClient);
    mockSupabaseClient.order.mockReturnValue(mockSupabaseClient);
    mockSupabaseClient.limit.mockReturnValue(mockSupabaseClient);
    mockSupabaseClient.single.mockResolvedValue({ data: mockField, error: null });

    // Mock Promise.all responses
    vi.spyOn(global, 'Promise').mockImplementation((executor) => {
      return new Promise((resolve) => {
        resolve([
          { data: mockField, error: null },
          { data: mockAssessments, error: null },
          { data: [], error: null },
          { data: [], error: null },
          { data: [], error: null },
          { data: [], error: null },
          { data: [], error: null },
          { data: [], error: null },
        ]);
      });
    });

    const context = await gatherUnifiedContext('field-1');

    expect(context).toBeDefined();
    expect(context.fieldData).toBeDefined();
    expect(context.assessmentHistory).toBeDefined();
    expect(context.weatherData).toBeDefined();
  });

  it('should return empty context on error', async () => {
    // Mock error
    mockSupabaseClient.from.mockImplementation(() => {
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
      intelligencePool: {},
    };

    const formatted = formatContextForAI(context);

    expect(formatted).toContain('Test Field');
    expect(formatted).toContain('rice');
    expect(formatted).toContain('85');
  });
});

