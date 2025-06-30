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
