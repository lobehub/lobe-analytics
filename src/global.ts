/**
 * Global Analytics Instance Manager
 *
 * 提供全局实例管理功能，支持：
 * 1. 全局实例注册和获取
 * 2. 单例模式
 * 3. 命名空间支持
 *
 * 使用 globalThis 确保跨模块实例的状态一致性
 */
import { createAnalytics } from './config';
import type { AnalyticsManager } from './manager';
import type { AnalyticsConfig } from './types';

/**
 * 全局状态键名，确保唯一性
 */
const GLOBAL_STATE_KEY = '__LOBE_ANALYTICS_GLOBAL_STATE__';

/**
 * 扩展 globalThis 类型
 */
declare global {
  // eslint-disable-next-line no-var
  var __LOBE_ANALYTICS_GLOBAL_STATE__: GlobalAnalyticsState | undefined;
}

/**
 * 全局状态接口
 */
interface GlobalAnalyticsState {
  instances: Map<string, AnalyticsManager>;
  singletonConfig: AnalyticsConfig | null;
  singletonInstance: AnalyticsManager | null;
}

/**
 * 获取全局状态，确保跨模块实例的一致性
 */
function getGlobalState(): GlobalAnalyticsState {
  if (!globalThis[GLOBAL_STATE_KEY]) {
    globalThis[GLOBAL_STATE_KEY] = {
      instances: new Map<string, AnalyticsManager>(),
      singletonConfig: null,
      singletonInstance: null,
    };
  }
  return globalThis[GLOBAL_STATE_KEY];
}

/**
 * 默认实例名称
 */
const DEFAULT_INSTANCE_NAME = '__default__';

/**
 * 注册全局 Analytics 实例
 *
 * @param instance Analytics 管理器实例
 * @param name 实例名称，默认为 '__default__'
 *
 * @example
 * ```typescript
 * const analytics = createAnalytics({ ... });
 * setGlobalAnalytics(analytics);
 * ```
 */
export function setGlobalAnalytics(
  instance: AnalyticsManager,
  name: string = DEFAULT_INSTANCE_NAME,
): void {
  const state = getGlobalState();
  state.instances.set(name, instance);
}

/**
 * 获取全局 Analytics 实例
 *
 * @param name 实例名称，默认为 '__default__'
 * @returns Analytics 管理器实例
 * @throws {Error} 如果实例不存在
 *
 * @example
 * ```typescript
 * // 在任何文件中使用
 * const analytics = getGlobalAnalytics();
 * analytics.track({ name: 'some_event' });
 * ```
 */
export function getGlobalAnalytics(name: string = DEFAULT_INSTANCE_NAME): AnalyticsManager {
  const state = getGlobalState();
  const instance = state.instances.get(name);

  if (!instance) {
    throw new Error(
      `Global analytics instance "${name}" not found. ` +
        `Make sure to register it first using setGlobalAnalytics() or use AnalyticsProvider.`,
    );
  }

  return instance;
}

/**
 * 获取全局 Analytics 实例（可选，不抛出错误）
 *
 * @param name 实例名称，默认为 '__default__'
 * @returns Analytics 管理器实例或 null
 *
 * @example
 * ```typescript
 * const analytics = getGlobalAnalyticsOptional();
 * analytics?.track({ name: 'optional_event' });
 * ```
 */
export function getGlobalAnalyticsOptional(
  name: string = DEFAULT_INSTANCE_NAME,
): AnalyticsManager | null {
  const state = getGlobalState();
  return state.instances.get(name) || null;
}

/**
 * 检查全局实例是否存在
 *
 * @param name 实例名称，默认为 '__default__'
 * @returns 是否存在
 */
export function hasGlobalAnalytics(name: string = DEFAULT_INSTANCE_NAME): boolean {
  const state = getGlobalState();
  return state.instances.has(name);
}

/**
 * 移除全局 Analytics 实例
 *
 * @param name 实例名称，默认为 '__default__'
 * @returns 是否成功移除
 */
export function removeGlobalAnalytics(name: string = DEFAULT_INSTANCE_NAME): boolean {
  const state = getGlobalState();
  return state.instances.delete(name);
}

/**
 * 清除所有全局实例
 */
export function clearGlobalAnalytics(): void {
  const state = getGlobalState();
  state.instances.clear();
}

/**
 * 获取所有已注册的实例名称
 *
 * @returns 实例名称数组
 */
export function getGlobalAnalyticsNames(): string[] {
  const state = getGlobalState();
  return Array.from(state.instances.keys());
}

/**
 * 简单的配置比较函数
 *
 * 注意：这是一个简化的实现，仅比较 JSON 序列化后的字符串
 * 对于复杂对象可能不够准确，但对于大多数配置场景是足够的
 */
function isConfigEqual(config1: AnalyticsConfig, config2: AnalyticsConfig): boolean {
  try {
    return JSON.stringify(config1) === JSON.stringify(config2);
  } catch {
    return false;
  }
}

/**
 * 创建或获取单例 Analytics 实例
 *
 * 单例模式适用于整个应用只需要一个 Analytics 配置的场景。
 * 如果已存在单例且配置相同，返回现有实例；否则创建新实例。
 *
 * @param config Analytics 配置
 * @returns Analytics 管理器实例
 *
 * @example
 * ```typescript
 * // 在应用启动时创建
 * const analytics = createSingletonAnalytics({
 *   debug: true,
 *   providers: {
 *     posthog: {
 *       enabled: true,
 *       key: 'your_key',
 *       host: 'https://app.posthog.com',
 *     },
 *   },
 * });
 *
 * // 在其他地方获取同一实例
 * const sameAnalytics = getSingletonAnalytics();
 * ```
 */
export function createSingletonAnalytics(config: AnalyticsConfig): AnalyticsManager {
  const state = getGlobalState();

  // 检查是否已存在相同配置的单例
  if (
    state.singletonInstance &&
    state.singletonConfig &&
    isConfigEqual(state.singletonConfig, config)
  ) {
    return state.singletonInstance;
  }

  // 创建新的单例实例
  state.singletonInstance = createAnalytics(config);
  state.singletonConfig = config;

  // 同时注册为全局默认实例
  setGlobalAnalytics(state.singletonInstance);

  return state.singletonInstance;
}

/**
 * 获取单例 Analytics 实例
 *
 * @returns Analytics 管理器实例
 * @throws {Error} 如果单例未创建
 *
 * @example
 * ```typescript
 * const analytics = getSingletonAnalytics();
 * analytics.track({ name: 'some_event' });
 * ```
 */
export function getSingletonAnalytics(): AnalyticsManager {
  const state = getGlobalState();

  if (!state.singletonInstance) {
    throw new Error(
      'Singleton analytics instance not created. ' +
        'Call createSingletonAnalytics() first or use getGlobalAnalytics().',
    );
  }

  return state.singletonInstance;
}

/**
 * 获取单例 Analytics 实例（可选，不抛出错误）
 *
 * @returns Analytics 管理器实例或 null
 */
export function getSingletonAnalyticsOptional(): AnalyticsManager | null {
  const state = getGlobalState();
  return state.singletonInstance;
}

/**
 * 检查单例是否已创建
 *
 * @returns 是否存在单例
 */
export function hasSingletonAnalytics(): boolean {
  const state = getGlobalState();
  return state.singletonInstance !== null;
}

/**
 * 重置单例实例
 *
 * 主要用于测试场景
 */
export function resetSingletonAnalytics(): void {
  const state = getGlobalState();
  state.singletonInstance = null;
  state.singletonConfig = null;
}
