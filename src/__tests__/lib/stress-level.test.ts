import { describe, expect, it } from 'vitest';
import { normalizeStressLevel } from '@/lib/stress-level';
import { hasHealthScore, toHealthPercent } from '@/lib/health-score';

describe('normalizeStressLevel', () => {
  it('normalizes common AI/DB casing variants', () => {
    expect(normalizeStressLevel('Healthy')).toBe('healthy');
    expect(normalizeStressLevel('MODERATE')).toBe('moderate');
    expect(normalizeStressLevel('severe')).toBe('severe');
    expect(normalizeStressLevel('mild')).toBe('moderate');
    expect(normalizeStressLevel('critical')).toBe('severe');
  });

  it('does not invent severity for missing/unknown values', () => {
    expect(normalizeStressLevel(null)).toBe('');
    expect(normalizeStressLevel(undefined)).toBe('');
    expect(normalizeStressLevel('')).toBe('');
    expect(normalizeStressLevel('unknown')).toBe('');
    expect(normalizeStressLevel('kinda bad')).toBe('');
  });
});

describe('planning index via toHealthPercent (disease_risk 0–1 or 0–100)', () => {
  it('accepts both fraction and percent disease-risk scales', () => {
    expect(toHealthPercent(0.42)).toBe(42);
    expect(toHealthPercent(42)).toBe(42);
    expect(hasHealthScore(0)).toBe(true);
    expect(hasHealthScore(null)).toBe(false);
  });
});
