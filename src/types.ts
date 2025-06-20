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
    button_name: string;
    page?: string;
    section?: string; // Additional properties
  };

  // Chat interactions
  chat_message_sent: {
    conversation_id?: string;
    message_length: number;
    model?: string;
  };

  form_submit: {
    form_name: string;
    success: boolean;
  };
  page_view: {
    page: string;
    referrer?: string;
  };

  // User actions
  user_login: {
    method: 'email' | 'oauth' | 'phone';
  };
  user_signup: {
    method: 'email' | 'oauth' | 'phone';
    source?: string;
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
  debug?: boolean;
  providers: {
    ga?: GoogleProviderAnalyticsConfig;
    posthog?: PostHogProviderAnalyticsConfig;
    umami?: UmamiProviderAnalyticsConfig;
    // add more providers here
  };
}
