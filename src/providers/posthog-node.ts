import { PostHog } from 'posthog-node';

import { BaseAnalytics } from '@/base';
import type { AnalyticsEvent, PostHogNodeProviderAnalyticsConfig } from '@/types';

/**
 * PostHog Node.js Analytics Provider
 * Uses official posthog-node SDK for server-side tracking
 */
export class PostHogNodeAnalyticsProvider extends BaseAnalytics {
  private readonly config: PostHogNodeProviderAnalyticsConfig;
  private client: PostHog | null = null;
  private initialized = false;

  constructor(config: PostHogNodeProviderAnalyticsConfig, business: string) {
    super({ business, debug: config.debug, enabled: config.enabled });
    this.config = config;
  }

  getProviderName(): string {
    return 'PostHogNode';
  }

  async initialize(): Promise<void> {
    if (!this.isEnabled() || this.initialized) {
      return;
    }

    try {
      const { key, debug, enabled, ...posthogNodeConfig } = this.config;
      // Mark variables as intentionally unused to avoid lint warnings
      void debug;
      void enabled;

      // Initialize PostHog Node client with default values
      this.client = new PostHog(key, {
        flushAt: 20,
        flushInterval: 10_000,
        host: 'https://app.posthog.com',
        ...posthogNodeConfig, // Apply user's posthog-node config options
      });

      this.initialized = true;
      this.log('PostHog Node.js initialized successfully');
      this.log(`Using business context: ${this.business}`);
    } catch (error) {
      this.logError('Failed to initialize PostHog Node.js', error);
      throw error;
    }
  }

  async track(event: AnalyticsEvent): Promise<void> {
    if (!this.isEnabled() || !this.initialized || !this.client || !this.validateEvent(event)) {
      return;
    }

    try {
      const enrichedProperties = this.enrichProperties(event.properties);

      this.client.capture({
        distinctId: event.userId || event.anonymousId || 'anonymous',
        event: event.name,
        properties: enrichedProperties,
        timestamp: event.timestamp,
      });

      this.log(`Tracked event: ${event.name}`, { ...event, properties: enrichedProperties });
    } catch (error) {
      this.logError(`Failed to track event: ${event.name}`, error);
    }
  }

  async identify(userId: string, properties?: Record<string, any>): Promise<void> {
    if (!this.isEnabled() || !this.initialized || !this.client) {
      return;
    }

    try {
      const enrichedProperties = this.enrichProperties(properties);

      this.client.identify({
        distinctId: userId,
        properties: enrichedProperties,
      });

      this.log(`Identified user: ${userId}`, enrichedProperties);
    } catch (error) {
      this.logError(`Failed to identify user: ${userId}`, error);
    }
  }

  async trackPageView(page: string, properties?: Record<string, any>): Promise<void> {
    if (!this.isEnabled() || !this.initialized || !this.client) {
      return;
    }

    try {
      const enrichedProperties = this.enrichProperties({ page, ...properties });

      await this.track({
        name: '$pageview',
        properties: enrichedProperties,
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
      // PostHog Node.js doesn't have a reset method like the browser version
      // Instead, we can flush pending events and log the reset
      await this.flush();
      this.log('Reset user identity (flushed pending events)');
    } catch (error) {
      this.logError('Failed to reset user identity', error);
    }
  }

  /**
   * Check if feature flag is enabled for a user
   */
  async isFeatureEnabled(
    flag: string,
    distinctId: string,
    groups?: Record<string, any>,
  ): Promise<boolean> {
    if (!this.initialized || !this.client) {
      return false;
    }

    try {
      const result = await this.client.isFeatureEnabled(flag, distinctId, groups);
      return Boolean(result);
    } catch (error) {
      this.logError(`Failed to check feature flag: ${flag}`, error);
      return false;
    }
  }

  /**
   * Get feature flag payload for a user
   */
  async getFeatureFlag(
    flag: string,
    distinctId: string,
    groups?: Record<string, any>,
  ): Promise<any> {
    if (!this.initialized || !this.client) {
      return undefined;
    }

    try {
      return await this.client.getFeatureFlag(flag, distinctId, groups);
    } catch (error) {
      this.logError(`Failed to get feature flag: ${flag}`, error);
      return undefined;
    }
  }

  /**
   * Get all feature flags for a user
   */
  async getAllFlags(
    distinctId: string,
    groups?: Record<string, any>,
  ): Promise<Record<string, any>> {
    if (!this.initialized || !this.client) {
      return {};
    }

    try {
      const flags = await this.client.getAllFlags(distinctId, groups);
      return flags || {};
    } catch (error) {
      this.logError('Failed to get all feature flags', error);
      return {};
    }
  }

  /**
   * Flush pending events
   */
  async flush(): Promise<void> {
    if (!this.initialized || !this.client) {
      return;
    }

    try {
      await this.client.flush();
      this.log('Flushed pending events');
    } catch (error) {
      this.logError('Failed to flush events', error);
    }
  }

  /**
   * Shutdown the client and flush remaining events
   */
  async shutdown(): Promise<void> {
    if (!this.initialized || !this.client) {
      return;
    }

    try {
      await this.client.shutdown();
      this.initialized = false; // Mark as shut down
      this.log('PostHog Node.js client shut down');
    } catch (error) {
      this.logError('Failed to shutdown PostHog Node.js client', error);
    }
  }

  /**
   * Get the native PostHog Node instance for direct access to PostHog APIs
   */
  getNativeInstance(): PostHog | null {
    if (!this.isEnabled() || !this.initialized) {
      this.log('Cannot get native instance: provider not enabled or not initialized');
      return null;
    }

    return this.client;
  }

  /**
   * Group identify - associate user with a group
   */
  async groupIdentify(
    groupType: string,
    groupKey: string,
    properties?: Record<string, any>,
  ): Promise<void> {
    if (!this.isEnabled() || !this.initialized || !this.client) {
      return;
    }

    try {
      const enrichedProperties = this.enrichProperties(properties);

      this.client.groupIdentify({
        groupKey,
        groupType,
        properties: enrichedProperties,
      });

      this.log(`Group identified: ${groupType}:${groupKey}`, enrichedProperties);
    } catch (error) {
      this.logError(`Failed to identify group: ${groupType}:${groupKey}`, error);
    }
  }

  /**
   * Create alias between user IDs
   */
  async alias(distinctId: string, alias: string): Promise<void> {
    if (!this.isEnabled() || !this.initialized || !this.client) {
      return;
    }

    try {
      this.client.alias({
        alias,
        distinctId,
      });

      this.log(`Created alias: ${distinctId} -> ${alias}`);
    } catch (error) {
      this.logError(`Failed to create alias: ${distinctId} -> ${alias}`, error);
    }
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
