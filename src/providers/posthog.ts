import { posthog } from 'posthog-js';

import { BaseAnalytics } from '@/base';
import type { AnalyticsEvent, PostHogProviderAnalyticsConfig } from '@/types';

/**
 * PostHog Analytics Provider
 * Uses official posthog-js SDK
 */
export class PostHogAnalyticsProvider extends BaseAnalytics {
  private readonly config: PostHogProviderAnalyticsConfig;
  private initialized = false;

  constructor(config: PostHogProviderAnalyticsConfig) {
    super({ debug: config.debug, enabled: config.enabled });
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
        debug: this.debug,
        loaded: () => this.log('PostHog loaded and ready'),
      };

      posthog.init(key, initConfig);

      this.initialized = true;
      this.log('PostHog initialized successfully');
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
      posthog.capture(event.name, {
        ...event.properties,
        ...(event.userId && { distinct_id: event.userId }),
      });

      this.log(`Tracked event: ${event.name}`, event);
    } catch (error) {
      this.logError(`Failed to track event: ${event.name}`, error);
    }
  }

  async identify(userId: string, properties?: Record<string, any>): Promise<void> {
    if (!this.isEnabled() || !this.initialized) {
      return;
    }

    try {
      posthog.identify(userId, properties);
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
      await this.track({
        name: 'ui:page_view',
        properties: { page, ...properties },
      });

      this.log(`Tracked page view: ${page}`, properties);
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
}
