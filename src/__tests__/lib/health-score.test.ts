import { describe, expect, it } from 'vitest';
import {
  formatHealthPercent,
  hasHealthScore,
  healthTone,
  requireHealthScore,
  toHealthFraction,
  toHealthPercent,
} from '@/lib/health-score';

describe('health-score helpers', () => {
  it('treats 0–1 fractions as percentages', () => {
    expect(toHealthPercent(0.72)).toBe(72);
    expect(toHealthPercent(1)).toBe(100);
    expect(toHealthPercent(0)).toBe(0);
  });

  it('passes through 0–100 values', () => {
    expect(toHealthPercent(68)).toBe(68);
    expect(toHealthPercent(91.5)).toBe(91.5);
  });

  it('handles null, NaN, negatives, and >100', () => {
    expect(toHealthPercent(null)).toBe(0);
    expect(toHealthPercent(undefined)).toBe(0);
    expect(toHealthPercent(Number.NaN)).toBe(0);
    expect(toHealthPercent(-5)).toBe(0);
    expect(toHealthPercent(150)).toBe(100);
  });

  it('distinguishes fraction boundary 1 from percent scale values', () => {
    expect(toHealthPercent(1)).toBe(100);
    expect(toHealthPercent(2)).toBe(2);
  });

  it('formats and classifies tones', () => {
    expect(formatHealthPercent(0.8)).toBe('80%');
    expect(healthTone(0.9)).toBe('good');
    expect(healthTone(60)).toBe('moderate');
    expect(healthTone(0.2)).toBe('severe');
    expect(toHealthFraction(80)).toBe(0.8);
  });

  it('hasHealthScore / requireHealthScore fail closed on missing values', () => {
    expect(hasHealthScore(0)).toBe(true);
    expect(hasHealthScore(68)).toBe(true);
    expect(hasHealthScore(null)).toBe(false);
    expect(hasHealthScore(undefined)).toBe(false);
    expect(hasHealthScore(Number.NaN)).toBe(false);
    expect(requireHealthScore(0.8)).toBe(80);
    expect(() => requireHealthScore(null)).toThrow(/did not return/);
    expect(() => requireHealthScore(undefined)).toThrow(/did not return/);
  });
});
