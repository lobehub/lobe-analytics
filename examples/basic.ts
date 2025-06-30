import { createAnalytics } from '@lobehub/analytics';

// Basic configuration
const analytics = createAnalytics({
  business: 'my-app',
  debug: process.env.NODE_ENV === 'development',
  providers: {
    posthog: {
      enabled: !!process.env.POSTHOG_KEY,
      host: process.env.POSTHOG_HOST,
      key: process.env.POSTHOG_KEY!,
    },
  },
});

async function main() {
  // Initialize
  await analytics.initialize();

  // User signup (predefined event)
  await analytics.trackEvent('user_signup', {
    // Can add custom properties
    method: 'email',
    spm: 'homepage.cta',
  });

  // User login (predefined event)
  await analytics.trackEvent('user_login', {
    // Can add custom properties
    method: 'oauth',
    spm: 'login.form',
  });

  // Button click (predefined event)
  await analytics.trackEvent('button_click', {
    button_name: 'cta_signup',
    page: 'home',
  });

  // Page view (predefined event)
  await analytics.trackEvent('page_view', {
    page: '/dashboard',
    referrer: 'https://google.com',
  });

  // User identification
  await analytics.identify('user_123', {
    email: 'user@example.com',
    plan: 'pro',
  });

  // Custom event
  await analytics.track({
    name: 'feature_used',
    properties: { count: 1, feature: 'export' },
  });
}

export { analytics, main };
