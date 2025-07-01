// 🔥 服务端使用模式 - 用户自己管理实例
import { createServerAnalytics } from '@lobehub/analytics/server';

// ===============================
// 🎯 模式1: 直接导出（推荐）
// ===============================

export const analytics = createServerAnalytics({
  business: 'my-server-app',
  providers: {
    posthog: {
      api_host: 'https://app.posthog.com',
      enabled: true,
      key: process.env.POSTHOG_CLIENT_KEY!,
    },
    posthogNode: {
      enabled: true,
      host: 'https://app.posthog.com',
      key: process.env.POSTHOG_SERVER_KEY!,
    },
  },
});

// 在其他模块中：import { analytics } from './analytics';

// ===============================
// 🎯 模式2: 懒加载单例
// ===============================

let _analytics: ReturnType<typeof createServerAnalytics> | null = null;

export function getAnalytics() {
  if (!_analytics) {
    _analytics = createServerAnalytics({
      business: 'my-app',
      providers: {
        posthogNode: {
          enabled: true,
          key: process.env.POSTHOG_KEY!,
        },
      },
    });
  }
  return _analytics;
}

// ===============================
// 🎯 模式3: 类服务模式
// ===============================

export class AnalyticsService {
  private analytics = createServerAnalytics({
    business: 'my-app',
    providers: {
      posthogNode: { enabled: true, key: process.env.POSTHOG_KEY! },
    },
  });

  trackEvent(name: string, properties?: Record<string, any>) {
    return this.analytics.track({ name, properties });
  }

  identify(userId: string, properties?: Record<string, any>) {
    return this.analytics.identify(userId, properties);
  }
}

// ===============================
// 🎯 模式4: Express.js 中间件模式
// ===============================

// 创建专用分析实例
const requestAnalytics = createServerAnalytics({
  business: 'my-api',
  providers: {
    posthogNode: {
      enabled: true,
      key: process.env.POSTHOG_API_KEY!,
    },
  },
});

export function analyticsMiddleware(req: any, res: any, next: any) {
  const startTime = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - startTime;

    requestAnalytics.track({
      name: 'api_request',
      properties: {
        duration,
        method: req.method,
        path: req.path,
        status_code: res.statusCode,
        success: res.statusCode < 400,
      },
    });
  });

  next();
}

// ===============================
// 💡 为什么不提供内置 Singleton？
// ===============================

// ✅ 简洁性 - 减少 API 复杂度
// ✅ 灵活性 - 用户可以选择最适合的模式
// ✅ 控制权 - 用户完全控制实例生命周期
// ✅ 可测试性 - 更容易 mock 和测试
// ✅ 架构适应性 - 适应不同的服务端架构

console.log('📝 服务端模式：简单直接，用户自主选择！');
