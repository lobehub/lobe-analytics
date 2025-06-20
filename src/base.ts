import type { AnalyticsEvent } from './types';

/**
 * Base abstract class for analytics providers
 * All analytics implementations should extend this class
 */
export abstract class BaseAnalytics {
  protected readonly debug: boolean;
  protected readonly enabled: boolean;

  constructor(config: { debug?: boolean; enabled?: boolean } = {}) {
    this.debug = config.debug ?? false;
    this.enabled = config.enabled ?? true;
  }

  /**
   * Initialize the analytics provider
   */
  abstract initialize(): Promise<void>;

  /**
   * Track a single event
   */
  abstract track(event: AnalyticsEvent): Promise<void>;

  /**
   * Identify a user
   */
  abstract identify(userId: string, properties?: Record<string, any>): Promise<void>;

  /**
   * Track page view
   */
  abstract trackPageView(page: string, properties?: Record<string, any>): Promise<void>;

  /**
   * Reset user identity
   */
  abstract reset(): Promise<void>;

  /**
   * Get provider name for logging
   */
  abstract getProviderName(): string;

  /**
   * Check if provider is enabled
   */
  protected isEnabled(): boolean {
    if (!this.enabled) {
      this.log('Provider is disabled');
      return false;
    }
    return true;
  }

  /**
   * Validate event data
   */
  protected validateEvent(event: AnalyticsEvent): boolean {
    if (!event.name) {
      this.logError('Event name is required');
      return false;
    }
    return true;
  }

  /**
   * Log debug message
   */
  protected log(message: string, data?: any): void {
    if (this.debug) {
      console.log(`[${this.getProviderName()}] ${message}`, data || '');
    }
  }

  /**
   * Log error message
   */
  protected logError(message: string, error?: any): void {
    console.error(`[${this.getProviderName()}] ${message}`, error || '');
  }
}
