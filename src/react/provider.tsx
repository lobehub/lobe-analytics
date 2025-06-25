'use client';

import React, { type ReactNode, createContext, useContext, useLayoutEffect, useState } from 'react';

import { setGlobalAnalytics } from '../global';
import type { AnalyticsManager } from '../manager';

/**
 * Analytics Context 类型定义
 */
interface AnalyticsContextValue {
  analytics: AnalyticsManager | null;
  error: Error | null;
  isInitialized: boolean;
  isInitializing: boolean;
}

/**
 * Analytics Context
 */
const AnalyticsContext = createContext<AnalyticsContextValue | undefined>(undefined);

/**
 * Analytics Provider Props
 */
interface AnalyticsProviderProps {
  /** 是否自动初始化（默认: true） */
  autoInitialize?: boolean;
  /** 子组件 */
  children: ReactNode;
  /** 配置好的 Analytics 实例 */
  client: AnalyticsManager;
  /** 全局实例名称，用于全局访问（默认: '__default__'） */
  globalName?: string;
  /** 初始化失败时的回调 */
  onInitializeError?: (error: Error) => void;
  /** 初始化成功时的回调 */
  onInitializeSuccess?: () => void;
  /** 是否注册为全局实例（默认: true） */
  registerGlobal?: boolean;
}

/**
 * Analytics Provider 组件
 *
 * 提供 Analytics 实例给整个 React 应用树，并处理初始化逻辑
 *
 * @example
 * ```tsx
 * import { createAnalytics, AnalyticsProvider } from '@lobehub/analytics';
 *
 * const analytics = createAnalytics({
 *   debug: true,
 *   providers: {
 *     posthog: {
 *       enabled: true,
 *       key: 'phc_your_key',
 *       host: 'https://app.posthog.com',
 *     },
 *   },
 * });
 *
 * function App() {
 *   return (
 *     <AnalyticsProvider client={analytics}>
 *       <MyApp />
 *     </AnalyticsProvider>
 *   );
 * }
 * ```
 */
export function AnalyticsProvider({
  client,
  children,
  autoInitialize = true,
  globalName = '__default__',
  onInitializeError,
  onInitializeSuccess,
  registerGlobal = true,
}: AnalyticsProviderProps) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // 注册为全局实例
  useLayoutEffect(() => {
    if (registerGlobal) {
      setGlobalAnalytics(client, globalName);
    }
  }, [client, globalName, registerGlobal]);

  useLayoutEffect(() => {
    if (!autoInitialize || isInitialized || isInitializing) {
      return;
    }

    const initializeAnalytics = async () => {
      setIsInitializing(true);
      setError(null);

      try {
        await client.initialize();
        setIsInitialized(true);
        onInitializeSuccess?.();
      } catch (error_) {
        const error =
          error_ instanceof Error ? error_ : new Error('Analytics initialization failed');
        setError(error);
        onInitializeError?.(error);
        console.error('[AnalyticsProvider] Initialization failed:', error);
      } finally {
        setIsInitializing(false);
      }
    };

    initializeAnalytics();
  }, [
    client,
    autoInitialize,
    isInitialized,
    isInitializing,
    onInitializeError,
    onInitializeSuccess,
  ]);

  const contextValue: AnalyticsContextValue = {
    analytics: client,
    error,
    isInitialized,
    isInitializing,
  };

  return <AnalyticsContext.Provider value={contextValue}>{children}</AnalyticsContext.Provider>;
}

/**
 * 获取 Analytics Context
 *
 * @throws {Error} 如果在 AnalyticsProvider 外使用
 */
function useAnalyticsContext(): AnalyticsContextValue {
  const context = useContext(AnalyticsContext);

  if (context === undefined) {
    throw new Error(
      'useAnalyticsContext must be used within an AnalyticsProvider. ' +
        'Wrap your component tree with <AnalyticsProvider client={analytics}>',
    );
  }

  return context;
}

/**
 * 获取 Analytics 实例（安全版本，不抛出错误）
 *
 * @returns Analytics 实例或 null，以及状态信息
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { analytics, isReady, error } = useAnalytics();
 *
 *   if (!isReady) {
 *     return <div>Analytics not ready</div>;
 *   }
 *
 *   const handleClick = () => {
 *     analytics?.track({ name: 'button_click' });
 *   };
 *
 *   return <button onClick={handleClick}>Click me</button>;
 * }
 * ```
 */
export function useAnalytics() {
  const { analytics, isInitialized, isInitializing, error } = useAnalyticsContext();

  return {
    /** Analytics 实例（仅在就绪时可用） */
    analytics: isInitialized && !error ? analytics : null,
    /** 是否发生错误 */
    error,
    /** 是否已初始化 */
    isInitialized,
    /** 是否正在初始化 */
    isInitializing,
    /** 是否就绪（已初始化且无错误） */
    isReady: isInitialized && !error && analytics !== null,
  };
}

/**
 * 获取 Analytics 实例（严格版本，抛出错误）
 *
 * @returns Analytics 实例
 * @throws {Error} 如果在 AnalyticsProvider 外使用或实例未就绪
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const analytics = useAnalyticsStrict();
 *
 *   const handleClick = () => {
 *     analytics.track({ name: 'button_click' });
 *   };
 *
 *   return <button onClick={handleClick}>Click me</button>;
 * }
 * ```
 */
export function useAnalyticsStrict(): AnalyticsManager {
  const { analytics, isInitialized, isInitializing, error } = useAnalyticsContext();

  if (error) {
    throw new Error(`[useAnalyticsStrict] Analytics initialization failed: ${error.message}`);
  }

  if (!isInitialized) {
    if (isInitializing) {
      throw new Error(
        '[useAnalyticsStrict] Analytics is still initializing. Use useAnalyticsState to check status.',
      );
    } else {
      throw new Error(
        '[useAnalyticsStrict] Analytics not initialized. Set autoInitialize=true or call initialize manually.',
      );
    }
  }

  if (!analytics) {
    throw new Error('[useAnalyticsStrict] Analytics instance is null');
  }

  return analytics;
}

/**
 * 获取 Analytics 状态信息
 *
 * @returns Analytics 状态
 *
 * @example
 * ```tsx
 * function LoadingComponent() {
 *   const { isInitialized, isInitializing, error } = useAnalyticsState();
 *
 *   if (isInitializing) return <div>Loading analytics...</div>;
 *   if (error) return <div>Analytics failed: {error.message}</div>;
 *   if (!isInitialized) return <div>Analytics not ready</div>;
 *
 *   return <MyApp />;
 * }
 * ```
 */
export function useAnalyticsState() {
  const { error, isInitialized, isInitializing } = useAnalyticsContext();

  return {
    error,
    isInitialized,
    isInitializing,
    isReady: isInitialized && !error,
  };
}

/**
 * 获取 Analytics 实例（可选，不抛出错误）
 *
 * @deprecated 请使用 `useAnalytics()` 代替，它现在提供相同的安全访问
 * @returns Analytics 实例或 null
 *
 * @example
 * ```tsx
 * function OptionalTracking() {
 *   const analytics = useAnalyticsOptional();
 *
 *   const handleOptionalEvent = () => {
 *     analytics?.track({ name: 'optional_event' });
 *   };
 *
 *   return <button onClick={handleOptionalEvent}>Optional Track</button>;
 * }
 * ```
 */
export function useAnalyticsOptional(): AnalyticsManager | null {
  const { analytics } = useAnalytics();
  return analytics;
}
