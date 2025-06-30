import {
  createSingletonAnalytics,
  getGlobalAnalytics,
  getSingletonAnalytics,
  setGlobalAnalytics,
} from '@lobehub/analytics';

// Access singleton from anywhere
function trackFromAnywhere() {
  const analytics = getSingletonAnalytics();
  analytics.trackEvent('user_login', { method: 'email' });
}

// Use specific instances
function trackMainApp() {
  getGlobalAnalytics('main').trackEvent('page_view', { page: '/home' });
}

function trackAdminApp() {
  getGlobalAnalytics('admin').track({
    name: 'admin_action',
    properties: { action: 'user_edit' },
  });
}

// Singleton pattern - recommended for simple apps
export async function singletonExample() {
  // Create singleton instance
  const analytics = createSingletonAnalytics({
    business: 'singleton-app',
    providers: {
      posthog: {
        enabled: true,
        key: process.env.POSTHOG_KEY!,
      },
    },
  });

  await analytics.initialize();
  trackFromAnywhere();
}

// Named instances - for complex apps
export async function namedInstanceExample() {
  // Create multiple instances
  const mainAnalytics = createSingletonAnalytics({
    business: 'main-app',
    providers: { posthog: { enabled: true, key: 'main_key' } },
  });

  const adminAnalytics = createSingletonAnalytics({
    business: 'admin-app',
    providers: { posthog: { enabled: true, key: 'admin_key' } },
  });

  // Register named instances
  setGlobalAnalytics(mainAnalytics, 'main');
  setGlobalAnalytics(adminAnalytics, 'admin');

  await Promise.all([mainAnalytics.initialize(), adminAnalytics.initialize()]);

  trackMainApp();
  trackAdminApp();
}
