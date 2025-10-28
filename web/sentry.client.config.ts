import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  integrations: [
    Sentry.browserTracingIntegration(),
  ],
  
  tracesSampleRate: 1.0,
  
  tracePropagationTargets: ["localhost", /^https:\/\/.*\.vercel\.app\/api/],
  
  debug: false,
});