# Agent Instructions

## Development Environment
- Use Node.js 18 or newer. The project relies on Next.js 15 with the App Router and Tailwind CSS 4.
- Install dependencies with `npm install`. The repo uses the `package-lock.json` that ships with the project; do not switch to another package manager.
- TypeScript is configured in strict mode. Avoid adding `any` types or disabling lint rules unless absolutely necessary and justify any exceptions in the PR description.

## Running and Building the App
- Start the development server with `npm run dev` (Next.js dev server on port 3000). You must configure `.env.local` as described in `README.md` before local API flows will succeed.
- Create production builds with `npm run build`, and validate them locally with `npm run start`.
- The app is deployed on Vercel; ensure any configuration changes remain compatible with `vercel.json` and the Next.js build pipeline.

## Testing and Quality Gates
- Run `npm run lint` before submitting changes that touch application logic. Resolve all lint warnings.
- End-to-end tests live in `tests/e2e` and run with Playwright via `npm run test:e2e`. These tests assume the password-protected dev flow (`parkcityutah`) and exercise the album sharing workflows.
- Add unit or integration tests alongside the features you modify. Prefer colocating tests near the relevant modules when possible, or expand the Playwright suite for full user flows.

## Repository Structure Overview
- `src/app`: App Router routes, server actions, and API handlers. Keep route groups organized by feature and prefer server components unless client-side interactivity is required.
- `src/components`: Shared React components. Split complex UI into small, typed components; maintain Tailwind class consistency.
- `src/contexts`: React context providers for auth/session state. Extend these providers instead of creating duplicate global state mechanisms.
- `src/lib`: Utility helpers for Supabase, OpenAI, and PDF generation. Add new domain helpers here and keep them framework-agnostic when practical.
- `public/`: Static assets, including icons and imagery used in PDFs or marketing pages.
- `scripts/`: Operational scripts (e.g., data migration or maintenance tooling) that may use Supabase or OpenAI clients.
- `tests/`: Playwright end-to-end specs. Keep scenarios idempotent so they can run against seeded demo data.
- Instrumentation files (`instrumentation.ts`, `instrumentation-client.ts`, `sentry.*.config.ts`) configure Sentry tracing. Update these consistently when introducing new tracing spans.

## Coding Conventions
- Follow functional, component-driven design and keep business logic in hooks or lib helpers rather than in React component bodies.
- Use descriptive Tailwind utility combinations; prefer extracting shared styles into components rather than duplicating long class lists.
- Keep imports organized (React/Next core modules first, third-party packages next, followed by internal modules).
- Document non-obvious behavior with inline comments or README updates when you introduce new flows.

## Validation with Playwright
- For any UI-related task, validate changes using Playwright MCP browser tools before considering the task complete.
- Take screenshots to prove the implementation works as expected. If authentication is required, inject the saved auth state from `auth.json` by setting the Supabase cookie and localStorage token before navigating.
- If the validation reveals issues, iterate on the fix until the screenshots confirm the user's requirements are fully met.
- Do not mark a task as done until visual confirmation via Playwright demonstrates correct behavior.

## Workflow Expectations
- Before opening a PR, verify linting and relevant tests locally. Include the exact commands you ran in the PR description.
- Reference this file when reviewing contributions to ensure consistency with established practices.
