/**
 * Error Tracking Utility
 * Centralized error tracking ready for Sentry integration
 */

import { handleError, AppError } from './error-handler';
import { analytics } from './analytics';

export interface ErrorTrackingContext {
  userId?: string;
  userEmail?: string;
  feature?: string;
  additionalData?: Record<string, unknown>;
}

class ErrorTracker {
  private enabled: boolean = true;
  private sentryInitialized: boolean = false;

  /**
   * Initialize error tracking (call this when app loads)
   */
  init(options?: { enabled?: boolean; dsn?: string }) {
    this.enabled = options?.enabled ?? true;

    // Initialize Sentry in production
    // Example:
    // if (import.meta.env.PROD && options?.dsn) {
    //   Sentry.init({
    //     dsn: options.dsn,
    //     environment: import.meta.env.MODE,
    //     integrations: [
    //       new Sentry.BrowserTracing(),
    //       new Sentry.Replay(),
    //     ],
    //     tracesSampleRate: 0.1,
    //     replaysSessionSampleRate: 0.1,
    //     replaysOnErrorSampleRate: 1.0,
    //   });
    //   this.sentryInitialized = true;
    // }
  }

  /**
   * Capture an error
   */
  captureError(
    error: unknown,
    context?: ErrorTrackingContext
  ) {
    if (!this.enabled) return;

    const appError = handleError(error, {
      userId: context?.userId,
      functionName: context?.feature,
      additionalData: context?.additionalData,
    });

    // Track in analytics
    analytics.trackError(appError, {
      category: appError.category,
      feature: context?.feature,
    });

    // Send to Sentry in production
    // Example:
    // if (this.sentryInitialized) {
    //   Sentry.withScope((scope) => {
    //     if (context?.userId) {
    //       scope.setUser({ id: context.userId, email: context.userEmail });
    //     }
    //     if (context?.feature) {
    //       scope.setTag('feature', context.feature);
    //     }
    //     if (context?.additionalData) {
    //       scope.setContext('additional', context.additionalData);
    //     }
    //     Sentry.captureException(appError.originalError || appError);
    //   });
    // }

    // Log in development
    if (import.meta.env.DEV) {
      console.error('[Error Tracking]', {
        error: appError,
        context,
      });
    }

    return appError;
  }

  /**
   * Set user context for error tracking
   */
  setUser(userId: string, email?: string) {
    // Example:
    // if (this.sentryInitialized) {
    //   Sentry.setUser({ id: userId, email });
    // }
  }

  /**
   * Clear user context
   */
  clearUser() {
    // Example:
    // if (this.sentryInitialized) {
    //   Sentry.setUser(null);
    // }
  }
}

// Singleton instance
export const errorTracker = new ErrorTracker();

// Initialize on import
if (typeof window !== 'undefined') {
  errorTracker.init();
}

