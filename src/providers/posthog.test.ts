import { posthog } from 'posthog-js';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { PostHogAnalyticsProvider } from './posthog';

vi.mock('posthog-js', () => ({
  posthog: {
    capture: vi.fn(),
    init: vi.fn(),
    opt_in_capturing: vi.fn(),
    opt_out_capturing: vi.fn(),
  },
}));

describe('PostHogAnalyticsProvider', () => {
  const capture = vi.mocked(posthog.capture);
  const init = vi.mocked(posthog.init);
  const optInCapturing = vi.mocked(posthog.opt_in_capturing);
  const optOutCapturing = vi.mocked(posthog.opt_out_capturing);

  beforeEach(() => {
    vi.clearAllMocks();
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

  it('starts opted out and suppresses events when capture is disabled', async () => {
    const provider = new PostHogAnalyticsProvider(
      {
        enabled: true,
        key: 'test-key',
      },
      'test',
    );

    provider.setCaptureEnabled(false);
    await provider.initialize();
    await provider.track({ name: 'private_event' });

    expect(init).toHaveBeenCalledWith(
      'test-key',
      expect.objectContaining({
        opt_out_capturing_by_default: true,
        opt_out_persistence_by_default: true,
      }),
    );
    expect(optOutCapturing).toHaveBeenCalledOnce();
    expect(capture).not.toHaveBeenCalled();
  });

  it('synchronizes capture changes with the native PostHog consent API', async () => {
    const provider = new PostHogAnalyticsProvider(
      {
        enabled: true,
        key: 'test-key',
      },
      'test',
    );

    await provider.initialize();
    provider.setCaptureEnabled(false);
    provider.setCaptureEnabled(true);

    expect(optOutCapturing).toHaveBeenCalledOnce();
    expect(optInCapturing).toHaveBeenCalledWith({ captureEventName: false });
  });
});
