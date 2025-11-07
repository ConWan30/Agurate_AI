/**
 * Analytics Utility
 * Centralized analytics tracking for user events and feature usage
 * Ready for integration with PostHog, Mixpanel, or Google Analytics
 */

export type AnalyticsEvent = 
  | 'page_view'
  | 'feature_used'
  | 'image_uploaded'
  | 'analysis_completed'
  | 'delta_chat_message'
  | 'field_created'
  | 'prediction_viewed'
  | 'error_occurred';

export interface AnalyticsProperties {
  [key: string]: string | number | boolean | null | undefined;
}

class Analytics {
  private enabled: boolean = true;
  private events: Array<{ event: AnalyticsEvent; properties: AnalyticsProperties; timestamp: number }> = [];

  /**
   * Initialize analytics (call this when app loads)
   */
  init(options?: { enabled?: boolean }) {
    this.enabled = options?.enabled ?? true;
    
    // In production, initialize PostHog/Mixpanel here
    // Example:
    // if (import.meta.env.PROD) {
    //   posthog.init(import.meta.env.VITE_POSTHOG_KEY, {
    //     api_host: import.meta.env.VITE_POSTHOG_HOST,
    //   });
    // }
  }

  /**
   * Track an event
   */
  track(event: AnalyticsEvent, properties?: AnalyticsProperties) {
    if (!this.enabled) return;

    const eventData = {
      event,
      properties: properties || {},
      timestamp: Date.now(),
    };

    // Store locally for debugging
    this.events.push(eventData);
    
    // Keep only last 100 events in memory
    if (this.events.length > 100) {
      this.events.shift();
    }

    // In production, send to analytics service
    // Example:
    // if (import.meta.env.PROD) {
    //   posthog.capture(event, properties);
    // }

    // Log in development
    if (import.meta.env.DEV) {
      console.log('[Analytics]', event, properties);
    }
  }

  /**
   * Track page view
   */
  pageView(pageName: string, properties?: AnalyticsProperties) {
    this.track('page_view', {
      page: pageName,
      ...properties,
    });
  }

  /**
   * Track feature usage
   */
  featureUsed(featureName: string, properties?: AnalyticsProperties) {
    this.track('feature_used', {
      feature: featureName,
      ...properties,
    });
  }

  /**
   * Track errors
   */
  trackError(error: Error, context?: AnalyticsProperties) {
    this.track('error_occurred', {
      error_message: error.message,
      error_name: error.name,
      ...context,
    });
  }

  /**
   * Get recent events (for debugging)
   */
  getRecentEvents(limit: number = 10) {
    return this.events.slice(-limit);
  }

  /**
   * Clear event history
   */
  clearEvents() {
    this.events = [];
  }
}

// Singleton instance
export const analytics = new Analytics();

// Initialize on import
if (typeof window !== 'undefined') {
  analytics.init();
}

