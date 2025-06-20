<div align="center"><a name="readme-top"></a>

<img height="160" src="https://registry.npmmirror.com/@lobehub/assets-logo/1.0.0/files/assets/logo-3d.webp">

<h1>Lobe Analytics</h1>

A modern, type-safe analytics library for tracking user events across multiple providers. Built with TypeScript and designed for flexibility and ease of use.

\[!\[]\[npm-release-shield]]\[npm-release-link]
\[!\[]\[github-releasedate-shield]]\[github-releasedate-link]
\[!\[]\[github-action-test-shield]]\[github-action-test-link]
\[!\[]\[github-action-release-shield]]\[github-action-release-link]<br/>
\[!\[]\[github-contributors-shield]]\[github-contributors-link]
\[!\[]\[github-forks-shield]]\[github-forks-link]
\[!\[]\[github-stars-shield]]\[github-stars-link]
\[!\[]\[github-issues-shield]]\[github-issues-link]
\[!\[]\[github-license-shield]]\[github-license-link]

[Changelog](./CHANGELOG.md) · \[Report Bug]\[github-issues-link] · \[Request Feature]\[github-issues-link]

![](https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/rainbow.png)

</div>

<details>
<summary><kbd>Table of contents</kbd></summary>

#### TOC

- [✨ Features](#-features)
- [📦 Installation](#-installation)
- [Import Structure](#import-structure)
- [🚀 Quick Start](#-quick-start)
  - [Basic Usage](#basic-usage)
  - [React Integration](#react-integration)
  - [PostHog Features](#posthog-features)
- [📖 API Reference](#-api-reference)
  - [Core Functions](#core-functions)
  - [React Hooks](#react-hooks)
  - [Types](#types)
- [🛠️ Development](#️-development)
  - [Project Structure](#project-structure)
- [Examples](#examples)
- [License](#license)

####

</details>

## ✨ Features

- 🎯 **Type-safe** - Full TypeScript support with predefined events
- 🔌 **Multi-provider** - Built-in PostHog support, extensible for other providers
- ⚛️ **React integration** - Built-in hooks for React applications
- 🎛️ **Easy configuration** - Simple setup with environment variables
- 🪶 **Lightweight** - Minimal dependencies and optimized bundle size
- 🔧 **Developer-friendly** - Comprehensive error handling and debugging

## 📦 Installation

To install `lobe-analytics`, run the following command:

```bash
npm install lobe-analytics
```

This library includes PostHog analytics provider out of the box. For React integration:

```bash
npm install react # if not already installed
```

## Import Structure

The library provides separate entry points for core functionality and React integration:

```typescript
// Core analytics functionality
import { AnalyticsManager, createAnalytics } from 'lobe-analytics';
// React hooks (separate import)
import { useAnalytics, useEventTracking } from 'lobe-analytics/react';
```

<div align="right">

[!\[\]\[back-to-top\]](#readme-top)

</div>

## 🚀 Quick Start

### Basic Usage

```typescript
import { createAnalytics } from 'lobe-analytics';

// Configure analytics
const analytics = createAnalytics({
  debug: process.env.NODE_ENV === 'development',
  providers: {
    posthog: {
      enabled: !!process.env.POSTHOG_KEY,
      key: process.env.POSTHOG_KEY!,
      host: process.env.POSTHOG_HOST, // optional
    },
  },
});

// Initialize
await analytics.initialize();

// Track events
await analytics.trackEvent('user:signup', {
  method: 'email',
  source: 'landing_page',
});

// Identify users
await analytics.identify('user_123', {
  email: 'user@example.com',
  plan: 'pro',
});
```

### React Integration

```typescript
import React from 'react';
import { createAnalytics } from 'lobe-analytics';
import { useAnalytics, useEventTracking } from 'lobe-analytics/react';

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
```

### PostHog Features

```typescript
import { PostHogAnalyticsProvider } from 'lobe-analytics';

// Access PostHog-specific features
const provider = analytics.getProvider('posthog') as PostHogAnalyticsProvider;

// Check feature flags
const isNewFeatureEnabled = provider.isFeatureEnabled('new-feature');

if (isNewFeatureEnabled) {
  // Show new feature
}
```

<div align="right">

[!\[\]\[back-to-top\]](#readme-top)

</div>

## 📖 API Reference

### Core Functions

#### `createAnalytics(config: AnalyticsConfig): AnalyticsManager`

Creates a configured analytics manager.

#### `AnalyticsManager`

Main class for managing analytics providers.

**Methods:**

- `initialize(): Promise<void>` - Initialize all providers
- `track(event: AnalyticsEvent): Promise<void>` - Track custom event
- `trackEvent<K>(eventName: K, properties): Promise<void>` - Track predefined event
- `identify(userId: string, properties?): Promise<void>` - Identify user
- `trackPageView(page: string, properties?): Promise<void>` - Track page view
- `reset(): Promise<void>` - Reset user identity

### React Hooks

#### `useAnalytics(manager: AnalyticsManager)`

Provides core analytics functionality.

#### `useEventTracking(manager: AnalyticsManager)`

Provides convenient event tracking methods.

### Types

#### `AnalyticsConfig`

```typescript
interface AnalyticsConfig {
  debug?: boolean;
  providers: {
    posthog?: PostHogConfig;
  };
}
```

#### `PostHogConfig`

```typescript
interface PostHogConfig {
  enabled: boolean;
  key: string;
  host?: string;
  debug?: boolean;
}
```

#### `PredefinedEvents`

```typescript
interface PredefinedEvents {
  'user:signup': { method: 'email' | 'oauth' | 'phone'; source?: string };
  'user:login': { method: 'email' | 'oauth' | 'phone' };
  'ui:button_click': { button_name: string; page?: string };
  'form:submit': { form_name: string; success: boolean };
  // ... more events
}
```

<div align="right">

[!\[\]\[back-to-top\]](#readme-top)

</div>

## 🛠️ Development

```bash
# Clone the repository
git clone https://github.com/lobehub/lobe-analytics.git
cd lobe-analytics

# Install dependencies
npm install

# Start development
npm run dev

# Build the library
npm run build

# Run tests
npm test

# Run examples
npm run example
```

### Project Structure

```
lobe-analytics/
├── src/
│   ├── base.ts           # Base analytics provider
│   ├── manager.ts        # Analytics manager
│   ├── config.ts         # Configuration factory
│   ├── hooks.ts          # React hooks
│   ├── types.ts          # TypeScript definitions
│   ├── providers/        # Analytics providers
│   │   └── posthog.ts    # PostHog implementation
│   └── index.ts          # Main exports
├── examples/             # Usage examples
└── dist/                 # Built files (generated)
```

<div align="right">

[!\[\]\[back-to-top\]](#readme-top)

</div>

## Examples

See the `examples/` directory for complete usage examples:

- `examples/library-usage.ts` - Complete usage guide with best practices
- `examples/basic-usage.ts` - Simple implementation example
- `examples/posthog-usage.ts` - PostHog specific features

## License

MIT
