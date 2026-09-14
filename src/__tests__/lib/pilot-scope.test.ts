import { describe, expect, it } from 'vitest';
import {
  PILOT_CROP,
  PILOT_PARISH,
  isPilotCrop,
  isPilotDeferredPath,
  normalizePilotCrop,
  requirePilotCrop,
} from '@/lib/pilot-scope';

describe('pilot-scope', () => {
  it('locks the wedge to Morehouse soybeans', () => {
    expect(PILOT_PARISH).toBe('Morehouse');
    expect(PILOT_CROP).toBe('soybean');
  });

  it('accepts soybean aliases and rejects other crops', () => {
    expect(isPilotCrop('soybean')).toBe(true);
    expect(isPilotCrop('soybeans')).toBe(true);
    expect(isPilotCrop('rice')).toBe(false);
    expect(normalizePilotCrop('Soybeans')).toBe('soybean');
    expect(normalizePilotCrop('cotton')).toBeNull();
  });

  it('requirePilotCrop fails closed on non-pilot crops', () => {
    expect(requirePilotCrop('soybean')).toBe('soybean');
    expect(() => requirePilotCrop('rice')).toThrow(/soybeans only/i);
  });

  it('marks unvalidated suite modules as deferred', () => {
    expect(isPilotDeferredPath('/predictions')).toBe(true);
    expect(isPilotDeferredPath('/insurance')).toBe(true);
    expect(isPilotDeferredPath('/cooperatives/join/abc')).toBe(true);
    expect(isPilotDeferredPath('/scanner')).toBe(false);
    expect(isPilotDeferredPath('/fields')).toBe(false);
  });
});
