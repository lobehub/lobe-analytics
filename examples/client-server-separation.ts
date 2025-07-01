// 🔥 Client/Server 分离方案 - 清晰的入口点分离
// ✅ 导入语句
import { createAnalytics } from '@lobehub/analytics';
import { createServerAnalytics } from '@lobehub/analytics/server';

// ✅ 客户端使用 - 完全不包含 posthog-node
const clientAnalytics = createAnalytics({
  business: 'my-app',
  providers: {
    posthog: {
      api_host: 'https://app.posthog.com',
      enabled: true,
      key: 'phc_client_key',
    },
    // ❌ 如果在客户端配置 posthogNode，会收到警告
    // posthogNode: { enabled: true, key: 'server_key' }
  },
});

// ✅ 服务端使用 - 包含完整的 posthog-node 支持

const serverAnalytics = createServerAnalytics({
  business: 'my-app',
  providers: {
    posthog: {
      api_host: 'https://app.posthog.com',
      enabled: true,
      key: 'phc_client_key',
    },
    posthogNode: {
      enabled: true,
      host: 'https://app.posthog.com',
      key: 'phc_server_key',
    },
  },
});

// 📝 使用方式完全一致
clientAnalytics.track({ name: 'page_view', properties: { page: 'home' } });
serverAnalytics.track({ name: 'api_call', properties: { endpoint: '/api/chat' } });

// 🔍 分离方案的特点:
// 1. 明确的入口点分离，避免任何客户端包含服务端代码的可能
// 2. API 完全一致，无需学习成本
// 3. 类型安全，服务端入口点包含所有必要的类型定义
// 4. 打包工具友好，完全静态分析安全

console.log('✅ Client/Server 分离方案：清晰、安全、高效！');
