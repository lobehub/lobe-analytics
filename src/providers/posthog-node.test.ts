import { beforeEach, describe, expect, it, vi } from 'vitest';

import { PostHogNodeAnalyticsProvider } from './posthog-node';

const { getFeatureFlag, isFeatureEnabled } = vi.hoisted(() => ({
  getFeatureFlag: vi.fn(),
  isFeatureEnabled: vi.fn(),
}));

vi.mock('posthog-node', () => ({
  PostHog: class {
    getFeatureFlag = getFeatureFlag;
    isFeatureEnabled = isFeatureEnabled;
  },
}));

describe('PostHogNodeAnalyticsProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('suppresses feature flag events while capture is disabled', async () => {
    const provider = new PostHogNodeAnalyticsProvider(
      {
        enabled: true,
        key: 'test-key',
      },
      'test',
    );
    const groups = { company: 'company-id' };

    provider.setCaptureEnabled(false);
    await provider.initialize();
    await provider.isFeatureEnabled('enabled-flag', 'user-id', groups);
    await provider.getFeatureFlag('variant-flag', 'user-id', groups);

    expect(isFeatureEnabled).toHaveBeenCalledWith('enabled-flag', 'user-id', {
      groups,
      sendFeatureFlagEvents: false,
    });
    expect(getFeatureFlag).toHaveBeenCalledWith('variant-flag', 'user-id', {
      groups,
      sendFeatureFlagEvents: false,
    });

    provider.setCaptureEnabled(true);
    await provider.getFeatureFlag('variant-flag', 'user-id', groups);

    expect(getFeatureFlag).toHaveBeenLastCalledWith('variant-flag', 'user-id', {
      groups,
      sendFeatureFlagEvents: true,
    });
  });
});
