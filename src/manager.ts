import { BaseAnalytics } from './base';
import type { AnalyticsEvent, EventContext, PredefinedEvents } from './types';

/**
 * Analytics 管理器
 * 统一管理多个分析工具提供商
 */
export class AnalyticsManager {
  private readonly providers = new Map<string, BaseAnalytics>();
  private globalContext: EventContext = {};
  private initialized = false;
  private readonly debug: boolean;

  constructor(debug = false) {
    this.debug = debug;
  }

  /**
   * 注册分析工具提供商
   */
  registerProvider(name: string, provider: BaseAnalytics): this {
    this.providers.set(name, provider);
    this.log(`Registered provider: ${name}`);
    return this;
  }

  /**
   * 移除分析工具提供商
   */
  unregisterProvider(name: string): this {
    this.providers.delete(name);
    this.log(`Unregistered provider: ${name}`);
    return this;
  }

  /**
   * 获取指定的提供商
   */
  getProvider(name: string): BaseAnalytics | undefined {
    return this.providers.get(name);
  }

  /**
   * 获取所有提供商
   */
  getAllProviders(): BaseAnalytics[] {
    return Array.from(this.providers.values());
  }

  /**
   * 初始化所有提供商
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      this.log('Already initialized');
      return;
    }

    const results = await this.executeOnAllProviders('initialize');
    this.initialized = true;

    this.log(`Initialized ${results.success.length}/${this.providers.size} providers`);
    if (results.errors.length > 0) {
      console.warn(`[AnalyticsManager] ${results.errors.length} providers failed to initialize`);
    }
  }

  /**
   * 追踪事件到所有提供商
   */
  async track(event: AnalyticsEvent): Promise<void> {
    if (!this.ensureInitialized()) return;

    const enrichedEvent = this.enrichEvent(event);
    await this.executeOnAllProviders('track', enrichedEvent);
  }

  /**
   * 类型安全的事件追踪
   */
  async trackEvent<K extends keyof PredefinedEvents>(
    eventName: K,
    properties: PredefinedEvents[K],
  ): Promise<void> {
    await this.track({
      name: eventName,
      properties: properties as Record<string, any>,
    });
  }

  /**
   * 识别用户
   */
  async identify(userId: string, properties?: Record<string, any>): Promise<void> {
    if (!this.ensureInitialized()) return;
    await this.executeOnAllProviders('identify', userId, properties);
  }

  /**
   * 追踪页面浏览
   */
  async trackPageView(page: string, properties?: Record<string, any>): Promise<void> {
    if (!this.ensureInitialized()) return;
    await this.executeOnAllProviders('trackPageView', page, properties);
  }

  /**
   * 重置用户身份
   */
  async reset(): Promise<void> {
    if (!this.ensureInitialized()) return;
    await this.executeOnAllProviders('reset');
  }

  /**
   * 设置全局上下文
   */
  setGlobalContext(context: EventContext): this {
    this.globalContext = { ...this.globalContext, ...context };
    this.log('Updated global context', this.globalContext);
    return this;
  }

  /**
   * 获取全局上下文
   */
  getGlobalContext(): EventContext {
    return { ...this.globalContext };
  }

  /**
   * 获取管理器状态
   */
  getStatus(): { initialized: boolean; providersCount: number } {
    return {
      initialized: this.initialized,
      providersCount: this.providers.size,
    };
  }

  /**
   * 检查是否已初始化
   */
  private ensureInitialized(): boolean {
    if (!this.initialized) {
      console.warn('[AnalyticsManager] Not initialized. Call initialize() first.');
      return false;
    }
    return true;
  }

  /**
   * 在所有提供商上执行操作
   */
  private async executeOnAllProviders(
    method: keyof BaseAnalytics,
    ...args: any[]
  ): Promise<{ errors: Array<{ error: any; provider: string }>; success: string[] }> {
    const results: { errors: Array<{ error: any; provider: string }>; success: string[] } = {
      errors: [],
      success: [],
    };

    const promises = Array.from(this.providers.entries()).map(async ([name, provider]) => {
      try {
        await (provider[method] as any)(...args);
        results.success.push(name);
      } catch (error) {
        results.errors.push({ error, provider: name });
        console.error(
          `[AnalyticsManager] ${method} failed for ${provider.getProviderName()}:`,
          error,
        );
      }
    });

    await Promise.allSettled(promises);
    return results;
  }

  /**
   * 丰富事件数据
   */
  private enrichEvent(event: AnalyticsEvent): AnalyticsEvent {
    return {
      ...event,
      properties: {
        ...this.globalContext,
        ...event.properties,
      },
      timestamp: event.timestamp || new Date(),
    };
  }

  /**
   * 记录日志
   */
  private log(message: string, data?: any): void {
    if (this.debug) {
      console.log(`[AnalyticsManager] ${message}`, data || '');
    }
  }
}
