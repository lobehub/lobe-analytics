import { createAnalytics } from '../src';

/**
 * Lobe Analytics Usage Examples
 * Demonstrates proper usage as a third-party library
 */

// Example: User configuration in their project
function createUserAnalytics() {
  console.log('🏗️ User Project Configuration\n');

  // User reads environment variables and configures
  const analytics = createAnalytics({
    business: '',
    debug: process.env.NODE_ENV !== 'production',
    providers: {
      posthog: {
        enabled: !!process.env.POSTHOG_KEY,
        host: process.env.POSTHOG_HOST,
        key: process.env.POSTHOG_KEY || '',
      },
    },
  });

  return analytics;
}

// Example: Basic usage in user's application
async function basicUsageExample() {
  console.log('📱 Basic Usage Example\n');

  const analytics = createUserAnalytics();

  try {
    // Initialize
    await analytics.initialize();
    console.log('✅ Analytics initialized');

    // Track user signup
    await analytics.trackEvent('user_signup', {
      method: 'email',
      source: 'landing_page',
    });
    console.log('✅ User signup tracked');

    // Identify user
    await analytics.identify('user_123', {
      email: 'user@example.com',
      plan: 'pro',
    });
    console.log('✅ User identified');

    // Track page view
    await analytics.trackPageView('/dashboard', {
      user_type: 'premium',
    });
    console.log('✅ Page view tracked');
  } catch (error) {
    console.error('❌ Analytics error:', error);
  }
}

// Example: React integration
async function reactExample() {
  console.log('\n⚛️ React Integration Example:');

  const code = `
import React from 'react';
import { createAnalytics } from '@lobehub/analytics';
import { useAnalytics, useEventTracking } from '@lobehub/analytics/react';

// Create analytics instance
const analytics = createAnalytics({
  providers: {
    posthog: {
      enabled: true,
      key: process.env.REACT_APP_POSTHOG_KEY!,
    },
  },
});

// Initialize in app startup
await analytics.initialize();

// Use in components
function MyComponent() {
  const { trackEvent } = useAnalytics(analytics);
  const { trackButtonClick } = useEventTracking(analytics);

  const handleSignup = () => {
    trackEvent('user:signup', { method: 'oauth' });
  };

  const handleButtonClick = () => {
    trackButtonClick('cta-button', { page: 'home' });
  };

  return (
    <div>
      <button onClick={handleSignup}>Sign Up</button>
      <button onClick={handleButtonClick}>Learn More</button>
    </div>
  );
}
  `;

  console.log(code);
}

// Show library design principles
function designPrinciples() {
  console.log('\n🎯 Library Design Principles:');
  console.log('');
  console.log('✅ Library provides:');
  console.log('  - Core classes and interfaces');
  console.log('  - Provider implementations');
  console.log('  - Factory functions');
  console.log('  - React integration (separate import)');
  console.log('  - Type definitions');
  console.log('');
  console.log('❌ Library does NOT provide:');
  console.log('  - Pre-configured global instances');
  console.log('  - Environment variable reading');
  console.log('  - Auto-initialization');
  console.log('  - Configuration assumptions');
  console.log('');
  console.log('💡 User controls:');
  console.log('  - Environment variable management');
  console.log('  - Instance creation and configuration');
  console.log('  - Initialization timing');
  console.log('  - Application integration');
  console.log('');
  console.log('📦 Import structure:');
  console.log("  - Core: import { createAnalytics } from '@lobehub/analytics'");
  console.log("  - React: import { useAnalytics } from '@lobehub/analytics/react'");
}

// Run all examples
async function runExamples() {
  await basicUsageExample();
  reactExample();
  designPrinciples();

  console.log('\n🎉 Examples completed!');
}

// Only run when directly executed
if (require.main === module) {
  await runExamples();
}

export { runExamples };
