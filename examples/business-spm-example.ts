/**
 * Business SPM Prefix 功能示例
 *
 * 演示如何使用 business 配置来自动为 spm 属性添加前缀
 */
import { createAnalytics } from '../src';

// 创建 Analytics 实例，必须提供 business 配置
const analytics = createAnalytics({
  business: 'myapp', // 必填的业务标识
  debug: true,
  providers: {
    posthog: {
      enabled: true,
      host: 'https://app.posthog.com',
      key: 'phc_example_key',
    },
  },
});

async function demonstrateBusinessSpmFeature() {
  await analytics.initialize();

  console.log('=== Business SPM Prefix 功能演示 ===\n');

  // 场景 1: 用户提供了 spm 属性
  console.log('1. 用户提供 spm 属性:');
  await analytics.track({
    name: 'button_click',
    properties: {
      button_name: 'login',
      spm: 'home.header',
    },
  });
  console.log('发送的 spm: "myapp.home.header"\n');

  // 场景 2: 用户没有提供 spm 属性
  console.log('2. 用户没有提供 spm 属性:');
  await analytics.track({
    name: 'page_visit',
    properties: {
      page: 'dashboard',
    },
  });
  console.log('自动添加 spm: "myapp"\n');

  // 场景 3: trackPageView 也支持 spm 前缀
  console.log('3. trackPageView 支持 spm 前缀:');
  await analytics.trackPageView('/dashboard', {
    referrer: '/home',
    spm: 'dashboard.main',
  });
  console.log('发送的 spm: "myapp.dashboard.main"\n');

  // 场景 4: identify 也支持 spm 前缀
  console.log('4. identify 支持 spm 前缀:');
  await analytics.identify('user123', {
    email: 'test@example.com',
    name: 'Test User',
    spm: 'profile.setup',
  });
  console.log('发送的 spm: "myapp.profile.setup"\n');

  // 场景 5: 没有提供 properties 对象
  console.log('5. 没有提供 properties:');
  await analytics.track({
    name: 'simple_event',
  });
  console.log('自动添加 spm: "myapp"\n');

  // 场景 6: 空的 spm 属性会被替换为 business
  console.log('6. 空的 spm 属性处理:');
  await analytics.track({
    name: 'empty_spm_event',
    properties: {
      action: 'test',
      spm: '', // 空字符串
    },
  });
  console.log('spm 被设置为: "myapp"\n');

  console.log('🎉 所有场景演示完成！');
}

// 运行示例
await demonstrateBusinessSpmFeature();

export { analytics };
