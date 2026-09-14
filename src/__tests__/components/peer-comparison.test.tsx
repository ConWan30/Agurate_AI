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
          farmer_count: 4,
        },
      ],
      error: null,
    });

    render(
      <PeerComparisonCard
        fieldId="11111111-1111-1111-1111-111111111111"
        treatmentType="fungicide"
        cropType="soybean"
        currentHealthScore={61}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/Highest self-reported success rate/i)).toBeInTheDocument();
    });

    expect(rpc).toHaveBeenCalledWith('get_peer_comparison', {
      p_field_id: '11111111-1111-1111-1111-111111111111',
      p_crop_type: 'soybean',
      p_problem: 'fungicide',
    });
    // formatPeerMetric rounds non-integer rates for display honesty
    expect(screen.getByText(/83% Success/i)).toBeInTheDocument();
    expect(screen.getAllByText(/4 farmers/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/12 outcomes?/i).length).toBeGreaterThan(0);
  });

  it('shows empty state when field id is missing', async () => {
    render(
      <PeerComparisonCard
        fieldId=""
        treatmentType="fungicide"
        cropType="soybean"
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/No community data available yet/i)).toBeInTheDocument();
    });
    expect(rpc).not.toHaveBeenCalled();
  });

  it('shows em dash for null avg_effectiveness (never invents 0/100)', async () => {
    rpc.mockResolvedValue({
      data: [
        {
          treatment_type: 'pest_management',
          success_rate: 70,
          avg_effectiveness: null,
          sample_size: 9,
          farmer_count: 3,
        },
      ],
      error: null,
    });

    render(
      <PeerComparisonCard
        fieldId="11111111-1111-1111-1111-111111111111"
        treatmentType="pest_management"
        cropType="soybean"
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/Highest self-reported success rate/i)).toBeInTheDocument();
    });
    expect(screen.queryByText(/0\/100/)).not.toBeInTheDocument();
    expect(screen.getAllByText('—').length).toBeGreaterThan(0);
  });

});
