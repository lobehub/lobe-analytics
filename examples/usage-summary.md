# 全局实例访问解决方案

## 问题描述

原始问题：在使用 `@lobehub/analytics` 时，analytics 实例被封装在 React 组件内部，无法在其他文件中轻松获取。

```tsx
// 原来的方式 - analytics 实例被困在组件内
export function NextAnalyticsProvider(props: Props) {
  const { host, token, children } = props;
  const analytics = React.useMemo(() => createAnalytics({...}), [host, token]);

  return <AnalyticsProvider client={analytics}>{children}</AnalyticsProvider>;
}

// 问题：其他文件无法访问这个 analytics 实例
```

## 解决方案

我们提供了**组合方案**，包含两种主要方法：

### 方案 1: 单例模式（推荐）

**最简单的解决方案**：使用 `createSingletonAnalytics()` 创建全局唯一实例。

```tsx
// 在 NextAnalyticsProvider 中
export function NextAnalyticsProvider(props: Props) {
  const { host, token, children } = props;

  const analytics = React.useMemo(
    () =>
      createSingletonAnalytics({
        // ✅ 改用单例模式
        debug: true,
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

  return <AnalyticsProvider client={analytics}>{children}</AnalyticsProvider>;
}
```

```ts
// 现在在任何其他文件中都可以直接使用！
import { getSingletonAnalytics } from '@lobehub/analytics';

export function myApiService() {
  const analytics = getSingletonAnalytics(); // ✅ 直接获取实例

  analytics.track({
    name: 'api_call',
    properties: { endpoint: '/api/users' },
  });
}

export function myUtilFunction() {
  const analytics = getSingletonAnalytics();

  analytics.identify('user123', {
    email: 'user@example.com',
    name: 'John Doe',
  });
}
```

### 方案 2: 全局注册 + Provider 自动注册

**更灵活的方案**：AnalyticsProvider 现在会自动注册实例到全局。

```tsx
// Provider 会自动注册实例
export function NextAnalyticsProvider(props: Props) {
  const { host, token, children } = props;

  const analytics = React.useMemo(() => createAnalytics({...}), [host, token]);

  return (
    <AnalyticsProvider
      client={analytics}
      registerGlobal={true}     // ✅ 自动注册为全局实例（默认）
      globalName="main"         // ✅ 可选：自定义名称
    >
      {children}
    </AnalyticsProvider>
  );
}
```

```ts
// 在其他文件中使用
import { getGlobalAnalytics } from '@lobehub/analytics/react';

export function trackUserAction() {
  const analytics = getGlobalAnalytics('main'); // ✅ 使用命名实例
  analytics.track({ name: 'user_action' });
}
```

## 完整的 API

### 单例模式 API

```ts
import {
  createSingletonAnalytics,
  getSingletonAnalytics,
  getSingletonAnalyticsOptional,
  hasSingletonAnalytics,
  resetSingletonAnalytics
} from '@lobehub/analytics';

// 创建单例（通常在应用启动时）
const analytics = createSingletonAnalytics(config);

// 在任何地方获取单例
const analytics = getSingletonAnalytics();

// 安全获取（不抛出错误）
const analytics = getSingletonAnalyticsOptional();

// 检查单例是否存在
if (hasSingletonAnalytics()) { /* ... */ }

// 重置单例（主要用于测试）
resetSingletonAnalytics();
```

### 全局注册 API

```ts
import {
  setGlobalAnalytics,
  getGlobalAnalytics,
  getGlobalAnalyticsOptional,
  hasGlobalAnalytics,
  removeGlobalAnalytics,
  clearGlobalAnalytics
} from '@lobehub/analytics';

// 手动注册实例
setGlobalAnalytics(analytics, 'myApp');

// 获取注册的实例
const analytics = getGlobalAnalytics('myApp');

// 安全获取
const analytics = getGlobalAnalyticsOptional('myApp');

// 检查实例是否存在
if (hasGlobalAnalytics('myApp')) { /* ... */ }

// 移除实例
removeGlobalAnalytics('myApp');

// 清除所有实例
clearGlobalAnalytics();
```

## 使用建议

### 简单应用 → 单例模式

如果你的应用只需要一个 analytics 配置，推荐使用单例模式：

```ts
// 1. 在初始化时创建单例
const analytics = createSingletonAnalytics(config);

// 2. 在任何地方使用
const analytics = getSingletonAnalytics();
```

### 复杂应用 → 全局注册

如果你需要多个不同的 analytics 配置（如主应用 + 管理后台），使用全局注册：

```ts
// 注册多个实例
setGlobalAnalytics(mainAnalytics, 'main');
setGlobalAnalytics(adminAnalytics, 'admin');

// 使用不同实例
getGlobalAnalytics('main').track({...});
getGlobalAnalytics('admin').track({...});
```

## 迁移指南

将现有代码迁移到新方案只需要两步：

1. **修改 Provider**：

   ```tsx
   // 将 createAnalytics 改为 createSingletonAnalytics
   const analytics = createSingletonAnalytics(config);
   ```

2. **在其他文件中使用**：
   ```ts
   // 导入并使用
   import { getSingletonAnalytics } from '@lobehub/analytics';

   const analytics = getSingletonAnalytics();
   ```

## 优势

✅ **向后兼容**：所有现有 API 保持不变\
✅ **零重构**：现有代码无需修改\
✅ **类型安全**：完整的 TypeScript 支持\
✅ **灵活性**：支持单例和多实例场景\
✅ **便利性**：无需通过 props 传递实例\
✅ **测试友好**：提供重置和清除功能

现在你可以在应用的任何地方轻松访问 analytics 实例，不再受限于 React 组件树！
