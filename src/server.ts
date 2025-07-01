/**
 * Server-side analytics entry point
 * Includes all providers including posthog-node for server environments
 */
import { AnalyticsManager } from './manager';
import { PostHogAnalyticsProvider } from './providers/posthog';
import { PostHogNodeAnalyticsProvider } from './providers/posthog-node';
import type { AnalyticsConfig } from './types';

// Re-export selective items from main entry
export { AnalyticsManager } from './manager';
export { PostHogAnalyticsProvider } from './providers/posthog';
export { PostHogNodeAnalyticsProvider } from './providers/posthog-node';

// Re-export types
export type * from './types';

// Re-export named global utilities (NOT singleton functions to avoid confusion)
export {
  clearGlobalAnalytics,
  getGlobalAnalytics,
  getGlobalAnalyticsNames,
  getGlobalAnalyticsOptional,
  hasGlobalAnalytics,
  removeGlobalAnalytics,
  setGlobalAnalytics,
} from './global';

// NOTE: createSingletonAnalytics and related functions are NOT re-exported
// because they use createAnalytics() which doesn't support posthog-node.
// Use createSingletonServerAnalytics() instead for server-side singleton.

/**
 * Create server analytics with full provider support including posthog-node
 */
export function createServerAnalytics(config: AnalyticsConfig): AnalyticsManager {
  const manager = new AnalyticsManager(config.business, config.debug);

  // Register PostHog browser if enabled
  if (config.providers.posthog?.enabled) {
    const provider = new PostHogAnalyticsProvider(config.providers.posthog, config.business);
    manager.registerProvider('posthog', provider);
  }

  // Register PostHog Node.js if enabled (server-side)
  if (config.providers.posthogNode?.enabled) {
    const provider = new PostHogNodeAnalyticsProvider(
      config.providers.posthogNode,
      config.business,
    );
    manager.registerProvider('posthogNode', provider);
  }

  // Add other providers here as they are implemented
  // if (config.providers.umami?.enabled) { ... }
  // if (config.providers.ga?.enabled) { ... }

  return manager;
}

// ============================================
// Server Entry Point Philosophy
// ============================================
//
// 🎯 Keep it simple: Just provide createServerAnalytics()
// 🚀 Let users manage instances however they prefer:
//    - Direct instantiation
//    - Module-level exports
//    - Dependency injection
//    - Custom singleton patterns
//
// Example user patterns:
//
// 1️⃣ Module export pattern:
//    export const analytics = createServerAnalytics(config);
//
// 2️⃣ Lazy initialization:
//    let _analytics: AnalyticsManager | null = null;
//    export const getAnalytics = () => _analytics ??= createServerAnalytics(config);
//
// 3️⃣ Class-based DI:
//    class AnalyticsService {
//      constructor() {
//        this.analytics = createServerAnalytics(config);
//      }
//    }
//
// 💡 This approach gives maximum flexibility while keeping the API minimal!
