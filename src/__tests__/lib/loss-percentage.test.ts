import { describe, expect, it } from 'vitest';
import { parseLossPercentage, requireLossPercentage } from '@/lib/loss-percentage';

describe('parseLossPercentage', () => {
  it('accepts 0–100 inclusive', () => {
    expect(parseLossPercentage(0)).toBe(0);
    expect(parseLossPercentage(42.5)).toBe(42.5);
    expect(parseLossPercentage(100)).toBe(100);
    expect(parseLossPercentage('75')).toBe(75);
  });

  it('rejects missing and out-of-range invent', () => {
    expect(parseLossPercentage(null)).toBe(null);
    expect(parseLossPercentage('')).toBe(null);
    expect(parseLossPercentage(-1)).toBe(null);
    expect(parseLossPercentage(101)).toBe(null);
    expect(parseLossPercentage(NaN)).toBe(null);
  });

  it('requireLossPercentage throws on invent', () => {
    expect(() => requireLossPercentage(150)).toThrow(/0 and 100/);
    expect(requireLossPercentage(10)).toBe(10);
  });
});
