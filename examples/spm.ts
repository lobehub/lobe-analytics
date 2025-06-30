import { createAnalytics } from '@lobehub/analytics';

const analytics = createAnalytics({
  business: 'my-app', // Auto-prefix all SPM values
  providers: {
    posthog: {
      enabled: true,
      key: process.env.POSTHOG_KEY!,
    },
  },
});

export async function spmTrackingExample() {
  await analytics.initialize();

  // SPM auto-prefix functionality - using predefined events
  await analytics.trackEvent('button_click', {
    button_name: 'signup',
    spm: 'homepage.hero', // Auto becomes: 'my-app.homepage.hero'
  });

  await analytics.trackEvent('page_view', {
    page: '/pricing',
    spm: 'navigation.menu', // Auto becomes: 'my-app.navigation.menu'
  });

  // When no SPM is provided, use business name as default
  await analytics.trackEvent('user_login', {
    method: 'email',
    // spm auto set to: 'my-app'
  });

  // Marketing funnel tracking
  await analytics.trackEvent('user_signup', {
    method: 'email',
    source: 'google_ads',
    spm: 'campaign.summer_sale', // 'my-app.campaign.summer_sale'
  });

  // Feature usage tracking - using custom events
  await analytics.track({
    name: 'chat_message_sent',
    properties: {
      message_length: 100,
      model: 'gpt-4',
      spm: 'chat.sidebar', // 'my-app.chat.sidebar'
    },
  });
}

// SPM structure for different business scenarios
export async function spmBestPractices() {
  // Page-level tracking
  await analytics.trackEvent('page_view', {
    page: '/dashboard',
    spm: 'app.dashboard', // my-app.app.dashboard
  });

  // Component-level tracking
  await analytics.trackEvent('button_click', {
    button_name: 'export',
    spm: 'dashboard.toolbar.export', // my-app.dashboard.toolbar.export
  });

  // Process-level tracking - using custom events
  await analytics.track({
    name: 'form_submit',
    properties: {
      form_name: 'checkout',
      spm: 'checkout.step3.payment', // my-app.checkout.step3.payment
      success: true,
    },
  });

  // Channel-level tracking
  await analytics.trackEvent('user_signup', {
    method: 'oauth',
    source: 'referral',
    spm: 'growth.referral.invite', // my-app.growth.referral.invite
  });
}
