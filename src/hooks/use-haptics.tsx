import { useCallback } from 'react';

type HapticPattern = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error';

export function useHaptics() {
  const triggerHaptic = useCallback((pattern: HapticPattern = 'light') => {
    // Check if vibration API is available
    if (!navigator.vibrate) return;

    const patterns = {
      light: [10],
      medium: [20],
      heavy: [30],
      success: [10, 50, 10],
      warning: [15, 100, 15],
      error: [20, 100, 20, 100, 20]
    };

    navigator.vibrate(patterns[pattern]);
  }, []);

  return { triggerHaptic };
}
