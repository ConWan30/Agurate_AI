import { describe, expect, it } from 'vitest';
import { formatConfidencePercent, normalizeRiskLevel } from '@/lib/risk-confidence';

describe('normalizeRiskLevel', () => {
  it('normalizes known risk labels', () => {
    expect(normalizeRiskLevel('HIGH')).toBe('high');
    expect(normalizeRiskLevel('moderate')).toBe('medium');
    expect(normalizeRiskLevel('low')).toBe('low');
  });

  it('does not invent low risk for unknown values', () => {
    expect(normalizeRiskLevel(null)).toBe('');
    expect(normalizeRiskLevel('unknown')).toBe('');
    expect(normalizeRiskLevel('')).toBe('');
  });
});

describe('formatConfidencePercent', () => {
  it('formats 0–1 and 0–100 without inventing out-of-range values', () => {
    expect(formatConfidencePercent(0.82)).toBe('82%');
    expect(formatConfidencePercent(82)).toBe('82%');
    expect(formatConfidencePercent(null)).toBe('—');
    expect(formatConfidencePercent(150)).toBe('—');
    expect(formatConfidencePercent(-1)).toBe('—');
  });
});
