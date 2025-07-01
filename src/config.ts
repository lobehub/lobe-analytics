import { AnalyticsManager } from './manager';
import { PostHogAnalyticsProvider } from './providers/posthog';
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

  // Note: posthogNode provider is not available in the client entry point
  // Use '@lobehub/analytics/server' for server-side analytics
  if (config.providers.posthogNode?.enabled) {
    console.warn(
      'PostHog Node.js provider is not available in the client entry point. ' +
        'Please use "@lobehub/analytics/server" for server-side analytics.',
    );
  }

  // Add more providers as they are implemented
  // if (config.providers.umami?.enabled) {
  //   const provider = new UmamiAnalytics(config.providers.umami);
  //   manager.registerProvider('umami', provider);
  // }

  return manager;
}
