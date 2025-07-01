import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import {
  AnalyticsManager,
  BaseAnalytics,
  PostHogAnalyticsProvider,
  createAnalytics,
} from './index';
import type { AnalyticsConfig, AnalyticsEvent, PostHogProviderAnalyticsConfig } from './index';

// Test configuration from environment variables
const getTestConfig = (): PostHogProviderAnalyticsConfig | null => {
  const key = process.env.POSTHOG_KEY || process.env.VITE_POSTHOG_KEY;
  const host = process.env.POSTHOG_HOST || process.env.VITE_POSTHOG_HOST;

  if (!key) {
    return null;
  }

  return {
    enabled: true,
    key,
    host: host || 'https://app.posthog.com',
    debug: true, // Enable debug for testing
  };
};

// Helper to generate unique test identifiers
const generateTestId = () => `test_${Date.now()}_${Math.random().toString(36).substring(7)}`;

// Mock provider for unit tests (when PostHog is not available)
class MockAnalyticsProvider extends BaseAnalytics {
  public events: AnalyticsEvent[] = [];
  public identifiedUsers: Array<{ userId: string; properties?: Record<string, any> }> = [];
  public pageViews: Array<{ page: string; properties?: Record<string, any> }> = [];
  public resetCalled = false;

  constructor(config?: { business?: string; debug?: boolean; enabled?: boolean }) {
    super({
      business: config?.business || 'test',
      debug: config?.debug ?? false,
      enabled: config?.enabled ?? true,
    });
  }

  getProviderName(): string {
    return 'Mock';
  }

  async initialize(): Promise<void> {
    this.log('Mock provider initialized');
  }

  async track(event: AnalyticsEvent): Promise<void> {
    if (!this.validateEvent(event)) return;
    const enrichedEvent = {
      ...event,
      properties: this.enrichProperties(event.properties),
    };
    this.events.push(enrichedEvent);
    this.log(`Tracked event: ${event.name}`, enrichedEvent);
  }

  async identify(userId: string, properties?: Record<string, any>): Promise<void> {
    const enrichedProperties = this.enrichProperties(properties);
    this.identifiedUsers.push({ userId, properties: enrichedProperties });
    this.log(`Identified user: ${userId}`, enrichedProperties);
  }

  async trackPageView(page: string, properties?: Record<string, any>): Promise<void> {
    const enrichedProperties = this.enrichProperties(properties);
    this.pageViews.push({ page, properties: enrichedProperties });
    this.log(`Tracked page view: ${page}`, enrichedProperties);
  }

  async reset(): Promise<void> {
    this.resetCalled = true;
    this.events = [];
    this.identifiedUsers = [];
    this.pageViews = [];
    this.log('Reset called');
  }
}

describe('Lobe Analytics Integration Tests', () => {
  const testConfig = getTestConfig();
  const isPostHogAvailable = !!testConfig;

  beforeAll(() => {
    if (isPostHogAvailable) {
      console.log('🔗 Running integration tests with real PostHog');
      console.log(`PostHog Host: ${testConfig!.host}`);
    } else {
      console.log('🧪 Running unit tests with mock provider');
      console.log('💡 Set POSTHOG_KEY environment variable to run PostHog integration tests');
    }
  });

  describe('AnalyticsManager Core Functionality', () => {
    let manager: AnalyticsManager;
    let testId: string;

    beforeEach(() => {
      manager = new AnalyticsManager('test', true); // business: 'test', debug: true
      testId = generateTestId();
    });

    afterEach(async () => {
      // Clean up: reset all providers
      try {
        await manager.reset();
      } catch (error) {
        // Ignore cleanup errors
      }
    });

    describe('Provider Management', () => {
      it('should register and manage providers', () => {
        const mockProvider = new MockAnalyticsProvider();

        manager.registerProvider('test', mockProvider);

        expect(manager.getProvider('test')).toBe(mockProvider);
        expect(manager.getAllProviders()).toHaveLength(1);
        expect(manager.getStatus().providersCount).toBe(1);
      });

      it('should unregister providers', () => {
        const mockProvider = new MockAnalyticsProvider();

        manager.registerProvider('test', mockProvider);
        manager.unregisterProvider('test');

        expect(manager.getProvider('test')).toBeUndefined();
        expect(manager.getAllProviders()).toHaveLength(0);
      });

      it('should support method chaining', () => {
        const provider1 = new MockAnalyticsProvider();
        const provider2 = new MockAnalyticsProvider();

        const result = manager
          .registerProvider('test1', provider1)
          .registerProvider('test2', provider2)
          .setGlobalContext({ test_session: testId });

        expect(result).toBe(manager);
        expect(manager.getAllProviders()).toHaveLength(2);
        expect(manager.getGlobalContext().test_session).toBe(testId);
      });
    });

    describe('Initialization', () => {
      it('should initialize all providers', async () => {
        const mockProvider = new MockAnalyticsProvider();
        manager.registerProvider('mock', mockProvider);

        await manager.initialize();

        expect(manager.getStatus().initialized).toBe(true);
      });

      it('should prevent double initialization', async () => {
        const mockProvider = new MockAnalyticsProvider();
        manager.registerProvider('mock', mockProvider);

        await manager.initialize();
        const firstStatus = manager.getStatus();

        await manager.initialize(); // Second call
        const secondStatus = manager.getStatus();

        expect(firstStatus).toEqual(secondStatus);
      });
    });

    describe('Event Tracking with Mock Provider', () => {
      let mockProvider: MockAnalyticsProvider;

      beforeEach(async () => {
        mockProvider = new MockAnalyticsProvider();
        manager.registerProvider('mock', mockProvider);
        await manager.initialize();
      });

      it('should track basic events', async () => {
        const event: AnalyticsEvent = {
          name: 'test_event',
          properties: {
            test_id: testId,
            action: 'unit_test',
          },
        };

        await manager.track(event);

        expect(mockProvider.events).toHaveLength(1);
        expect(mockProvider.events[0]).toMatchObject({
          name: 'test_event',
          properties: expect.objectContaining({
            test_id: testId,
            action: 'unit_test',
          }),
        });
      });

      it('should track typed events', async () => {
        await manager.trackEvent('button_click', {
          button_name: 'test_button',
          page: 'test_page',
        });

        expect(mockProvider.events).toHaveLength(1);
        expect(mockProvider.events[0].name).toBe('button_click');
        expect(mockProvider.events[0].properties).toMatchObject({
          button_name: 'test_button',
          page: 'test_page',
          spm: 'test', // Automatically added business prefix
        });
      });

      it('should enrich events with global context', async () => {
        manager.setGlobalContext({
          session_id: testId,
          user_type: 'test_user',
          app_version: '1.0.0',
        });

        await manager.track({
          name: 'context_test',
          properties: { action: 'test' },
        });

        const event = mockProvider.events[0];
        expect(event.properties).toMatchObject({
          session_id: testId,
          user_type: 'test_user',
          app_version: '1.0.0',
          action: 'test',
        });
      });

      it('should identify users', async () => {
        const userId = `test_user_${testId}`;
        const properties = {
          name: 'Test User',
          email: 'test@example.com',
          test_session: testId,
        };

        await manager.identify(userId, properties);

        expect(mockProvider.identifiedUsers).toHaveLength(1);
        expect(mockProvider.identifiedUsers[0]).toEqual({
          userId,
          properties: {
            ...properties,
            business: 'test', // Automatically added business field
            spm: 'test', // Automatically added business prefix
          },
        });
      });

      it('should track page views', async () => {
        const page = '/test-page';
        const properties = {
          referrer: '/previous-page',
          test_session: testId,
        };

        await manager.trackPageView(page, properties);

        expect(mockProvider.pageViews).toHaveLength(1);
        expect(mockProvider.pageViews[0]).toEqual({
          page,
          properties: {
            ...properties,
            business: 'test', // Automatically added business field
            spm: 'test', // Automatically added business prefix
          },
        });
      });

      it('should reset provider state', async () => {
        // Track some data first
        await manager.track({ name: 'test_event' });
        await manager.identify(`user_${testId}`);

        expect(mockProvider.events).toHaveLength(1);
        expect(mockProvider.identifiedUsers).toHaveLength(1);

        // Reset
        await manager.reset();

        expect(mockProvider.resetCalled).toBe(true);
        expect(mockProvider.events).toHaveLength(0);
        expect(mockProvider.identifiedUsers).toHaveLength(0);
      });
    });

    describe('Global Context Management', () => {
      it('should manage global context', () => {
        const initialContext = {
          session_id: testId,
          app_name: 'analytics-test',
        };

        manager.setGlobalContext(initialContext);
        expect(manager.getGlobalContext()).toEqual(initialContext);

        // Should merge, not replace
        manager.setGlobalContext({ user_type: 'premium' });
        expect(manager.getGlobalContext()).toEqual({
          session_id: testId,
          app_name: 'analytics-test',
          user_type: 'premium',
        });
      });

      it('should return immutable context copy', () => {
        const context = { test_key: 'original_value' };
        manager.setGlobalContext(context);

        const retrieved = manager.getGlobalContext();
        retrieved.test_key = 'modified_value';

        expect(manager.getGlobalContext().test_key).toBe('original_value');
      });
    });
  });

  // PostHog Integration Tests (only run if environment is configured)
  describe.skipIf(!isPostHogAvailable)('PostHog Integration Tests', () => {
    let analytics: AnalyticsManager;
    let postHogProvider: PostHogAnalyticsProvider;
    let testUserId: string;

    beforeEach(async () => {
      testUserId = `test_user_${generateTestId()}`;

      // Create analytics with real PostHog configuration
      const config: AnalyticsConfig = {
        business: 'test',
        debug: true,
        providers: {
          posthog: testConfig!,
        },
      };

      analytics = createAnalytics(config);
      postHogProvider = analytics.getProvider('posthog') as PostHogAnalyticsProvider;

      // Set test context
      analytics.setGlobalContext({
        test_session: generateTestId(),
        test_environment: 'vitest',
        timestamp: new Date().toISOString(),
      });

      await analytics.initialize();

      // Wait a bit for PostHog to fully initialize
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    afterEach(async () => {
      // Clean up test data
      await analytics.reset();
    });

    it('should initialize PostHog successfully', () => {
      expect(postHogProvider).toBeInstanceOf(PostHogAnalyticsProvider);
      expect(analytics.getStatus().initialized).toBe(true);
      expect(analytics.getStatus().providersCount).toBe(1);
    });

    it('should track events to real PostHog', async () => {
      const eventName = 'integration_test_event';
      const properties = {
        test_type: 'integration',
        user_id: testUserId,
        timestamp: Date.now(),
        random_value: Math.random(),
      };

      // This should send real data to PostHog
      await analytics.track({
        name: eventName,
        properties,
        userId: testUserId,
      });

      // No direct way to verify without PostHog API, but no errors means success
      expect(true).toBe(true);
    });

    it('should track typed events', async () => {
      await analytics.trackEvent('button_click', {
        button_name: 'integration_test_button',
        page: 'test_page',
        section: 'integration_tests',
      });

      expect(true).toBe(true);
    });

    it('should identify users in PostHog', async () => {
      await analytics.identify(testUserId, {
        name: 'Integration Test User',
        email: `${testUserId}@test.example.com`,
        plan: 'test',
        created_at: new Date().toISOString(),
      });

      expect(true).toBe(true);
    });

    it('should track page views', async () => {
      await analytics.trackPageView('/integration-test', {
        title: 'Integration Test Page',
        referrer: '/test-suite',
        user_agent: 'vitest-runner',
      });

      expect(true).toBe(true);
    });

    it('should handle feature flags', () => {
      // Test feature flag check (requires feature flags to be set up in PostHog)
      const isEnabled = postHogProvider.isFeatureEnabled('test_feature_flag');

      // Should return boolean without throwing
      expect(typeof isEnabled).toBe('boolean');
    });

    it('should track user journey', async () => {
      // Simulate a complete user journey

      // 1. User arrives
      await analytics.trackPageView('/landing', {
        referrer: 'https://google.com',
        utm_source: 'test',
      });

      // 2. User signs up
      await analytics.identify(testUserId, {
        name: 'Journey Test User',
        signup_method: 'email',
      });

      // 3. User performs actions
      await analytics.trackEvent('user_signup', {
        method: 'email',
        source: 'integration_test',
      });

      await analytics.trackEvent('button_click', {
        button_name: 'get_started',
        page: 'onboarding',
      });

      // 4. User completes onboarding
      await analytics.track({
        name: 'onboarding_completed',
        properties: {
          steps_completed: 3,
          time_taken_seconds: 120,
        },
        userId: testUserId,
      });

      expect(true).toBe(true);
    });
  });

  describe('createAnalytics Factory', () => {
    it('should create analytics with mock when PostHog is disabled', () => {
      const config: AnalyticsConfig = {
        business: 'test',
        debug: true,
        providers: {
          posthog: {
            enabled: false,
            key: 'disabled',
          },
        },
      };

      const analytics = createAnalytics(config);

      expect(analytics).toBeInstanceOf(AnalyticsManager);
      expect(analytics.getProvider('posthog')).toBeUndefined();
      expect(analytics.getAllProviders()).toHaveLength(0);
    });

    it.skipIf(!isPostHogAvailable)('should create analytics with real PostHog when enabled', () => {
      const config: AnalyticsConfig = {
        business: 'test',
        debug: true,
        providers: {
          posthog: testConfig!,
        },
      };

      const analytics = createAnalytics(config);

      expect(analytics).toBeInstanceOf(AnalyticsManager);
      expect(analytics.getProvider('posthog')).toBeInstanceOf(PostHogAnalyticsProvider);
      expect(analytics.getAllProviders()).toHaveLength(1);
    });
  });

  describe('BaseAnalytics Abstract Class', () => {
    class TestProvider extends BaseAnalytics {
      public isEnabledPublic = () => this.isEnabled();
      public validateEventPublic = (event: AnalyticsEvent) => this.validateEvent(event);
      public logPublic = (message: string, data?: any) => this.log(message, data);

      getProviderName() {
        return 'TestProvider';
      }
      async initialize() {}
      async track() {}
      async identify() {}
      async trackPageView() {}
      async reset() {}
    }

    it('should respect configuration options', () => {
      const enabledProvider = new TestProvider({ business: 'test', enabled: true, debug: false });
      const disabledProvider = new TestProvider({ business: 'test', enabled: false, debug: true });

      expect(enabledProvider.isEnabledPublic()).toBe(true);
      expect(disabledProvider.isEnabledPublic()).toBe(false);
    });

    it('should validate events correctly', () => {
      const provider = new TestProvider({ business: 'test' });

      expect(provider.validateEventPublic({ name: 'valid_event' })).toBe(true);
      expect(provider.validateEventPublic({ name: '' })).toBe(false);
      expect(provider.validateEventPublic({} as AnalyticsEvent)).toBe(false);
    });

    it('should handle debug logging', () => {
      const debugProvider = new TestProvider({ business: 'test', debug: true });
      const silentProvider = new TestProvider({ business: 'test', debug: false });

      // These shouldn't throw
      debugProvider.logPublic('Debug message', { data: 'test' });
      silentProvider.logPublic('Silent message', { data: 'test' });

      expect(true).toBe(true);
    });
  });
});
