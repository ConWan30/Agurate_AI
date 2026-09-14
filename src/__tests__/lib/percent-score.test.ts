import { describe, expect, it } from 'vitest';
import { parsePercentScore } from '@/lib/percent-score';

describe('parsePercentScore', () => {
  it('accepts 0–100 inclusive', () => {
    expect(parsePercentScore(0)).toBe(0);
    expect(parsePercentScore(55.5)).toBe(55.5);
    expect(parsePercentScore(100)).toBe(100);
    expect(parsePercentScore('12')).toBe(12);
  });

  it('rejects invent outside range', () => {
    expect(parsePercentScore(null)).toBe(null);
    expect(parsePercentScore(-1)).toBe(null);
    expect(parsePercentScore(101)).toBe(null);
    expect(parsePercentScore(NaN)).toBe(null);
  });
});
