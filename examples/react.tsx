import { createAnalytics } from '@lobehub/analytics';
import { AnalyticsProvider, useAnalytics, useAnalyticsStrict } from '@lobehub/analytics/react';
import React from 'react';

// Create analytics instance
const analytics = createAnalytics({
  business: 'react-app',
  providers: {
    posthog: {
      enabled: true,
      key: process.env.REACT_APP_POSTHOG_KEY!,
    },
  },
});

// Safe usage example
function Dashboard() {
  const { analytics, error, isReady } = useAnalytics();

  if (error) return <div>Error: {error.message}</div>;
  if (!isReady) return <div>Loading...</div>;

  const handleClick = () => {
    analytics?.trackEvent('button_click', {
      button_name: 'dashboard_cta',
      page: 'dashboard',
    });
  };

  return (
    <button onClick={handleClick} type="button">
      Track Click
    </button>
  );
}

// Strict mode usage
function StrictComponent() {
  const analytics = useAnalyticsStrict(); // Throws error if not initialized

  const handleSubmit = () => {
    // Use custom event since form_submit is not in predefined events
    analytics.track({
      name: 'form_submit',
      properties: {
        form_name: 'contact',
        success: true,
      },
    });
  };

  return (
    <button onClick={handleSubmit} type="button">
      Submit Form
    </button>
  );
}

// App root component
export function App() {
  return (
    <AnalyticsProvider autoInitialize client={analytics} registerGlobal>
      <Dashboard />
    </AnalyticsProvider>
  );
}

export { Dashboard, StrictComponent };
