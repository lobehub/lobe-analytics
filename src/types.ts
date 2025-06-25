/**
 * Lobe Analytics core type definitions
 */
import { PostHogConfig } from 'posthog-js';

// Base event structure
export interface AnalyticsEvent {
  /** Anonymous ID */
  anonymousId?: string;
  /** Event name, recommend using category:action format */
  name: string;
  /** Event properties */
  properties?: Record<string, any>;
  /** Event timestamp */
  timestamp?: Date;
  /** User ID */
  userId?: string;
}

export type Platform = 'web' | 'ios' | 'android' | 'desktop';

// Event context for global data
export interface EventContext {
  [key: string]: any;
  page?: string;
  section?: string;
  session_id?: string;
  user_properties?: Record<string, any>;
}

// Predefined events for type safety
export interface PredefinedEvents {
  // UI interactions
  button_click: {
    // Additional properties
    [key: string]: any;
    button_name: string;
    page?: string;
    section?: string;
    spm?: string; // Allow additional properties
  };

  // Chat interactions
  chat_message_sent: {
    [key: string]: any;
    conversation_id?: string;
    message_length: number;
    model?: string;
    spm?: string; // Allow additional properties
  };

  form_submit: {
    [key: string]: any;
    form_name: string;
    spm?: string;
    success: boolean; // Allow additional properties
  };
  page_view: {
    [key: string]: any;
    page: string;
    referrer?: string;
    spm?: string; // Allow additional properties
  };

  // User actions
  user_login: {
    [key: string]: any;
    method: 'email' | 'oauth' | 'phone';
    spm?: string; // Allow additional properties
  };

  user_paid_success: {
    [key: string]: any;
    amount: number;
    currency: string;
    platform: Platform;
    spm?: string; // Allow additional properties
  };

  user_signup: {
    [key: string]: any;
    method: 'email' | 'oauth' | 'phone';
    source?: string;
    spm?: string; // Allow additional properties
  };
}

// Provider configurations
export interface ProviderConfig {
  debug?: boolean;
  enabled: boolean;
}

export interface PostHogProviderAnalyticsConfig
  extends Partial<Omit<PostHogConfig, 'debug'>>,
    ProviderConfig {
  host?: string;
  key: string;
}

export interface UmamiProviderAnalyticsConfig extends ProviderConfig {
  scriptUrl?: string;
  websiteId: string;
}

export interface GoogleProviderAnalyticsConfig extends ProviderConfig {
  measurementId: string;
}

// Main analytics configuration
export interface AnalyticsConfig {
  business: string;
  debug?: boolean;
  providers: {
    ga?: GoogleProviderAnalyticsConfig;
    posthog?: PostHogProviderAnalyticsConfig;
    umami?: UmamiProviderAnalyticsConfig;
    // add more providers here
  };
}

// Provider type mapping for type-safe provider access
export interface ProviderTypeMap {
  posthog: import('./providers/posthog').PostHogAnalyticsProvider;
  // Add more providers as they are implemented
  // umami: import('./providers/umami').UmamiAnalyticsProvider;
  // ga: import('./providers/ga').GoogleAnalyticsProvider;
}
