import { AnalyticsManager } from './manager';
import { PostHogAnalyticsProvider } from './providers/posthog';
import { PostHogNodeAnalyticsProvider } from './providers/posthog-node';
import type { AnalyticsConfig } from './types';

/**
 * Create a configured Analytics manager with providers
 *
 * @param config Analytics configuration
 * @returns Configured AnalyticsManager instance
 *
 * @example
 * ```typescript
 * const analytics = createAnalytics({
 *   debug: true,
 *   providers: {
 *     posthog: {
 *       enabled: true,
 *       key: 'phc_your_key',
 *       host: 'https://app.posthog.com',
 *     },
 *   },
 * });
 *
 * await analytics.initialize();
 * ```
 */
export function createAnalytics(config: AnalyticsConfig): AnalyticsManager {
  const manager = new AnalyticsManager(config.business, config.debug);

  // Register PostHog if enabled
  if (config.providers.posthog?.enabled) {
    const provider = new PostHogAnalyticsProvider(config.providers.posthog, config.business);
    manager.registerProvider('posthog', provider);
  }

  // Register PostHog Node.js if enabled
  if (config.providers.posthogNode?.enabled) {
    const provider = new PostHogNodeAnalyticsProvider(
      config.providers.posthogNode,
      config.business,
    );
    manager.registerProvider('posthogNode', provider);
  }

  // Add more providers as they are implemented
  // if (config.providers.umami?.enabled) {
  //   const provider = new UmamiAnalytics(config.providers.umami);
  //   manager.registerProvider('umami', provider);
  // }

  return manager;
}
