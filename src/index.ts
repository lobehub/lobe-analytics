// ====== Lobe Analytics Exports ======

// Core Classes
export { BaseAnalytics } from './base';
export { AnalyticsManager } from './manager';

// Providers
export { PostHogAnalyticsProvider } from './providers/posthog';

// Configuration
export { createAnalytics } from './config';

// Global Instance Management
export {
  clearGlobalAnalytics,
  createSingletonAnalytics,
  getGlobalAnalytics,
  getGlobalAnalyticsNames,
  getGlobalAnalyticsOptional,
  getSingletonAnalytics,
  getSingletonAnalyticsOptional,
  hasGlobalAnalytics,
  hasSingletonAnalytics,
  removeGlobalAnalytics,
  resetSingletonAnalytics,
  setGlobalAnalytics,
} from './global';

// Type Definitions
export type {
  AnalyticsConfig,
  AnalyticsEvent,
  EventContext,
  GoogleProviderAnalyticsConfig,
  PostHogProviderAnalyticsConfig,
  PredefinedEvents,
  ProviderConfig,
  UmamiProviderAnalyticsConfig,
} from './types';

// Default export
export { AnalyticsManager as default } from './manager';
