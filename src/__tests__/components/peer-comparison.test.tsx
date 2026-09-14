import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { PeerComparisonCard } from '@/components/PeerComparisonCard';

const rpc = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    rpc: (...args: unknown[]) => rpc(...args),
  },
}));

vi.mock('sonner', () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

describe('PeerComparisonCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('passes field id into get_peer_comparison and renders RPC shape', async () => {
    rpc.mockResolvedValue({
      data: [
        {
          treatment_type: 'fungicide',
          success_rate: 82.5,
          avg_effectiveness: 74,
          sample_size: 12,
        },
      ],
      error: null,
    });

    render(
      <PeerComparisonCard
        fieldId="11111111-1111-1111-1111-111111111111"
        treatmentType="fungicide"
        cropType="rice"
        currentHealthScore={61}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/Most Successful Treatment/i)).toBeInTheDocument();
    });

    expect(rpc).toHaveBeenCalledWith('get_peer_comparison', {
      p_field_id: '11111111-1111-1111-1111-111111111111',
      p_crop_type: 'rice',
      p_problem: 'fungicide',
    });
    // formatPeerMetric rounds non-integer rates for display honesty
    expect(screen.getByText(/83% Success/i)).toBeInTheDocument();
    expect(screen.getAllByText(/12 outcomes?/i).length).toBeGreaterThan(0);
  });

  it('shows empty state when field id is missing', async () => {
    render(
      <PeerComparisonCard
        fieldId=""
        treatmentType="fungicide"
        cropType="rice"
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/No community data available yet/i)).toBeInTheDocument();
    });
    expect(rpc).not.toHaveBeenCalled();
  });
});
