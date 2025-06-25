/**
 * 全局实例管理示例
 *
 * 展示如何使用全局实例管理功能，在应用的任何地方访问 Analytics 实例
 */
import {
  createAnalytics,
  getGlobalAnalytics,
  getGlobalAnalyticsOptional,
  hasGlobalAnalytics,
  setGlobalAnalytics,
} from '../src';

// ====== 基本使用方式 ======

// 1. 创建并注册全局实例
const analytics = createAnalytics({
  business: '',
  debug: true,
  providers: {
    posthog: {
      debug: true,
      enabled: true,
      host: 'https://app.posthog.com',
      key: 'phc_your_key_here',
    },
  },
});

// 注册为全局实例
setGlobalAnalytics(analytics);

// ====== 在其他文件中使用 ======

// 在任何其他文件中，都可以直接获取实例
export function trackUserAction() {
  const analytics = getGlobalAnalytics();
  analytics.track({
    name: 'user_action',
    properties: { action_type: 'click' },
  });
}

// 安全的可选获取（不会抛出错误）
export function optionalTracking() {
  const analytics = getGlobalAnalyticsOptional();
  if (analytics) {
    analytics.track({
      name: 'optional_event',
      properties: { source: 'optional' },
    });
  }
}

// 检查实例是否存在
export function conditionalTracking() {
  if (hasGlobalAnalytics()) {
    const analytics = getGlobalAnalytics();
    analytics.track({
      name: 'conditional_event',
    });
  }
}

// ====== 命名空间使用 ======

// 注册多个命名实例
const mainAnalytics = createAnalytics({
  business: '',
  debug: true,
  providers: {
    posthog: {
      enabled: true,
      host: 'https://main.posthog.com',
      key: 'main_key',
    },
  },
});

const adminAnalytics = createAnalytics({
  business: '',
  debug: true,
  providers: {
    posthog: {
      enabled: true,
      host: 'https://admin.posthog.com',
      key: 'admin_key',
    },
  },
});

// 注册到不同命名空间
setGlobalAnalytics(mainAnalytics, 'main');
setGlobalAnalytics(adminAnalytics, 'admin');

// 使用特定命名空间的实例
export function trackMainEvent() {
  const analytics = getGlobalAnalytics('main');
  analytics.track({ name: 'main_event' });
}

export function trackAdminEvent() {
  const analytics = getGlobalAnalytics('admin');
  analytics.track({ name: 'admin_event' });
}

// ====== 初始化示例 ======

export async function initializeGlobalAnalytics() {
  try {
    // 创建实例
    const analytics = createAnalytics({
      business: '',
      debug: process.env.NODE_ENV === 'development',
      providers: {
        posthog: {
          enabled: true,
          host: process.env.POSTHOG_HOST || 'https://app.posthog.com',
          key: process.env.POSTHOG_KEY!,
        },
      },
    });

    // 初始化
    await analytics.initialize();

    // 注册为全局实例
    setGlobalAnalytics(analytics);

    console.log('Global analytics initialized successfully');

    return analytics;
  } catch (error) {
    console.error('Failed to initialize global analytics:', error);
    throw error;
  }
}

// ====== 使用示例 ======

// 在应用启动时初始化
// eslint-disable-next-line unicorn/prefer-top-level-await
initializeGlobalAnalytics().then(() => {
  // 现在可以在任何地方使用全局实例
  trackUserAction();
  optionalTracking();
  conditionalTracking();
});
