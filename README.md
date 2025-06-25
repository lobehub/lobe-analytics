<div align="center"><a name="readme-top"></a>

<img height="160" src="https://registry.npmmirror.com/@lobehub/assets-logo/1.0.0/files/assets/logo-3d.webp">

<h1>Lobe Analytics</h1>

A modern, type-safe analytics library for tracking user events across multiple providers, built by LobeHub

[![][npm-release-shield]][npm-release-link]
[![][github-releasedate-shield]][github-releasedate-link]
[![][github-action-test-shield]][github-action-test-link]
[![][github-action-release-shield]][github-action-release-link]<br/>
[![][github-contributors-shield]][github-contributors-link]
[![][github-forks-shield]][github-forks-link]
[![][github-stars-shield]][github-stars-link]
[![][github-issues-shield]][github-issues-link]
[![][github-license-shield]][github-license-link]

[Changelog](./CHANGELOG.md) · [Report Bug][github-issues-link] · [Request Feature][github-issues-link]

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
  - [Global Instance Management](#global-instance-management)
  - [React Integration](#react-integration)
  - [SPM (Source Page Medium) Auto-Prefixing](#spm-source-page-medium-auto-prefixing)
- [📖 API Reference](#-api-reference)
  - [Core Functions](#core-functions)
  - [Global Instance Management](#global-instance-management-1)
  - [React Hooks & Provider](#react-hooks--provider)
  - [Types](#types)
- [🛠️ Development](#️-development)
  - [Project Structure](#project-structure)
- [Examples](#examples)
- [🤝 Contributing](#-contributing)

####

</details>

## ✨ Features

- 🎯 **Type-safe** - Full TypeScript support with predefined events
- 🔌 **Multi-provider** - Built-in PostHog support, extensible for other providers
- 🌐 **Global Instance Management** - Singleton pattern and named global instances
- 📊 **SPM Auto-Prefixing** - Automatic Source Page Medium tracking with business prefixes
- ⚛️ **React integration** - Enhanced Provider with auto-registration and hooks
- 🎛️ **Easy configuration** - Simple setup with business context
- 🪶 **Lightweight** - Minimal dependencies and optimized bundle size
- 🔧 **Developer-friendly** - Comprehensive error handling and debugging
- 🧪 **Test-friendly** - Built-in reset and cleanup functions

## 📦 Installation

To install `@lobehub/analytics`, run the following command:

```bash
npm install @lobehub/analytics
```

This library includes PostHog analytics provider out of the box. For React integration:

```bash
npm install react # if not already installed
```

## Import Structure

The library provides separate entry points for core functionality and React integration:

```typescript
// Core analytics functionality
import { AnalyticsManager, createAnalytics } from '@lobehub/analytics';
// Global instance management
import {
  createSingletonAnalytics,
  getGlobalAnalytics,
  getSingletonAnalytics,
} from '@lobehub/analytics';
// React hooks (separate import)
import {
  AnalyticsProvider,
  useAnalytics,
  useAnalyticsStrict,
  useEventTracking,
} from '@lobehub/analytics/react';
```

<div align="right">

[![][back-to-top]](#readme-top)

</div>

## 🚀 Quick Start

### Basic Usage

```typescript
import { createAnalytics } from '@lobehub/analytics';

// Configure analytics with business context
const analytics = createAnalytics({
  business: 'my-app', // Required: business name for SPM prefixing
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

// Track events with automatic SPM prefixing
await analytics.trackEvent('user_signup', {
  method: 'email',
  source: 'landing_page',
  spm: 'homepage.cta', // Will become: 'my-app.homepage.cta'
});

// Identify users
await analytics.identify('user_123', {
  email: 'user@example.com',
  plan: 'pro',
});
```

### Global Instance Management

**Singleton Pattern (Recommended for simple apps):**

```typescript
import { createSingletonAnalytics, getSingletonAnalytics } from '@lobehub/analytics';

// Create singleton (usually in app initialization)
const analytics = createSingletonAnalytics({
  business: 'my-app',
  providers: {
    posthog: {
      enabled: true,
      key: process.env.POSTHOG_KEY!,
    },
  },
});

await analytics.initialize();

// Access from anywhere in your application
export function trackUserAction() {
  const analytics = getSingletonAnalytics();
  analytics.trackEvent('button_click', {
    button_name: 'signup',
    page: 'home',
  });
}
```

**Named Global Instances (For complex apps):**

```typescript
import { getGlobalAnalytics, setGlobalAnalytics } from '@lobehub/analytics';

// Register multiple instances
setGlobalAnalytics(mainAnalytics, 'main');
setGlobalAnalytics(adminAnalytics, 'admin');

// Use specific instances
getGlobalAnalytics('main').trackEvent('user_action', {});
getGlobalAnalytics('admin').trackEvent('admin_action', {});
```

### React Integration

**Enhanced AnalyticsProvider with auto-registration:**

```typescript
import React from 'react';
import { createAnalytics } from '@lobehub/analytics';
import {
  AnalyticsProvider,
  useAnalytics,
  useAnalyticsStrict
} from '@lobehub/analytics/react';

// Create analytics instance
const analytics = createAnalytics({
  business: 'my-app',
  providers: {
    posthog: {
      enabled: true,
      key: process.env.REACT_APP_POSTHOG_KEY!,
    },
  },
});

// Provider with auto-registration
function App() {
  return (
    <AnalyticsProvider
      client={analytics}
      autoInitialize={true}      // Auto-initialize on mount
      registerGlobal={true}      // Auto-register as global instance
      globalName="main"          // Optional: custom global name
    >
      <MyComponent />
    </AnalyticsProvider>
  );
}

// Use in components
function MyComponent() {
  const { analytics, isReady, isInitializing, error } = useAnalytics();

  // Safe usage with state checking
  if (isInitializing) return <div>Loading analytics...</div>;
  if (error) return <div>Analytics error: {error.message}</div>;
  if (!isReady) return <div>Analytics not ready</div>;

  const handleClick = () => {
    analytics?.trackEvent('button_click', {
      button_name: 'cta',
      page: 'home',
    });
  };

  return <button onClick={handleClick}>Track Event</button>;
}

// Strict mode (throws if not initialized)
function StrictComponent() {
  const analytics = useAnalyticsStrict(); // Throws if not ready

  const handleClick = () => {
    analytics.trackEvent('button_click', { button_name: 'strict-button' });
  };

  return <button onClick={handleClick}>Strict Track</button>;
}
```

**Access analytics outside React components:**

```typescript
import { getGlobalAnalytics } from '@lobehub/analytics/react';

// In service functions, API handlers, etc.
export async function apiCall() {
  try {
    const response = await fetch('/api/data');

    // Track success
    const analytics = getGlobalAnalytics('main');
    analytics.trackEvent('api_call', {
      endpoint: '/api/data',
      success: true,
    });

    return response.json();
  } catch (error) {
    // Track error
    const analytics = getGlobalAnalytics('main');
    analytics.trackEvent('api_call', {
      endpoint: '/api/data',
      success: false,
      error: error.message,
    });
    throw error;
  }
}
```

### SPM (Source Page Medium) Auto-Prefixing

The library automatically handles SPM prefixing with your business name:

```typescript
const analytics = createAnalytics({
  business: 'my-app', // This will prefix all SPM values
  // ... other config
});

// These events will have SPM auto-prefixed:
analytics.trackEvent('button_click', {
  button_name: 'signup',
  spm: 'homepage.hero', // Becomes: 'my-app.homepage.hero'
});

analytics.trackEvent('page_view', {
  page: '/dashboard',
  spm: 'dashboard.main', // Becomes: 'my-app.dashboard.main'
});

// If no SPM provided, uses business name as default
analytics.trackEvent('user_login', {
  method: 'email',
  // spm will be: 'my-app'
});
```

<div align="right">

[![][back-to-top]](#readme-top)

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
- `setGlobalContext(context: EventContext): this` - Set global context
- `getStatus(): { initialized: boolean; providersCount: number }` - Get status

### Global Instance Management

#### Singleton Pattern

```typescript
// Create singleton
createSingletonAnalytics(config: AnalyticsConfig): AnalyticsManager

// Get singleton
getSingletonAnalytics(): AnalyticsManager
getSingletonAnalyticsOptional(): AnalyticsManager | null

// Check singleton
hasSingletonAnalytics(): boolean
resetSingletonAnalytics(): void // For testing
```

#### Named Global Instances

```typescript
// Register/unregister
setGlobalAnalytics(instance: AnalyticsManager, name?: string): void
removeGlobalAnalytics(name?: string): boolean
clearGlobalAnalytics(): void

// Access
getGlobalAnalytics(name?: string): AnalyticsManager
getGlobalAnalyticsOptional(name?: string): AnalyticsManager | null

// Utilities
hasGlobalAnalytics(name?: string): boolean
getGlobalAnalyticsNames(): string[]
```

### React Hooks & Provider

#### `AnalyticsProvider`

```typescript
<AnalyticsProvider
  client={AnalyticsManager}
  autoInitialize?: boolean      // Default: true
  registerGlobal?: boolean      // Default: true
  globalName?: string           // Default: '__default__'
>
  {children}
</AnalyticsProvider>
```

#### React Hooks

```typescript
// Safe access with state
useAnalytics(): {
  analytics: AnalyticsManager | null;
  isReady: boolean;
  isInitialized: boolean;
  isInitializing: boolean;
  error: Error | null;
}

// Strict access (throws if not ready)
useAnalyticsStrict(): AnalyticsManager

// State only
useAnalyticsState(): {
  isReady: boolean;
  isInitialized: boolean;
  isInitializing: boolean;
  error: Error | null;
}

// Optional access
useAnalyticsOptional(): AnalyticsManager | null

// Legacy hook (for backward compatibility)
useEventTracking(manager: AnalyticsManager): {
  trackButtonClick: (buttonName: string, properties?: any) => void;
  // ... other convenience methods
}
```

### Types

#### `AnalyticsConfig`

```typescript
interface AnalyticsConfig {
  business: string; // Required: business name for SPM prefixing
  debug?: boolean;
  providers: {
    posthog?: PostHogProviderAnalyticsConfig;
    umami?: UmamiProviderAnalyticsConfig;
    ga?: GoogleProviderAnalyticsConfig;
  };
}
```

#### `PostHogProviderAnalyticsConfig`

```typescript
interface PostHogProviderAnalyticsConfig {
  enabled: boolean;
  key: string;
  host?: string;
  debug?: boolean;
  // ... other PostHog config options
}
```

#### `PredefinedEvents`

```typescript
interface PredefinedEvents {
  // UI interactions
  button_click: {
    button_name: string;
    page?: string;
    section?: string;
    spm?: string;
    [key: string]: any;
  };

  // User actions
  user_signup: {
    method: 'email' | 'oauth' | 'phone';
    source?: string;
    spm?: string;
    [key: string]: any;
  };

  user_login: {
    method: 'email' | 'oauth' | 'phone';
    spm?: string;
    [key: string]: any;
  };

  // Chat interactions
  chat_message_sent: {
    message_length: number;
    model?: string;
    conversation_id?: string;
    spm?: string;
    [key: string]: any;
  };

  // Page tracking
  page_view: {
    page: string;
    referrer?: string;
    spm?: string;
    [key: string]: any;
  };

  // Form interactions
  form_submit: {
    form_name: string;
    success: boolean;
    spm?: string;
    [key: string]: any;
  };
}
```

<div align="right">

[![][back-to-top]](#readme-top)

</div>

## 🛠️ Development

```bash
# Clone the repository
git clone https://github.com/lobehub/@lobehub/analytics.git
cd @lobehub/analytics

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
@lobehub/analytics/
├── src/
│   ├── base.ts           # Base analytics provider
│   ├── manager.ts        # Analytics manager
│   ├── config.ts         # Configuration factory
│   ├── global.ts         # Global instance management
│   ├── types.ts          # TypeScript definitions
│   ├── providers/        # Analytics providers
│   │   └── posthog.ts    # PostHog implementation
│   ├── react/            # React integration
│   │   ├── provider.tsx  # Enhanced Provider component
│   │   └── hooks.ts      # Legacy hooks
│   └── index.ts          # Main exports
├── examples/             # Usage examples
└── dist/                 # Built files (generated)
```

<div align="right">

[![][back-to-top]](#readme-top)

</div>

## Examples

See the `examples/` directory for comprehensive usage examples:

- `examples/library-usage.ts` - Basic library usage and design principles
- `examples/enhanced-react-usage.tsx` - Advanced React integration
- `examples/singleton-enhanced-usage.ts` - Singleton pattern examples
- `examples/global-usage.ts` - Global instance management
- `examples/business-spm-example.ts` - SPM prefixing demonstration
- `examples/usage-summary.md` - Complete feature overview

## 🤝 Contributing

Contributions of all types are more than welcome, if you are interested in contributing code, feel free to check out our GitHub [Issues][github-issues-link] to get stuck in to show us what you’re made of.

[![][pr-welcome-shield]][pr-welcome-link]

[![][github-contrib-shield]][github-contrib-link]

<div align="right">

[![][back-to-top]](#readme-top)

</div>

---

#### 📝 License

Copyright © 2025 [LobeHub][profile-link]. <br />
This project is [MIT](./LICENSE) licensed.

<!-- LINK GROUP -->

[back-to-top]: https://img.shields.io/badge/-BACK_TO_TOP-black?style=flat-square
[github-action-release-link]: https://github.com/lobehub/lobe-analytics/actions/workflows/release.yml
[github-action-release-shield]: https://img.shields.io/github/actions/workflow/status/lobehub/lobe-analytics/release.yml?label=release&labelColor=black&logo=githubactions&logoColor=white&style=flat-square
[github-action-test-link]: https://github.com/lobehub/lobe-analytics/actions/workflows/test.yml
[github-action-test-shield]: https://img.shields.io/github/actions/workflow/status/lobehub/lobe-analytics/test.yml?label=test&labelColor=black&logo=githubactions&logoColor=white&style=flat-square
[github-contrib-link]: https://github.com/lobehub/lobe-analytics/graphs/contributors
[github-contrib-shield]: https://contrib.rocks/image?repo=lobehub%2Flobe-analytics
[github-contributors-link]: https://github.com/lobehub/lobe-analytics/graphs/contributors
[github-contributors-shield]: https://img.shields.io/github/contributors/lobehub/lobe-analytics?color=c4f042&labelColor=black&style=flat-square
[github-forks-link]: https://github.com/lobehub/lobe-analytics/network/members
[github-forks-shield]: https://img.shields.io/github/forks/lobehub/lobe-analytics?color=8ae8ff&labelColor=black&style=flat-square
[github-issues-link]: https://github.com/lobehub/lobe-analytics/issues
[github-issues-shield]: https://img.shields.io/github/issues/lobehub/lobe-analytics?color=ff80eb&labelColor=black&style=flat-square
[github-license-link]: https://github.com/lobehub/lobe-analytics/blob/master/LICENSE
[github-license-shield]: https://img.shields.io/github/license/lobehub/lobe-analytics?color=white&labelColor=black&style=flat-square
[github-releasedate-link]: https://github.com/lobehub/lobe-analytics/releases
[github-releasedate-shield]: https://img.shields.io/github/release-date/lobehub/lobe-analytics?labelColor=black&style=flat-square
[github-stars-link]: https://github.com/lobehub/lobe-analytics/network/stargazers
[github-stars-shield]: https://img.shields.io/github/stars/lobehub/lobe-analytics?color=ffcb47&labelColor=black&style=flat-square
[npm-release-link]: https://www.npmjs.com/package/@lobehub/analytics
[npm-release-shield]: https://img.shields.io/npm/v/@lobehub/analytics?color=369eff&labelColor=black&logo=npm&logoColor=white&style=flat-square
[pr-welcome-link]: https://github.com/lobehub/lobe-analytics/pulls
[pr-welcome-shield]: https://img.shields.io/badge/%F0%9F%A4%AF%20PR%20WELCOME-%E2%86%92-ffcb47?labelColor=black&style=for-the-badge
[profile-link]: https://github.com/lobehub
