// React Provider & Hooks
export {
  AnalyticsProvider,
  useAnalytics,
  useAnalyticsOptional,
  useAnalyticsState,
} from './provider';

// Legacy Hooks (for backward compatibility)
export { useEventTracking } from './hooks';

// Re-export types that are commonly used with hooks
export type { AnalyticsManager } from '../manager';
export type { AnalyticsEvent, PredefinedEvents } from '../types';
