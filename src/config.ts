import { AnalyticsManager } from './manager';
import { GoogleAnalyticsProvider } from './providers/ga4';
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
 *   business: 'myapp',
 *   debug: true,
 *   providers: {
 *     posthog: {
 *       enabled: true,
 *       key: 'phc_your_key',
 *       host: 'https://app.posthog.com',
 *     },
 *     ga4: {
 *       enabled: true,
 *       measurementId: 'G-XXXXXXXXXX',
 *       gtagConfig: {
 *         debug_mode: true,
 *       },
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

  // Register Google Analytics 4 if enabled
  if (config.providers.ga4?.enabled) {
    const provider = new GoogleAnalyticsProvider(config.providers.ga4, config.business);
    manager.registerProvider('ga4', provider);
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
