import { posthog } from 'posthog-js';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { PostHogAnalyticsProvider } from './posthog';

vi.mock('posthog-js', () => ({
  posthog: {
    init: vi.fn(),
  },
}));

describe('PostHogAnalyticsProvider', () => {
  const init = vi.mocked(posthog.init);

  beforeEach(() => {
    init.mockClear();
  });

  it('defaults pageview capture to history changes for SPA navigation', async () => {
    const provider = new PostHogAnalyticsProvider(
      {
        enabled: true,
        key: 'test-key',
      },
      'test',
    );

    await provider.initialize();

    expect(init).toHaveBeenCalledWith(
      'test-key',
      expect.objectContaining({
        capture_pageview: 'history_change',
      }),
    );
  });

  it('keeps an explicit pageview capture override', async () => {
    const provider = new PostHogAnalyticsProvider(
      {
        capture_pageview: false,
        enabled: true,
        key: 'test-key',
      },
      'test',
    );

    await provider.initialize();

    expect(init).toHaveBeenCalledWith(
      'test-key',
      expect.objectContaining({
        capture_pageview: false,
      }),
    );
  });
});
