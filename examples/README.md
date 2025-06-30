# Examples

Clean and practical usage examples for `@lobehub/analytics`.

## 📁 Example Files

### [`basic.ts`](./basic.ts)

Basic usage example - configuration, initialization, event tracking

```typescript
import { createAnalytics } from '@lobehub/analytics';

const analytics = createAnalytics({
  business: 'my-app',
  providers: {
    posthog: { enabled: true, key: 'your-key' },
  },
});

await analytics.initialize();
// Predefined events
await analytics.trackEvent('user_signup', { method: 'email' });
// Custom events
await analytics.track({ name: 'feature_used', properties: { feature: 'export' } });
```

### [`react.tsx`](./react.tsx)

React integration example - Provider, hooks, state management

```typescript
import { AnalyticsProvider, useAnalytics } from '@lobehub/analytics/react';

function App() {
  return (
    <AnalyticsProvider client={analytics} autoInitialize registerGlobal>
      <Dashboard />
    </AnalyticsProvider>
  );
}
```

### [`global.ts`](./global.ts)

Global instance management - singleton pattern, named instances

```typescript
// Singleton pattern
const analytics = createSingletonAnalytics(config);
getSingletonAnalytics().trackEvent('user_login', { method: 'email' });

// Named instances
setGlobalAnalytics(analytics, 'main');
getGlobalAnalytics('main').trackEvent('page_view', { page: '/home' });
```

### [`types.ts`](./types.ts)

Type-safe examples - predefined events, custom events

```typescript
// Predefined events (type-safe)
await analytics.trackEvent('user_signup', {
  method: 'email', // Extra properties
  spm: 'homepage.cta',
});

// Custom events
await analytics.track({
  name: 'chat_message_sent',
  properties: { message_length: 150, model: 'gpt-4' },
});
```

### [`spm.ts`](./spm.ts)

SPM auto-prefix example - marketing tracking, process analysis

```typescript
await analytics.trackEvent('button_click', {
  button_name: 'signup',
  spm: 'homepage.hero', // Auto becomes: 'my-app.homepage.hero'
});
```

### [`posthog-node.ts`](./posthog-node.ts)

PostHog Node.js server-side tracking example - backend analytics, feature flags

```typescript
import { PostHogNodeAnalyticsProvider, createAnalytics } from '@lobehub/analytics';

// Method 1: Direct usage
const posthogNode = new PostHogNodeAnalyticsProvider(config, 'my-node-app');
await posthogNode.initialize();

// Method 2: Through Analytics Manager (recommended)
const analytics = createAnalytics({
  business: 'my-node-app',
  providers: {
    posthogNode: {
      enabled: true,
      key: 'phc_your_key',
      personalApiKey: 'your_personal_key', // For feature flags
    },
  },
});
```

## 🚀 Running Examples

```bash
# Install dependencies
npm install

# Set environment variables
export POSTHOG_KEY="your-posthog-key"

# Run examples
npm run dev
```

## 🎯 Currently Supported Predefined Events

Current `PredefinedEvents` interface includes the following events:

- **`button_click`** - Button click event
  - `button_name: string` (required)
  - `spm?: string` (optional)
  - Any other properties

- **`page_view`** - Page view event
  - `page: string` (required)
  - `spm?: string` (optional)
  - Any other properties

- **`user_login`** - User login event
  - `spm?: string` (optional)
  - Any other properties

- **`user_signup`** - User signup event
  - `spm?: string` (optional)
  - Any other properties

## 📝 Usage Guidelines

- **Predefined events** - Use `trackEvent()` method for type safety
- **Custom events** - Use `track()` method for flexible handling
- **Property extension** - Predefined events support additional properties (`[key: string]: any`)
- **SPM tracking** - All events support `spm` property with automatic business prefix

## 🎯 Use Cases

- **basic.ts** - Beginner tutorial, simple projects
- **react.tsx** - React application integration
- **global.ts** - Multi-module apps, global state management
- **types.ts** - TypeScript projects, type safety
- **spm.ts** - Marketing analysis, user behavior tracking
- **posthog-node.ts** - Server-side analytics, Node.js backend integration

---

# 🖥️ PostHog Node.js Provider

Server-side analytics provider based on `posthog-node` library, designed for Node.js environments.

## ✨ Features

- ✅ **Server-side Event Tracking** - Backend event analytics
- ✅ **User Identification & Properties** - User profiling and segmentation
- ✅ **Page View Tracking (SSR)** - Server-side rendering page tracking
- ✅ **Feature Flags** - Dynamic feature toggles
- ✅ **Group Identify** - B2B use cases support
- ✅ **User Aliases** - User identity linking
- ✅ **Batch Event Sending** - Performance optimization
- ✅ **Auto Business Context Injection** - Automatic business tagging
- ✅ **SPM Auto-prefix Processing** - Unified tracking standards

## 📦 Installation

```bash
npm install posthog-node
# or
pnpm install posthog-node
```

## 🚀 Basic Usage

### Method 1: Direct Provider Usage

```typescript
import { PostHogNodeAnalyticsProvider } from '@lobehub/analytics';

const posthogNode = new PostHogNodeAnalyticsProvider(
  {
    enabled: true,
    debug: true,
    key: 'phc_your_project_api_key_here',
    host: 'https://app.posthog.com',
    flushAt: 20,
    flushInterval: 10_000,
    personalApiKey: 'your_personal_api_key_here', // Optional, for feature flags
  },
  'my-node-app', // Business context
);

await posthogNode.initialize();
await posthogNode.track({
  name: 'user_action',
  userId: 'user123',
  properties: { action_type: 'api_call' },
});
await posthogNode.shutdown(); // Call on app shutdown
```

### Method 2: Through Analytics Manager (Recommended)

```typescript
import { createAnalytics } from '@lobehub/analytics';

const analytics = createAnalytics({
  business: 'my-node-app',
  debug: true,
  providers: {
    posthogNode: {
      enabled: true,
      key: 'phc_your_project_api_key_here',
      host: 'https://app.posthog.com',
      personalApiKey: 'your_personal_api_key_here',
    },
  },
});

await analytics.initialize();
await analytics.track({
  name: 'user_action',
  userId: 'user123',
  properties: { action_type: 'button_click' },
});

// Advanced features
const posthogNode = analytics.getProvider('posthogNode');
if (posthogNode) {
  const isEnabled = await posthogNode.isFeatureEnabled('new-feature', 'user123');
}
```

## ⚙️ Configuration Options

Configuration interface extends `PostHogOptions` from `posthog-node`, supporting all native options:

| Option                        | Type    | Default                     | Description                                   |
| ----------------------------- | ------- | --------------------------- | --------------------------------------------- |
| `enabled`                     | boolean | true                        | Whether to enable provider                    |
| `debug`                       | boolean | false                       | Whether to enable debug mode                  |
| `key`                         | string  | -                           | PostHog project API key                       |
| `host`                        | string  | '<https://app.posthog.com>' | PostHog service host                          |
| `flushAt`                     | number  | 20                          | Number of events to batch before sending      |
| `flushInterval`               | number  | 10000                       | Batch send interval (milliseconds)            |
| `personalApiKey`              | string  | -                           | Personal API key (required for feature flags) |
| `featureFlagsPollingInterval` | number  | -                           | Feature flags polling interval                |
| `requestTimeout`              | number  | -                           | Request timeout                               |
| `disableGeoip`                | boolean | -                           | Whether to disable GeoIP detection            |

## 🔧 Core Methods

### Event Tracking

```typescript
await posthogNode.track({
  name: 'purchase_completed',
  userId: 'user123',
  properties: {
    amount: 99.99,
    currency: 'USD',
    spm: 'checkout.purchase_button',
  },
});
```

### User Identification

```typescript
await posthogNode.identify('user123', {
  email: 'user@example.com',
  name: 'John Doe',
  plan: 'premium',
});
```

### Feature Flags

```typescript
// Check if feature flag is enabled
const isEnabled = await posthogNode.isFeatureEnabled('new-feature', 'user123');

// Get feature flag value
const variant = await posthogNode.getFeatureFlag('feature-variant', 'user123');

// Get all feature flags
const allFlags = await posthogNode.getAllFlags('user123');
```

### Group Identify (B2B Use Cases)

```typescript
await posthogNode.groupIdentify('company', 'company_123', {
  name: 'Acme Corp',
  plan: 'enterprise',
  employees: 500,
});
```

### User Aliases

```typescript
await posthogNode.alias('user123', 'john.doe@example.com');
```

## 🎯 Business Context and SPM

Automatically adds business context to all events:

```typescript
// Business context: 'my-app'
await posthogNode.track({
  name: 'button_click',
  properties: {
    spm: 'user_center.profile_edit', // Auto becomes 'my-app.user_center.profile_edit'
  },
});

// If no spm provided, automatically uses business name
await posthogNode.track({
  name: 'page_view',
  properties: {
    page: '/dashboard',
    // spm auto-set to 'my-app'
  },
});
```

## 🔍 Direct Native Instance Access

```typescript
const nativeClient = posthogNode.getNativeInstance();
if (nativeClient) {
  // Use posthog-node API directly
  nativeClient.capture({
    distinctId: 'user123',
    event: 'custom_event',
    properties: { custom: 'data' },
  });
}
```

## 💡 Best Practices

1. **Initialize on app startup**: Call `initialize()` when your application starts
2. **Graceful shutdown**: Call `shutdown()` on app termination to ensure all events are sent
3. **Error handling**: All methods have built-in error handling and won't throw exceptions
4. **Batch sending**: Configure `flushAt` and `flushInterval` to balance performance and timeliness
5. **Feature flags**: Requires `personalApiKey` to use feature flag functionality

## 🆚 PostHog Node.js vs Browser Differences

| Feature            | PostHog Node.js              | PostHog Browser |
| ------------------ | ---------------------------- | --------------- |
| Environment        | Server-side                  | Browser-side    |
| Auto Page Tracking | ❌                           | ✅              |
| Feature Flags      | ✅ (requires personalApiKey) | ✅              |
| Session Recording  | ❌                           | ✅              |
| Heatmaps           | ❌                           | ✅              |
| Batch Sending      | ✅                           | ✅              |
| Group Identify     | ✅                           | ✅              |

## ⚠️ Important Notes

- Server-side doesn't support automatic page tracking, call `trackPageView()` manually
- Feature flags functionality requires providing `personalApiKey`
- Remember to call `shutdown()` method when your application terminates
- All operations are async, use `await`
