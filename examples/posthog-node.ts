import { PostHogNodeAnalyticsProvider } from '../src/providers/posthog-node';

// Example of how to use PostHog Node.js Analytics Provider
async function example() {
  // Create PostHog Node.js provider instance
  const posthogNode = new PostHogNodeAnalyticsProvider(
    {
      debug: true,
      enabled: true,
      featureFlagsPollingInterval: 30_000,
      flushAt: 20,
      flushInterval: 10_000,
      host: 'https://app.posthog.com',
      key: 'phc_your_project_api_key_here',
      personalApiKey: 'your_personal_api_key_here', // Optional, for feature flags
    },
    'my-node-app', // business context
  );

  try {
    // Initialize the provider
    await posthogNode.initialize();

    // Track events
    await posthogNode.track({
      name: 'server_action',
      properties: {
        action: 'api_call',
        endpoint: '/api/users',
        method: 'POST',
        spm: 'backend.user_creation',
      },
      userId: 'user123',
    });

    // Identify user
    await posthogNode.identify('user123', {
      email: 'user@example.com',
      name: 'John Doe',
      plan: 'premium',
    });

    // Track page view (for server-side rendering)
    await posthogNode.trackPageView('/dashboard', {
      referrer: '/login',
      user_id: 'user123',
    });

    // Check feature flags
    const isNewFeatureEnabled = await posthogNode.isFeatureEnabled('new-feature', 'user123');
    console.log('New feature enabled:', isNewFeatureEnabled);

    // Get feature flag value
    const featureVariant = await posthogNode.getFeatureFlag('feature-variant', 'user123');
    console.log('Feature variant:', featureVariant);

    // Get all flags for user
    const allFlags = await posthogNode.getAllFlags('user123');
    console.log('All flags:', allFlags);

    // Group identify (for B2B use cases)
    await posthogNode.groupIdentify('company', 'company_123', {
      employees: 500,
      name: 'Acme Corp',
      plan: 'enterprise',
    });

    // Create alias
    await posthogNode.alias('user123', 'john.doe@example.com');

    // Direct access to native PostHog instance
    const nativeClient = posthogNode.getNativeInstance();
    if (nativeClient) {
      // Use native PostHog Node.js API directly
      nativeClient.capture({
        distinctId: 'user123',
        event: 'direct_native_call',
        properties: {
          custom: 'data',
          // business and spm will be automatically added by the wrapper
        },
      });
    }

    // Flush events (ensure all events are sent)
    await posthogNode.flush();

    console.log('PostHog Node.js example completed successfully');
  } catch (error) {
    console.error('Error in PostHog Node.js example:', error);
  } finally {
    // Shutdown client when done (important for graceful shutdown)
    await posthogNode.shutdown();
  }
}

// Run example if this file is executed directly
if (require.main === module) {
  // eslint-disable-next-line unicorn/prefer-top-level-await
  example().catch(console.error);
}

export { example };
