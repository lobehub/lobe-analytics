// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { XAdsAnalyticsProvider } from './xads';

const getQueuedCommands = () => {
  return ((window.twq?.queue ?? []) as unknown[][]).map((args) => [...args]);
};

describe('XAdsAnalyticsProvider', () => {
  beforeEach(() => {
    document.head.innerHTML = '';
    vi.restoreAllMocks();

    delete window.twq;
    delete window.__LOBE_ANALYTICS_X_ADS_STATE__;
  });

  it('should initialize X Ads only once', async () => {
    const provider = new XAdsAnalyticsProvider(
      {
        debug: true,
        enabled: true,
        pixelId: 'tw-pixel_123',
        purchaseEventId: 'tw-pixel_123-purchase_456',
      },
      'test',
    );

    await provider.initialize();
    await provider.initialize();

    const scripts = document.querySelectorAll(
      'script[src="https://static.ads-twitter.com/uwt.js"]',
    );
    const queuedCommands = getQueuedCommands();
    const configCommands = queuedCommands.filter(([command]) => command === 'config');

    expect(scripts).toHaveLength(1);
    expect(configCommands).toEqual([['config', 'tw-pixel_123']]);
  });

  it('should track purchase events with mapped parameters', async () => {
    const provider = new XAdsAnalyticsProvider(
      {
        enabled: true,
        pixelId: 'tw-pixel_123',
        purchaseEventId: 'tw-pixel_123-purchase_456',
      },
      'test',
    );

    await provider.initialize();
    await provider.track({
      name: 'purchase',
      properties: {
        currency: 'USD',
        items: [
          {
            item_id: 'plan_pro',
            item_name: 'Pro Plan',
            price: 29.9,
            quantity: 1,
          },
        ],
        transaction_id: 'sub_123',
        value: 29.9,
      },
    });

    const queuedCommands = getQueuedCommands();
    const purchaseCommand = queuedCommands.find(
      ([command, eventId]) => command === 'event' && eventId === 'tw-pixel_123-purchase_456',
    );

    expect(purchaseCommand).toEqual([
      'event',
      'tw-pixel_123-purchase_456',
      {
        contents: [
          {
            content_id: 'plan_pro',
            content_name: 'Pro Plan',
            content_price: 29.9,
            num_items: 1,
          },
        ],
        conversion_id: 'sub_123',
        currency: 'USD',
        value: 29.9,
      },
    ]);
  });

  it('should normalize currency codes before tracking purchase events', async () => {
    const provider = new XAdsAnalyticsProvider(
      {
        enabled: true,
        pixelId: 'tw-pixel_123',
        purchaseEventId: 'tw-pixel_123-purchase_456',
      },
      'test',
    );

    await provider.initialize();
    await provider.track({
      name: 'purchase',
      properties: {
        currency: 'usd',
        transaction_id: 'sub_123',
        value: 29.9,
      },
    });

    const queuedCommands = getQueuedCommands();
    const purchaseCommand = queuedCommands.find(
      ([command, eventId]) => command === 'event' && eventId === 'tw-pixel_123-purchase_456',
    );

    expect(purchaseCommand).toEqual([
      'event',
      'tw-pixel_123-purchase_456',
      {
        conversion_id: 'sub_123',
        currency: 'USD',
        value: 29.9,
      },
    ]);
  });

  it('should skip purchase tracking when purchaseEventId is missing', async () => {
    const provider = new XAdsAnalyticsProvider(
      {
        enabled: true,
        pixelId: 'tw-pixel_123',
      },
      'test',
    );

    await provider.initialize();
    await provider.track({
      name: 'purchase',
      properties: {
        currency: 'USD',
        transaction_id: 'sub_123',
        value: 29.9,
      },
    });

    const queuedCommands = getQueuedCommands();
    const purchaseCommands = queuedCommands.filter(([command]) => command === 'event');

    expect(purchaseCommands).toHaveLength(0);
  });

  it('should track configured custom events', async () => {
    const provider = new XAdsAnalyticsProvider(
      {
        eventIds: {
          login_or_signup_clicked: 'tw-pixel_123-custom_789',
          main_page_view: 'tw-pixel_123-custom_999',
        },
        enabled: true,
        pixelId: 'tw-pixel_123',
      },
      'test',
    );

    await provider.initialize();
    await provider.track({
      name: 'main_page_view',
      properties: {
        spm: 'main_page.interface.view',
      },
    });
    await provider.track({
      name: 'login_or_signup_clicked',
      properties: {
        spm: 'homepage.login_or_signup.click',
      },
    });

    const queuedCommands = getQueuedCommands();
    const eventCommands = queuedCommands.filter(([command]) => command === 'event');

    expect(eventCommands).toEqual([
      ['event', 'tw-pixel_123-custom_999'],
      ['event', 'tw-pixel_123-custom_789'],
    ]);
  });

  it('should skip unconfigured custom events', async () => {
    const provider = new XAdsAnalyticsProvider(
      {
        enabled: true,
        pixelId: 'tw-pixel_123',
        purchaseEventId: 'tw-pixel_123-purchase_456',
      },
      'test',
    );

    await provider.initialize();
    await provider.track({
      name: 'main_page_view',
      properties: {
        spm: 'main_page.interface.view',
      },
    });

    const queuedCommands = getQueuedCommands();
    const eventCommands = queuedCommands.filter(([command]) => command === 'event');

    expect(eventCommands).toHaveLength(0);
  });

  it('should no-op when pixelId is missing', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const provider = new XAdsAnalyticsProvider(
      {
        enabled: true,
        pixelId: '',
        purchaseEventId: 'tw-pixel_123-purchase_456',
      },
      'test',
    );

    await provider.initialize();

    expect(
      document.querySelector('script[src="https://static.ads-twitter.com/uwt.js"]'),
    ).toBeNull();
    expect(window.twq).toBeUndefined();
    expect(errorSpy).toHaveBeenCalledWith('[X Ads] X Ads pixelId is required', '');
  });
});
