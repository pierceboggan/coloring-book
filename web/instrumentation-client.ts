import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  integrations: [
    Sentry.replayIntegration({
      maskAllText: false,
      blockAllMedia: false,
    }),
    Sentry.consoleLoggingIntegration({ levels: ["log", "error", "warn"] }),
  ],
  
  tracesSampleRate: 1.0,
  
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  
  _experiments: {
    enableLogs: true,
  },
  
  debug: false,
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;