import { BaseAnalytics } from '@/base';
import type { AnalyticsEvent, XAdsProviderAnalyticsConfig } from '@/types';

const X_ADS_SCRIPT_SELECTOR = 'script[src="https://static.ads-twitter.com/uwt.js"]';
const X_ADS_SCRIPT_SRC = 'https://static.ads-twitter.com/uwt.js';

interface XAdsContentItem {
  content_id?: string;
  content_name?: string;
  content_price?: number;
  num_items?: number;
}

interface XAdsEventParameters {
  contents?: XAdsContentItem[];
  conversion_id?: string;
  currency?: string;
  value?: number;
}

interface XAdsFunction {
  (...args: unknown[]): void;
  exe?: (...args: unknown[]) => void;
  queue?: unknown[][];
  version?: string;
}

interface XAdsGlobalState {
  configuredPixelIds: Set<string>;
  scriptRequested: boolean;
}

declare global {
  interface Window {
    __LOBE_ANALYTICS_X_ADS_STATE__?: XAdsGlobalState;
    twq?: XAdsFunction;
  }
}

/**
 * X Ads Analytics Provider
 * Uses X Pixel (twq + uwt.js) for client-side conversion tracking
 */
export class XAdsAnalyticsProvider extends BaseAnalytics {
  private readonly config: XAdsProviderAnalyticsConfig;
  private initialized = false;

  constructor(config: XAdsProviderAnalyticsConfig, business: string) {
    super({ business, debug: config.debug, enabled: config.enabled });
    this.config = config;
  }

  getProviderName(): string {
    return 'X Ads';
  }

  async initialize(): Promise<void> {
    if (!this.isEnabled() || this.initialized) {
      return;
    }

    if (typeof window === 'undefined') {
      this.logError('X Ads provider requires browser environment');
      return;
    }

    if (!this.config.pixelId) {
      this.logError('X Ads pixelId is required');
      return;
    }

    try {
      const twq = this.ensureTwq();
      const state = this.getGlobalState();

      this.ensureScript(state);

      if (!state.configuredPixelIds.has(this.config.pixelId)) {
        twq('config', this.config.pixelId);
        state.configuredPixelIds.add(this.config.pixelId);
      }

      this.initialized = true;
      this.log('X Ads initialized successfully');
      this.log(`Pixel ID: ${this.config.pixelId}`);
    } catch (error) {
      this.logError('Failed to initialize X Ads', error);
      throw error;
    }
  }

  async track(event: AnalyticsEvent): Promise<void> {
    if (!this.isEnabled() || !this.initialized || !this.validateEvent(event)) {
      return;
    }

    const eventId = this.getEventId(event.name);
    if (!eventId) {
      this.log(`Skipping event: ${event.name} is not configured for X Ads`);
      return;
    }

    const twq = window.twq;
    if (!twq) {
      this.logError('twq function not available');
      return;
    }

    try {
      const eventParams = this.getEventParameters(event);

      if (eventParams) {
        twq('event', eventId, eventParams);
      } else {
        twq('event', eventId);
      }

      this.log(`Tracked event: ${event.name}`, {
        event: event.name,
        eventId,
        ...eventParams,
      });
    } catch (error) {
      this.logError(`Failed to track event: ${event.name}`, error);
    }
  }

  async identify(): Promise<void> {
    this.log('Identify is not supported in X Ads provider');
  }

  async trackPageView(): Promise<void> {
    this.log('Page views are handled by the X Pixel base code');
  }

  async reset(): Promise<void> {
    this.log('Reset is not supported in X Ads provider');
  }

  private ensureScript(state: XAdsGlobalState) {
    if (state.scriptRequested || document.querySelector(X_ADS_SCRIPT_SELECTOR)) {
      state.scriptRequested = true;
      return;
    }

    const script = document.createElement('script');
    script.async = true;
    script.src = X_ADS_SCRIPT_SRC;
    document.head.append(script);

    state.scriptRequested = true;
  }

  private ensureTwq(): XAdsFunction {
    if (window.twq) {
      return window.twq;
    }

    const twq: XAdsFunction = (...args: unknown[]) => {
      if (twq.exe) {
        twq.exe(...args);
        return;
      }

      const queue = twq.queue || [];
      queue.push(args);
      twq.queue = queue;
    };

    twq.version = '1.1';
    twq.queue = [];

    window.twq = twq;

    return twq;
  }

  private getGlobalState(): XAdsGlobalState {
    if (!window.__LOBE_ANALYTICS_X_ADS_STATE__) {
      window.__LOBE_ANALYTICS_X_ADS_STATE__ = {
        configuredPixelIds: new Set<string>(),
        scriptRequested: false,
      };
    }

    return window.__LOBE_ANALYTICS_X_ADS_STATE__;
  }

  private getEventId(eventName: string): string | undefined {
    if (eventName === 'purchase') {
      return this.config.purchaseEventId ?? this.config.eventIds?.[eventName];
    }

    return this.config.eventIds?.[eventName];
  }

  private getEventParameters(event: AnalyticsEvent): XAdsEventParameters | undefined {
    if (event.name === 'purchase') {
      return this.mapPurchaseEventParameters(event.properties);
    }

    return undefined;
  }

  private mapPurchaseEventParameters(properties?: Record<string, unknown>): XAdsEventParameters {
    const eventParams: XAdsEventParameters = {};

    const currency = properties?.currency;
    if (typeof currency === 'string' && currency.trim()) {
      eventParams.currency = currency.trim().toUpperCase();
    }

    const value = this.toFiniteNumber(properties?.value);
    if (value !== undefined) {
      eventParams.value = value;
    }

    const transactionId = properties?.transaction_id;
    if (typeof transactionId === 'string' || typeof transactionId === 'number') {
      eventParams.conversion_id = String(transactionId);
    }

    const contents = this.mapContents(properties?.items);
    if (contents.length > 0) {
      eventParams.contents = contents;
    }

    return eventParams;
  }

  private mapContents(items: unknown): XAdsContentItem[] {
    if (!Array.isArray(items)) {
      return [];
    }

    const contents = items
      .map((item) => {
        if (!item || typeof item !== 'object') {
          return null;
        }

        const content = item as Record<string, unknown>;
        const contentItem: XAdsContentItem = {};
        const contentPrice = this.toFiniteNumber(content.price);
        const numItems = this.toFiniteNumber(content.quantity);

        if (typeof content.item_id === 'string' && content.item_id.trim()) {
          contentItem.content_id = content.item_id;
        }

        if (typeof content.item_name === 'string' && content.item_name.trim()) {
          contentItem.content_name = content.item_name;
        }

        if (contentPrice !== undefined) {
          contentItem.content_price = contentPrice;
        }

        if (numItems !== undefined) {
          contentItem.num_items = numItems;
        }

        return Object.keys(contentItem).length > 0 ? contentItem : null;
      })
      .filter((content): content is XAdsContentItem => content !== null);

    return contents;
  }

  private toFiniteNumber(value: unknown): number | undefined {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === 'string' && value.trim()) {
      const parsed = Number(value);

      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }

    return undefined;
  }
}
