import { createAnalytics } from '@lobehub/analytics';

const analytics = createAnalytics({
  business: 'typed-app',
  providers: {
    posthog: {
      enabled: true,
      key: process.env.POSTHOG_KEY!,
    },
  },
});

// Type-safe event tracking
export async function typedEvents() {
  await analytics.initialize();

  // Currently supported predefined events
  await analytics.trackEvent('user_signup', {
    // Can add any custom properties
    method: 'email',
    source: 'landing_page',
    spm: 'homepage.cta',
  });

  await analytics.trackEvent('user_login', {
    // Can add any custom properties
    method: 'oauth',
    spm: 'login.form',
  });

  // UI interaction events
  await analytics.trackEvent('button_click', {
    button_name: 'signup_button',
    // Can add extra properties
    page: 'home',
    section: 'hero',
  });

  // Page view
  await analytics.trackEvent('page_view', {
    page: '/dashboard',
    // Can add extra properties
    referrer: 'https://google.com',
  });
}

// Custom events example (using generic track method)
export async function customEvents() {
  await analytics.initialize();

  // Chat events
  await analytics.track({
    name: 'chat_message_sent',
    properties: {
      conversation_id: 'conv_123',
      message_length: 150,
      model: 'gpt-4',
      spm: 'chat.sidebar',
    },
  });

  // Payment events
  await analytics.track({
    name: 'user_paid_success',
    properties: {
      amount: 29.99,
      currency: 'USD',
      platform: 'web',
      spm: 'payment.checkout',
    },
  });

  // Form events
  await analytics.track({
    name: 'form_submit',
    properties: {
      form_name: 'contact_form',
      spm: 'contact.form',
      success: true,
    },
  });

  // Feature toggle events
  await analytics.track({
    name: 'feature_toggle',
    properties: {
      enabled: true,
      feature_name: 'dark_mode',
      user_tier: 'pro',
    },
  });
}
