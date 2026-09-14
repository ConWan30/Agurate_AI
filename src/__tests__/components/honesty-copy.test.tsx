import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { TrustIndicators } from '@/components/TrustIndicators';
import { ComparisonSection } from '@/components/ComparisonSection';
import { LSUResearchBadge } from '@/components/LSUResearchBadge';
import { CommunityInsightsCard } from '@/components/CommunityInsightsCard';
import { BestPractice } from '@/types/enhanced-features';

describe('launch honesty copy', () => {
  it('shows closed-beta trust framing without fabricated validation claims', () => {
    render(<TrustIndicators variant="compact" />);

    expect(screen.getByText(/Informed by LSU AgCenter research/i)).toBeInTheDocument();
    expect(screen.getByText(/Seeking first 100 beta partners/i)).toBeInTheDocument();
    expect(screen.queryByText(/LSU Validated/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/95%/i)).not.toBeInTheDocument();
  });

  it('describes LSU research as framing, not partnership access', () => {
    render(<ComparisonSection />);

    expect(screen.getByText(/LSU Research Framing/i)).toBeInTheDocument();
    expect(
      screen.getByText(/not an official partnership/i)
    ).toBeInTheDocument();
    expect(screen.queryByText(/Direct AI access to 130\+ years/i)).not.toBeInTheDocument();
  });

  it('uses informed-by language on the LSU research badge', () => {
    render(<LSUResearchBadge />);

    expect(screen.getByText(/Informed by LSU AgCenter research/i)).toBeInTheDocument();
    expect(screen.queryByText(/Powered by LSU AgCenter Research/i)).not.toBeInTheDocument();
  });

  it('labels researcher-linked practices as research-linked, not validated', () => {
    const practice: BestPractice = {
      id: 'practice-1',
      practice_name: 'Cover crops',
      description: 'Winter cover between seasons',
      lsu_research_basis: ['soil health'],
      adoption_count: 3,
      success_rate: 0.7,
      average_savings: 120,
      lsu_researcher_id: 'researcher-1',
      created_at: '2026-01-01T00:00:00Z',
    };

    render(
      <MemoryRouter>
        <CommunityInsightsCard practice={practice} />
      </MemoryRouter>
    );

    expect(screen.getByText(/LSU research-linked/i)).toBeInTheDocument();
    expect(screen.queryByText(/LSU Validated/i)).not.toBeInTheDocument();
  });
});
