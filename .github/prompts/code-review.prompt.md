---
agent: agent
tools: ['vscode', 'execute', 'read', 'agent', 'edit', 'search', 'web', 'todo']
model: Claude Sonnet 4
---

# Code Review Guidelines

Review the provided code changes with focus on:

## Security
- **Authentication & Authorization**: Verify auth boundaries, check middleware protection, ensure RLS policies are respected
- **Input Validation**: Sanitize user inputs, validate API request bodies, prevent injection attacks
- **XSS Prevention**: Use proper escaping, avoid `dangerouslySetInnerHTML`, sanitize dynamic content
- **Secrets Management**: No hardcoded credentials, proper use of environment variables
- **CSRF Protection**: Verify state-changing operations use appropriate protections
- **Data Exposure**: Ensure sensitive data isn't leaked in logs, error messages, or client bundles

## Accessibility (a11y)
- **Semantic HTML**: Use proper heading hierarchy, landmarks, and native elements over divs
- **Keyboard Navigation**: Ensure all interactive elements are focusable and operable via keyboard
- **ARIA Labels**: Add appropriate aria-labels, aria-describedby for screen readers
- **Color Contrast**: Verify sufficient contrast ratios (4.5:1 for normal text, 3:1 for large text)
- **Focus Management**: Visible focus indicators, logical tab order, focus trapping in modals
- **Alt Text**: Meaningful alt attributes for images, empty alt for decorative images

## Performance
- **Bundle Size**: Avoid importing entire libraries, use tree-shaking, dynamic imports for heavy components
- **React Rendering**: Identify unnecessary re-renders, missing memoization (useMemo, useCallback, React.memo)
- **Data Fetching**: Check for N+1 queries, proper caching, avoid waterfalls with parallel requests
- **Images**: Use Next.js Image component, appropriate sizing, lazy loading
- **Server vs Client**: Prefer server components, minimize client-side JavaScript

## Architecture
- **Separation of Concerns**: Business logic in hooks/lib, presentation in components, no logic in component bodies
- **Component Design**: Single responsibility, proper prop typing, appropriate granularity
- **State Management**: Minimal state, lift state appropriately, use context for cross-cutting concerns
- **API Design**: RESTful conventions, consistent error responses, proper HTTP status codes
- **Code Organization**: Follow existing patterns, consistent file/folder structure
- **Scalability**: Consider future extensibility, avoid tight coupling, dependency injection where appropriate

## TypeScript & Code Quality
- **Strict Typing**: No `any` types unless justified, proper interface definitions
- **Error Handling**: Proper error boundaries, try/catch blocks, user-friendly error messages
- **Lint Compliance**: Run `npm run lint` to catch style issues
- **Documentation**: Inline comments for non-obvious behavior, JSDoc for public APIs

## Codebase Conventions
- Follow functional, component-driven design
- Use descriptive Tailwind utility combinations
- Organize imports: React/Next core → third-party → internal modules
- Prefer server components unless client-side interactivity is required

## Testing Requirements
- Verify changes don't break existing Playwright e2e tests
- Suggest additional test coverage for edge cases and error paths
- Consider accessibility testing with axe-core or similar

## Review Output
Provide:
1. **Summary**: Overview of changes and their impact
2. **Critical Issues**: Security vulnerabilities, breaking changes, data loss risks
3. **Warnings**: Performance concerns, accessibility gaps, architectural concerns
4. **Suggestions**: Code improvements, best practices, refactoring opportunities
5. **Line-by-Line Feedback**: Specific comments with file paths and line numbers
