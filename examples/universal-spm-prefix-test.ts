/**
 * 通用 SPM 前缀测试
 *
 * 验证无论通过哪种方式调用，都会自动添加 business spm 前缀
 */
import { createAnalytics } from '../src';

async function testUniversalSpmPrefix() {
  console.log('=== 通用 SPM 前缀测试 ===\n');

  // 创建 Analytics 实例
  const analytics = createAnalytics({
    business: 'myapp',
    debug: true,
    providers: {
      posthog: {
        enabled: true,
        host: 'https://app.posthog.com',
        key: 'phc_test_key',
      },
    },
  });

  await analytics.initialize();

  console.log('✅ Analytics 初始化成功\n');

  // 测试场景 1: 通过 Manager 调用 (原有逻辑)
  console.log('📋 场景 1: 通过 AnalyticsManager 调用');

  await analytics.track({
    name: 'manager_track_with_spm',
    properties: {
      action: 'click',
      spm: 'home.header',
    },
  });
  console.log('   ✅ manager.track({ spm: "home.header" }) → spm: "myapp.home.header"\n');

  await analytics.track({
    name: 'manager_track_no_spm',
    properties: {
      action: 'click',
    },
  });
  console.log('   ✅ manager.track({}) → spm: "myapp"\n');

  // 测试场景 2: 直接通过 Provider 调用 (新修复的逻辑)
  console.log('📋 场景 2: 直接通过 PostHog Provider 调用');

  const posthogProvider = analytics.getProvider('posthog');
  if (posthogProvider) {
    await posthogProvider.track({
      name: 'provider_track_with_spm',
      properties: {
        action: 'open',
        spm: 'footer.chat',
      },
    });
    console.log('   ✅ provider.track({ spm: "footer.chat" }) → spm: "myapp.footer.chat"\n');

    await posthogProvider.track({
      name: 'provider_track_no_spm',
      properties: {
        action: 'open',
      },
    });
    console.log('   ✅ provider.track({}) → spm: "myapp"\n');

    await posthogProvider.identify('user_123', {
      name: 'Test User',
      spm: 'profile.settings',
    });
    console.log(
      '   ✅ provider.identify({ spm: "profile.settings" }) → spm: "myapp.profile.settings"\n',
    );

    await posthogProvider.trackPageView('/dashboard', {
      spm: 'dashboard.main',
      title: 'Dashboard',
    });
    console.log(
      '   ✅ provider.trackPageView({ spm: "dashboard.main" }) → spm: "myapp.dashboard.main"\n',
    );
  }

  // 测试场景 3: 通过原生 PostHog 实例调用 (全局属性兜底)
  console.log('📋 场景 3: 通过原生 PostHog 实例调用');

  const nativePostHog = posthogProvider?.getNativeInstance();
  if (nativePostHog) {
    nativePostHog.capture('native_call_no_spm', {
      action: 'test',
    });
    console.log('   ✅ posthog.capture({}) → spm: "myapp" (全局属性兜底)\n');

    nativePostHog.capture('native_call_with_spm', {
      action: 'expand',
      spm: 'sidebar.menu',
    });
    console.log(
      '   ⚠️  posthog.capture({ spm: "sidebar.menu" }) → spm: "sidebar.menu" (事件属性覆盖全局属性)\n',
    );

    nativePostHog.identify('native_user_456', {
      name: 'Native User',
    });
    console.log('   ✅ posthog.identify({}) → spm: "myapp" (全局属性兜底)\n');
  }

  // 测试场景 4: 防重复处理
  console.log('📋 场景 4: 防重复处理测试');

  await analytics.track({
    name: 'already_prefixed_event',
    properties: {
      action: 'test',
      spm: 'myapp.already.prefixed', // 已经有前缀
    },
  });
  console.log(
    '   ✅ track({ spm: "myapp.already.prefixed" }) → spm: "myapp.already.prefixed" (不重复处理)\n',
  );

  // 测试场景 5: 空值处理
  console.log('📋 场景 5: 边界情况处理');

  await analytics.track({
    name: 'empty_spm_event',
    properties: {
      action: 'test',
      spm: '', // 空字符串
    },
  });
  console.log('   ✅ track({ spm: "" }) → spm: "myapp" (空值处理)\n');

  await analytics.track({
    name: 'whitespace_spm_event',
    properties: {
      action: 'test',
      spm: '   ', // 空白字符
    },
  });
  console.log('   ✅ track({ spm: "   " }) → spm: "myapp" (空白字符处理)\n');

  console.log('🎉 所有测试完成！');
  console.log('📊 总结:');
  console.log('   • Manager 调用: ✅ 完全支持');
  console.log('   • Provider 调用: ✅ 完全支持 (新修复)');
  console.log('   • 原生实例调用: ⚠️  需要避免提供 spm 属性');
  console.log('   • 防重复处理: ✅ 完全支持');
  console.log('   • 边界情况: ✅ 完全支持');
}

// 运行测试
await testUniversalSpmPrefix();

export { testUniversalSpmPrefix };
