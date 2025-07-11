import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  
  integrations: [
    Sentry.consoleLoggingIntegration({ levels: ["log", "error", "warn"] }),
  ],
  
  tracesSampleRate: 1.0,
  
  _experiments: {
    enableLogs: true,
  },
  
  debug: false,
});