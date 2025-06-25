'use client';

import { createAnalytics, getGlobalAnalytics } from '@lobehub/analytics';
import {
  AnalyticsProvider,
  useAnalytics,
  useAnalyticsState,
  useAnalyticsStrict,
} from '@lobehub/analytics/react';
import React from 'react';

// ====== Provider 配置 ======

type Props = {
  children: React.ReactNode;
  host: string;
  token: string;
};

export function EnhancedAnalyticsProvider(props: Props) {
  const { host, token, children } = props;

  const analytics = React.useMemo(
    () =>
      createAnalytics({
        business: 'example-app',
        debug: process.env.NODE_ENV === 'development',
        providers: {
          posthog: {
            debug: true,
            enabled: true,
            host,
            key: token,
          },
        },
      }),
    [host, token],
  );

  return (
    <AnalyticsProvider
      client={analytics}
      globalName="main" // 可选：自定义全局实例名称
      registerGlobal={true} // 自动注册为全局实例（默认为 true）
    >
      {children}
    </AnalyticsProvider>
  );
}

// ====== 组件内使用 ======

const analytics = createAnalytics({
  business: 'example-app',
  debug: true,
  providers: {
    posthog: {
      enabled: true,
      host: 'https://app.posthog.com',
      key: 'phc_your_posthog_key',
    },
  },
});

// 示例1：安全的方式使用 Analytics（推荐）
function SafeComponent() {
  const { analytics, isReady, isInitializing, error } = useAnalytics();

  if (isInitializing) {
    return <div>Loading analytics...</div>;
  }

  if (error) {
    return <div>Analytics failed: {error.message}</div>;
  }

  if (!isReady) {
    return <div>Analytics not ready</div>;
  }

  const handleClick = () => {
    analytics?.track({ name: 'safe_button_click', properties: { component: 'SafeComponent' } });
  };

  return (
    <div>
      <h2>Safe Analytics Usage</h2>
      <button onClick={handleClick} type="button">
        Track Event Safely
      </button>
    </div>
  );
}

// 示例2：严格模式（需要确保已初始化）
function StrictComponent() {
  try {
    const analytics = useAnalyticsStrict();

    const handleClick = () => {
      analytics.track({
        name: 'strict_button_click',
        properties: { component: 'StrictComponent' },
      });
    };

    return (
      <div>
        <h2>Strict Analytics Usage</h2>
        <button onClick={handleClick} type="button">
          Track Event (Strict)
        </button>
      </div>
    );
  } catch (error) {
    return <div>Error: {error instanceof Error ? error.message : 'Unknown error'}</div>;
  }
}

// 示例3：使用状态信息
function StatusComponent() {
  const { isInitialized, isInitializing, error, isReady } = useAnalyticsState();

  return (
    <div>
      <h2>Analytics Status</h2>
      <ul>
        <li>Initialized: {isInitialized ? '✅' : '❌'}</li>
        <li>Initializing: {isInitializing ? '🔄' : '❌'}</li>
        <li>Ready: {isReady ? '✅' : '❌'}</li>
        <li>Error: {error ? `❌ ${error.message}` : '✅'}</li>
      </ul>
    </div>
  );
}

// 示例4：条件渲染组件
function ConditionalComponent() {
  const { isReady } = useAnalytics();

  if (!isReady) {
    return <div>Waiting for analytics...</div>;
  }

  return <SafeComponent />;
}

// ====== 组件外部使用 ======

// 现在可以在任何地方访问同一个实例！
export function trackFromOutside() {
  const analytics = getGlobalAnalytics('main'); // 使用命名实例
  analytics.track({
    name: 'external_track',
    properties: { source: 'outside_component' },
  });
}

// 在事件处理器中使用
export function handleGlobalEvent() {
  const analytics = getGlobalAnalytics(); // 使用默认实例
  analytics.track({
    name: 'global_event',
    properties: { timestamp: Date.now() },
  });
}

// 在服务函数中使用
export async function apiCall() {
  try {
    const response = await fetch('/api/data');
    const data = await response.json();

    // 在 API 调用后进行追踪
    const analytics = getGlobalAnalytics();
    analytics.track({
      name: 'api_call_success',
      properties: {
        endpoint: '/api/data',
        status: response.status,
      },
    });

    return data;
  } catch (error) {
    const analytics = getGlobalAnalytics();
    analytics.track({
      name: 'api_call_error',
      properties: {
        endpoint: '/api/data',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
    });
    throw error;
  }
}

// ====== 多实例支持 ======

export function MultiInstanceProvider({ children }: { children: React.ReactNode }) {
  const mainAnalytics = React.useMemo(
    () =>
      createAnalytics({
        business: '',
        providers: {
          posthog: {
            enabled: true,
            host: 'https://main.posthog.com',
            key: 'main_key',
          },
        },
      }),
    [],
  );

  const adminAnalytics = React.useMemo(
    () =>
      createAnalytics({
        business: '',
        providers: {
          posthog: {
            enabled: true,
            host: 'https://admin.posthog.com',
            key: 'admin_key',
          },
        },
      }),
    [],
  );

  return (
    <>
      {/* 主应用实例 */}
      <AnalyticsProvider client={mainAnalytics} globalName="main" registerGlobal={true}>
        {/* 管理后台实例 */}
        <AnalyticsProvider
          autoInitialize={false} // 不自动初始化，手动控制
          client={adminAnalytics}
          globalName="admin"
          registerGlobal={true}
        >
          {children}
        </AnalyticsProvider>
      </AnalyticsProvider>
    </>
  );
}

// 使用不同的实例
export function trackMainApp() {
  const analytics = getGlobalAnalytics('main');
  analytics.track({ name: 'main_app_event' });
}

export function trackAdminApp() {
  const analytics = getGlobalAnalytics('admin');
  analytics.track({ name: 'admin_app_event' });
}

// ====== 完整的应用示例 ======

export function App() {
  React.useEffect(() => {
    // 组件挂载后可以直接使用全局实例
    const timer = setTimeout(() => {
      trackFromOutside();
      handleGlobalEvent();
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <AnalyticsProvider client={analytics}>
      <div style={{ padding: '20px' }}>
        <h1>Enhanced React Analytics Usage</h1>

        <StatusComponent />

        <div style={{ marginTop: '20px' }}>
          <SafeComponent />
        </div>

        <div style={{ marginTop: '20px' }}>
          <StrictComponent />
        </div>

        <div style={{ marginTop: '20px' }}>
          <ConditionalComponent />
        </div>
      </div>
    </AnalyticsProvider>
  );
}

export default App;
