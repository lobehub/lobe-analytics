// React hooks for Analytics integration
// Note: React is a peer dependency
import { useCallback } from 'react';

import type { AnalyticsEvent, PredefinedEvents } from '@/types';

export type AnalyticsManager = import('../manager').AnalyticsManager;

/**
 * Analytics Hook
 * Provides core analytics functionality
 *
 * @param manager User-created AnalyticsManager instance
 * @example
 * ```typescript
 * const analytics = createAnalytics({ ... });
 * await analytics.initialize();
 *
 * function MyComponent() {
 *   const { track, identify } = useAnalytics(analytics);
 *   // ...
 * }
 * ```
 */
export function useAnalytics(manager: AnalyticsManager) {
  const track = useCallback((event: AnalyticsEvent) => manager.track(event), [manager]);

  const trackEvent = useCallback(
    <K extends keyof PredefinedEvents>(eventName: K, properties: PredefinedEvents[K]) =>
      manager.trackEvent(eventName, properties),
    [manager],
  );

  const identify = useCallback(
    (userId: string, properties?: Record<string, any>) => manager.identify(userId, properties),
    [manager],
  );

  const trackPageView = useCallback(
    (page: string, properties?: Record<string, any>) => manager.trackPageView(page, properties),
    [manager],
  );

  const reset = useCallback(() => manager.reset(), [manager]);

  return {
    identify,
    reset,
    track,
    trackEvent,
    trackPageView,
  };
}

/**
 * Event Tracking Hook
 * Provides convenient event tracking methods
 */
export function useEventTracking(manager: AnalyticsManager) {
  const { trackEvent } = useAnalytics(manager);

  const trackButtonClick = useCallback(
    (buttonName: string, context?: Record<string, any>) =>
      trackEvent('button_click', { button_name: buttonName, ...context }),
    [trackEvent],
  );

  const trackFormSubmit = useCallback(
    (formName: string, success: boolean) =>
      manager.track({
        name: 'form_submit',
        properties: { form_name: formName, success },
      }),
    [manager],
  );

  const trackUserSignup = useCallback(
    (spm?: string, extraProperties?: Record<string, any>) =>
      trackEvent('user_signup', { spm, ...extraProperties }),
    [trackEvent],
  );

  const trackUserLogin = useCallback(
    (spm?: string, extraProperties?: Record<string, any>) =>
      trackEvent('user_login', { spm, ...extraProperties }),
    [trackEvent],
  );

  return {
    trackButtonClick,
    trackFormSubmit,
    trackUserLogin,
    trackUserSignup,
  };
}

/**
 * 页面浏览追踪 Hook
 * 自动在组件挂载时追踪页面浏览
 *
 * @param manager 用户创建的 AnalyticsManager 实例
 * @param page 页面路径
 * @param properties 页面属性
 */
export function usePageTracking(
  manager: AnalyticsManager,
  page: string,
  properties?: Record<string, any>,
) {
  const { trackPageView } = useAnalytics(manager);

  // 注意：在库中我们不自动调用 useEffect
  // 而是返回追踪函数，让用户决定何时调用
  return useCallback(() => {
    trackPageView(page, properties);
  }, [trackPageView, page, properties]);
}
