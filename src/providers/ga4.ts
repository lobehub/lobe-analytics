/**
 * Google Analytics 4 Provider
 * Uses gtag.js library for client-side tracking
 */
import { BaseAnalytics } from '@/base';
import type { AnalyticsEvent, GoogleAnalyticsProviderConfig } from '@/types';

/**
 * Google Analytics 4 Analytics Provider
 * Uses gtag.js for tracking events, page views, and user identification
 */
export class GoogleAnalyticsProvider extends BaseAnalytics {
  private readonly config: GoogleAnalyticsProviderConfig;
  private initialized = false;

  constructor(config: GoogleAnalyticsProviderConfig, business: string) {
    super({ business, debug: config.debug, enabled: config.enabled });
    this.config = config;
  }

  getProviderName(): string {
    return 'Google Analytics 4';
  }

  async initialize(): Promise<void> {
    if (!this.isEnabled() || this.initialized) {
      return;
    }

    try {
      // Ensure gtag function is available
      if (typeof window === 'undefined') {
        this.logError('GA4 provider requires browser environment');
        return;
      }

      // Initialize dataLayer if not exists
      (window as any).dataLayer = (window as any).dataLayer || [];
      const gtag =
        (window as any).gtag ||
        function () {
          (window as any).dataLayer.push(arguments);
        };
      (window as any).gtag = gtag;

      // Check if gtag.js is already loaded or if gtag function exists
      const gtagExists = typeof (window as any).gtag === 'function';

      // Only load script if gtag function doesn't exist
      if (!gtagExists) {
        // Check for existing gtag script
        const existingScript = document.querySelector(
          `script[src*="gtag/js"], script[id*="ga"], script[id*="gtag"]`,
        );

        if (!existingScript) {
          const script = document.createElement('script');
          script.async = true;
          script.src = `https://www.googletagmanager.com/gtag/js?id=${this.config.measurementId}`;
          document.head.append(script);
        }
      }

      // Initialize gtag
      gtag('js', new Date());

      // Configure GA4 with user config and our defaults
      const configOptions = {
        // User's gtag config options
        ...this.config.gtagConfig,
        // Our internal config (these override user config for consistency)
        debug_mode: this.debug || this.config.gtagConfig?.debug_mode,
      };

      gtag('config', this.config.measurementId, configOptions);

      this.initialized = true;
      this.log('Google Analytics 4 initialized successfully');
      this.log(`Measurement ID: ${this.config.measurementId}`);
      this.log(`Business context will be added to all events: ${this.business}`);
    } catch (error) {
      this.logError('Failed to initialize Google Analytics 4', error);
      throw error;
    }
  }

  async track(event: AnalyticsEvent): Promise<void> {
    if (!this.isEnabled() || !this.initialized || !this.validateEvent(event)) {
      return;
    }

    try {
      const gtag = (window as any).gtag;
      if (!gtag) {
        this.logError('gtag function not available');
        return;
      }

      const enrichedProperties = this.enrichProperties(event.properties);

      // Send event with enriched properties
      const eventParams = {
        ...enrichedProperties,
        // Add user_id if provided in the event
        ...(event.userId && { user_id: event.userId }),
      };

      gtag('event', event.name, eventParams);

      this.log(`Tracked event: ${event.name}`, { ...event, properties: enrichedProperties });
    } catch (error) {
      this.logError(`Failed to track event: ${event.name}`, error);
    }
  }

  async identify(userId: string, properties?: Record<string, any>): Promise<void> {
    if (!this.isEnabled() || !this.initialized) {
      return;
    }

    try {
      const gtag = (window as any).gtag;
      if (!gtag) {
        this.logError('gtag function not available');
        return;
      }

      // 1. Set user_id in config (affects all subsequent events)
      gtag('config', this.config.measurementId, {
        user_id: userId,
      });

      // 2. Set user properties if provided
      if (properties && Object.keys(properties).length > 0) {
        const enrichedProperties = this.enrichProperties(properties);
        gtag('set', {
          user_properties: enrichedProperties,
        });
      }

      // 3. Track login event (GA4 recommended practice)
      gtag('event', 'login', {
        user_id: userId,
        ...this.enrichProperties(),
      });

      this.log(`Identified user: ${userId}`, properties);
    } catch (error) {
      this.logError(`Failed to identify user: ${userId}`, error);
    }
  }

  async trackPageView(page: string, properties?: Record<string, any>): Promise<void> {
    if (!this.isEnabled() || !this.initialized) {
      return;
    }

    try {
      const enrichedProperties = this.enrichProperties(properties);

      // Use the track method to send page_view event
      await this.track({
        name: 'page_view',
        properties: {
          page_location: page,
          page_title: page,
          ...enrichedProperties,
        },
      });

      this.log(`Tracked page view: ${page}`, enrichedProperties);
    } catch (error) {
      this.logError(`Failed to track page view: ${page}`, error);
    }
  }

  async reset(): Promise<void> {
    if (!this.isEnabled() || !this.initialized) {
      return;
    }

    try {
      const gtag = (window as any).gtag;
      if (!gtag) {
        this.logError('gtag function not available');
        return;
      }

      // 1. Clear user_id (set to null, not string "null")
      gtag('config', this.config.measurementId, {
        user_id: null,
      });

      // 2. Clear user properties
      gtag('set', {
        user_properties: {},
      });

      // 3. Track logout event
      gtag('event', 'logout', this.enrichProperties());

      this.log('Reset user identity and tracked logout');
    } catch (error) {
      this.logError('Failed to reset user identity', error);
    }
  }

  /**
   * Check if feature flag is enabled
   * Note: GA4 doesn't have built-in feature flags like PostHog,
   * so this always returns false
   */
  isFeatureEnabled(flag: string): boolean {
    this.log(`Feature flags not supported in GA4. Flag "${flag}" returns false`);
    return false;
  }

  /**
   * Get the native gtag function for direct access to GA4 APIs
   *
   * Note: When using the native gtag function directly, events will NOT automatically
   * include the business and spm properties. You need to add them manually if desired.
   *
   * @returns gtag function or null if not initialized
   *
   * @example
   * ```typescript
   * const analytics = createAnalytics({ business: 'myapp', ... });
   * const ga4Provider = analytics.getProvider('ga4');
   * const gtag = ga4Provider.getNativeInstance();
   *
   * // Manual business context addition required for direct calls
   * gtag?.('event', 'custom_event', {
   *   custom: 'data',
   *   business: 'myapp',
   *   spm: 'myapp.custom_section'
   * });
   * ```
   */
  getNativeInstance(): ((...args: any[]) => void) | null {
    if (!this.isEnabled() || !this.initialized) {
      this.log('Cannot get native instance: provider not enabled or not initialized');
      return null;
    }

    const gtag = (window as any).gtag;
    if (!gtag) {
      this.log('gtag function not available');
      return null;
    }

    return gtag;
  }

  /**
   * Get current measurement ID
   */
  getMeasurementId(): string {
    return this.config.measurementId;
  }

  /**
   * Get current business context
   */
  getCurrentBusiness(): string {
    return this.business;
  }
}
