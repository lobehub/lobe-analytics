/**
 * 原生实例 SPM 前缀测试
 *
 * 演示通过 getNativeInstance() 获取的原生 PostHog 实例
 * 也会自动包含 business spm 前缀
 */
import { createAnalytics } from '../src';

async function testNativeInstanceSpmPrefix() {
  console.log('=== 原生实例 SPM 前缀测试 ===\n');

  // 创建 Analytics 实例
  const analytics = createAnalytics({
    business: 'myapp',
    debug: true,
    providers: {
      posthog: {
        enabled: true,
        host: 'https://app.posthog.com',
        key: 'phc_test_key', // 测试用的 key
      },
    },
  });

  await analytics.initialize();

  // 获取 PostHog provider
  const posthogProvider = analytics.getProvider('posthog');
  if (!posthogProvider) {
    console.log('PostHog provider not found');
    return;
  }

  // 获取原生 PostHog 实例
  const nativePostHog = posthogProvider.getNativeInstance();
  if (!nativePostHog) {
    console.log('Failed to get native PostHog instance');
    return;
  }

  console.log('✅ 获取原生 PostHog 实例成功\n');

  console.log('📝 以下调用都会自动包含 spm: "myapp" 属性:\n');

  // 测试 1: 原生 capture 调用（无额外属性）
  console.log('1. 原生 capture 调用:');
  nativePostHog.capture('native_event_basic', {
    action: 'test',
    source: 'native_instance',
  });
  console.log('   → 事件会自动包含 spm: "myapp"\n');

  // 测试 2: 原生 identify 调用
  console.log('2. 原生 identify 调用:');
  nativePostHog.identify('native_test_user', {
    name: 'Native Test User',
    source: 'native_test',
  });
  console.log('   → identify 也会自动包含 spm: "myapp"\n');

  // 测试 3: 原生 group 调用
  console.log('3. 原生 group 调用:');
  nativePostHog.group('company', 'test_company_id', {
    company_name: 'Test Company',
  });
  console.log('   → group 也会自动包含 spm: "myapp"\n');

  console.log('4. 原生 isFeatureEnabled 调用:');
  nativePostHog.isFeatureEnabled('test_feature');
  console.log('   → 也会自动包含 spm: "myapp"\n');

  // 测试 4: 包装器方法调用（对比）
  console.log('5. 通过包装器调用 (用户提供 spm):');
  await analytics.track({
    name: 'wrapped_event_with_spm',
    properties: {
      custom: 'data',
      spm: 'custom.page', // 用户提供的 spm 会变成 'myapp.custom.page'
    },
  });
  console.log('   → spm: "myapp.custom.page" (添加了前缀)\n');

  console.log('6. 通过包装器调用 (不提供 spm):');
  await analytics.track({
    name: 'wrapped_event_no_spm',
    properties: {
      custom: 'data',
    },
  });
  console.log('   → spm: "myapp" (自动添加默认值)\n');

  console.log('🎉 原生实例测试完成！');
  console.log('✅ 所有调用都会自动包含 business 标识');
}

await testNativeInstanceSpmPrefix();

export { testNativeInstanceSpmPrefix };
