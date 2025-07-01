import { BeforeSendFn, CaptureResult, posthog } from 'posthog-js';

import { BaseAnalytics } from '@/base';
import type { AnalyticsEvent, PostHogProviderAnalyticsConfig } from '@/types';

/**
 * PostHog Analytics Provider
 * Uses official posthog-js SDK
 */
export class PostHogAnalyticsProvider extends BaseAnalytics {
  private readonly config: PostHogProviderAnalyticsConfig;
  private initialized = false;

  constructor(config: PostHogProviderAnalyticsConfig, business: string) {
    super({ business, debug: config.debug, enabled: config.enabled });
    this.config = config;
  }

  getProviderName(): string {
    return 'PostHog';
  }

  async initialize(): Promise<void> {
    if (!this.isEnabled() || this.initialized) {
      return;
    }

    try {
      // Extract provider-specific properties and prepare posthog config
      const { key, host, ...posthogConfig } = this.config;

      // Build init config: start with user's posthog config, then apply our defaults/overrides
      const initConfig = {
        ...posthogConfig, // User's posthog-js config options
        api_host: host || posthogConfig.api_host || 'https://app.posthog.com',
        // Use before_send to dynamically add business context to all events
        before_send: this.createBeforeSendHandler(posthogConfig.before_send),
        debug: this.debug,
        loaded: () => this.log('PostHog loaded and ready'),
      };

      posthog.init(key, initConfig);

      this.initialized = true;
      this.log('PostHog initialized successfully');
      this.log(`Using before_send to add business context: ${this.business}`);
    } catch (error) {
      this.logError('Failed to initialize PostHog', error);
      throw error;
    }
  }

  async track(event: AnalyticsEvent): Promise<void> {
    if (!this.isEnabled() || !this.initialized || !this.validateEvent(event)) {
      return;
    }

    try {
      const enrichedProperties = this.enrichProperties(event.properties);

      posthog.capture(event.name, {
        ...enrichedProperties,
        ...(event.userId && { distinct_id: event.userId }),
      });

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
      const enrichedProperties = this.enrichProperties(properties);
      posthog.identify(userId, enrichedProperties);
      this.log(`Identified user: ${userId}`, enrichedProperties);
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
      await this.track({
        name: '$pageview',
        properties: { page, ...enrichedProperties },
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
      posthog.reset();
      this.log('Reset user identity');
    } catch (error) {
      this.logError('Failed to reset user identity', error);
    }
  }

  /**
   * Check if feature flag is enabled
   */
  isFeatureEnabled(flag: string): boolean {
    if (!this.initialized) {
      return false;
    }

    try {
      return Boolean(posthog.isFeatureEnabled(flag));
    } catch (error) {
      this.logError(`Failed to check feature flag: ${flag}`, error);
      return false;
    }
  }

  /**
   * Get the native PostHog instance for direct access to PostHog APIs
   *
   * Note: When using the native instance directly, events will still include
   * the business spm prefix because it's registered as a global property.
   *
   * @returns PostHog native instance or null if not initialized
   *
   * @example
   * ```typescript
   * const analytics = createAnalytics({ business: 'myapp', ... });
   * const posthogProvider = analytics.getProvider('posthog');
   * const posthog = posthogProvider.getNativeInstance();
   *
   * // These calls will automatically include spm: 'myapp'
   * posthog?.capture('custom_event', { custom: 'data' });
   * posthog?.isFeatureEnabled('new_feature');
   * posthog?.group('company', 'company_123');
   * ```
   */
  getNativeInstance(): typeof posthog | null {
    if (!this.isEnabled() || !this.initialized) {
      this.log('Cannot get native instance: provider not enabled or not initialized');
      return null;
    }

    return posthog;
  }

  /**
   * Create a before_send handler that adds business context to all events
   * This ensures both wrapper calls and direct PostHog calls include business information
   */
  private createBeforeSendHandler(userBeforeSend?: BeforeSendFn | BeforeSendFn[]): BeforeSendFn {
    return (event: CaptureResult | null): CaptureResult | null => {
      // Return null if event is null
      if (!event) {
        return null;
      }

      // Record whether user originally had spm field
      const originallyHadSpm = event.properties?.spm !== undefined;

      // Call user's before_send first if provided
      let processedEvent: CaptureResult | null = event;
      if (userBeforeSend) {
        if (Array.isArray(userBeforeSend)) {
          // Handle array of before_send functions
          for (const fn of userBeforeSend) {
            processedEvent = fn(processedEvent);
            if (!processedEvent) {
              return null; // User function filtered out the event
            }
          }
        } else if (typeof userBeforeSend === 'function') {
          processedEvent = userBeforeSend(processedEvent);
          if (!processedEvent) {
            return null; // User function filtered out the event
          }
        }
      }

      // Ensure properties object exists
      if (!processedEvent.properties) {
        processedEvent.properties = {};
      }

      // Always ensure business field is present (final override to prevent user deletion)
      processedEvent.properties.business = this.business;

      // Set spm only if:
      // 1. User didn't originally have spm AND
      // 2. User's before_send didn't add spm OR added empty spm
      const currentSpm = processedEvent.properties.spm;
      const shouldSetDefaultSpm =
        !originallyHadSpm &&
        (!currentSpm || (typeof currentSpm === 'string' && !currentSpm.trim()));

      if (shouldSetDefaultSpm) {
        processedEvent.properties.spm = this.business;
      }

      return processedEvent;
    };
  }

  /**
   * Update the business context dynamically
   * This will affect all future events
   */
  updateBusiness(newBusiness: string): void {
    if (!this.isEnabled() || !this.initialized) {
      this.log('Cannot update business: provider not enabled or not initialized');
      return;
    }

    // Note: We can't change the readonly business field, but we could store it in a mutable field
    // For now, log that this feature would need architectural changes
    this.log(`Business update requested: ${newBusiness} (current: ${this.business})`);
    this.log('Note: Dynamic business updates require storing business in a mutable field');
  }

  /**
   * Get current business context
   */
  getCurrentBusiness(): string {
    return this.business;
  }
}
