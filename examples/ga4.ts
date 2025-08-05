/**
 * Google Analytics 4 Provider Example
 *
 * This example demonstrates how to use the GA4 provider with Lobe Analytics
 */
import { createAnalytics } from '../src/config';

// Create analytics instance with GA4 provider
const analytics = createAnalytics({
  business: 'myapp',
  debug: true,
  providers: {
    ga4: {
      enabled: true,
      // Replace with your GA4 Measurement ID
      gtagConfig: {
        // Optional: GA4 configuration options
        debug_mode: true,
      },
      measurementId: 'G-XXXXXXXXXX',
    },
  },
});

// Example usage function
async function exampleUsage() {
  try {
    // Initialize analytics
    await analytics.initialize();
    console.log('GA4 Analytics initialized successfully');

    // Track a basic event
    await analytics.track({
      name: 'button_click',
      properties: {
        button_name: 'subscribe_now',
        section: 'header',
        user_type: 'visitor',
      },
    });

    // Track page view
    await analytics.trackPageView('/home', {
      referrer: document.referrer,
      user_agent: navigator.userAgent,
    });

    // Identify a user (after login)
    await analytics.identify('user_12345', {
      subscription_level: 'premium',
      total_purchases: 5,
      user_type: 'customer',
    });

    // Track more events after user identification
    await analytics.track({
      name: 'purchase',
      properties: {
        currency: 'USD',
        items: [
          {
            category: 'subscription',
            item_id: 'product_123',
            item_name: 'Premium Subscription',
            price: 99.99,
            quantity: 1,
          },
        ],
        transaction_id: 'txn_abc123',
        value: 99.99,
      },
    });

    // Use predefined events for type safety
    await analytics.trackEvent('user_login', {
      method: 'google',
      user_type: 'returning',
    });

    // Set global context that will be added to all future events
    analytics.setGlobalContext({
      app_version: '1.2.3',
      experiment_variant: 'control',
    });

    // Reset user identity (on logout)
    await analytics.reset();

    console.log('All GA4 events tracked successfully');
  } catch (error) {
    console.error('GA4 Analytics error:', error);
  }
}

// Advanced usage: Direct access to gtag
async function advancedUsage() {
  await analytics.initialize();

  // Get the GA4 provider for direct access
  const ga4Provider = analytics.getProvider('ga4');

  if (ga4Provider) {
    // Get native gtag function for advanced GA4 features
    const gtag = (ga4Provider as any).getNativeInstance?.();

    if (gtag) {
      // Direct gtag calls (remember to add business context manually)
      gtag('event', 'custom_conversion', {
        business: 'myapp',
        currency: 'USD',
        // Remember to add business context for consistency
        spm: 'myapp.checkout',
        value: 25.99, // Add spm for tracking hierarchy
      });

      // Set up custom audience events
      gtag('event', 'add_to_wishlist', {
        business: 'myapp',
        item_id: 'product_456',
        spm: 'myapp.product_page',
      });

      // Configure enhanced measurement
      gtag('config', (ga4Provider as any).getMeasurementId?.(), {
        enhanced_conversions: true,
        user_id: 'user_12345',
      });
    }

    // Get current business context
    console.log('Current business:', (ga4Provider as any).getCurrentBusiness?.());
    console.log('Measurement ID:', (ga4Provider as any).getMeasurementId?.());
  }
}

// Error handling example
async function errorHandlingExample() {
  try {
    await analytics.initialize();

    // Track event with potential errors
    await analytics.track({
      name: 'error_occurred',
      properties: {
        error_message: 'Invalid email format',
        error_type: 'validation_error',
        page: window.location.pathname,
      },
    });
  } catch (error) {
    console.error('Failed to track error event:', error);
  }
}

// Export functions for testing/demo purposes
export { advancedUsage, analytics, errorHandlingExample, exampleUsage };

// Run example if this file is executed directly
if (typeof window !== 'undefined') {
  // Browser environment - you can call these functions manually
  console.log('GA4 Analytics Example loaded. Call exampleUsage() to test.');

  // Uncomment to run automatically:
  // exampleUsage();
}
