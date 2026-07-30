// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';

import { GoogleAnalyticsProvider } from './ga4';

const measurementId = 'G-TEST123';
const disableFlag = `ga-disable-${measurementId}`;

const getQueuedCommands = (): unknown[][] =>
  ((window as Window & { dataLayer?: IArguments[] }).dataLayer ?? []).map((args) =>
    Array.from(args),
  );

describe('GoogleAnalyticsProvider', () => {
  beforeEach(() => {
    document.head.innerHTML = '';
    delete (window as Window & { dataLayer?: IArguments[] }).dataLayer;
    delete (window as Window & { gtag?: unknown }).gtag;
    Reflect.deleteProperty(window, disableFlag);
  });

  it('prevents the Google tag from sending data while capture is disabled', async () => {
    const provider = new GoogleAnalyticsProvider(
      {
        enabled: true,
        measurementId,
      },
      'test',
    );

    provider.setCaptureEnabled(false);
    await provider.initialize();
    await provider.track({ name: 'private_event' });

    expect(Reflect.get(window, disableFlag)).toBe(true);
    expect(getQueuedCommands()).toContainEqual([
      'config',
      measurementId,
      expect.objectContaining({ send_page_view: false }),
    ]);
    expect(getQueuedCommands().some(([command]) => command === 'event')).toBe(false);

    provider.setCaptureEnabled(true);

    expect(Reflect.get(window, disableFlag)).toBe(false);
    expect(
      getQueuedCommands().filter(([command, id]) => command === 'config' && id === measurementId),
    ).toHaveLength(2);
  });

  it('does not send another automatic page view after capture resumes', async () => {
    const provider = new GoogleAnalyticsProvider(
      {
        enabled: true,
        measurementId,
      },
      'test',
    );

    await provider.initialize();
    provider.setCaptureEnabled(false);
    provider.setCaptureEnabled(true);

    expect(
      getQueuedCommands().filter(([command, id]) => command === 'config' && id === measurementId),
    ).toHaveLength(1);
  });
});
