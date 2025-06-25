// React Provider & Hooks
export {
  AnalyticsProvider,
  useAnalytics,
  useAnalyticsOptional,
  useAnalyticsState,
  useAnalyticsStrict,
} from './provider';

// Legacy Hooks (for backward compatibility)
export { useEventTracking } from './hooks';

// Global Instance Management (Re-export for convenience)
export {
  getGlobalAnalytics,
  getGlobalAnalyticsOptional,
  getSingletonAnalytics,
  getSingletonAnalyticsOptional,
} from '../global';

// Re-export types that are commonly used with hooks
export type { AnalyticsManager } from '../manager';
export type { AnalyticsEvent, PredefinedEvents } from '../types';
