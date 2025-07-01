import type { AnalyticsEvent } from './types';

/**
 * Base abstract class for analytics providers
 * All analytics implementations should extend this class
 */
export abstract class BaseAnalytics {
  protected readonly debug: boolean;
  protected readonly enabled: boolean;
  protected readonly business: string;

  constructor(config: { business: string; debug?: boolean; enabled?: boolean }) {
    this.debug = config.debug ?? false;
    this.enabled = config.enabled ?? true;
    this.business = config.business;
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

  /**
   * 丰富属性数据，自动处理 spm 前缀
   * 确保无论通过哪种方式调用都会添加 business 前缀
   */
  protected enrichProperties(properties?: Record<string, any>): Record<string, any> {
    const enriched = { ...properties };

    // Add business field for all events
    enriched.business = this.business;

    if (enriched.spm && typeof enriched.spm === 'string' && enriched.spm.trim()) {
      // 检查是否已经是正确的格式，避免重复处理
      if (enriched.spm !== this.business && !enriched.spm.startsWith(`${this.business}.`)) {
        enriched.spm = `${this.business}.${enriched.spm}`;
      }
    } else {
      // 用户没有提供 spm 或 spm 为空，使用 business 作为默认值
      enriched.spm = this.business;
    }

    return enriched;
  }
}
