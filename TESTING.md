# Unit Testing Guide

## Overview

This project uses **Vitest** as the test runner with **React Testing Library** for component testing. The test infrastructure is configured for Next.js 15 with TypeScript in strict mode.

## Running Tests

```bash
# Run all unit tests once
npm run test:unit

# Run tests in watch mode
npm test

# Run tests with coverage report
npm run test:coverage

# Open Vitest UI for interactive testing
npm run test:ui
```

## Test Coverage Goals

We aim for **80%+ code coverage** across all testable code. Current coverage targets:

- **Statements**: 80%+
- **Branches**: 80%+
- **Functions**: 80%+
- **Lines**: 80%+

## Test Structure

Tests are organized under `tests/unit/` with the following structure:

```
tests/
├── setup.ts                    # Global test setup
├── unit/
│   ├── lib/                   # Library/utility tests
│   │   ├── variants.test.ts
│   │   ├── imageProcessor.test.ts
│   │   ├── photobook/
│   │   │   ├── types.test.ts
│   │   │   └── queue.test.ts
│   │   └── prompt-remix-jobs.test.ts
│   └── components/            # Component tests
│       └── FunBackground.test.tsx
└── e2e/                       # E2E tests (Playwright)
```

## What to Test

### Library Functions (src/lib/)
- Pure functions with no external dependencies
- Data transformation and validation logic
- Business logic utilities
- Type serialization/parsing

### Components (src/components/)
- Rendering behavior
- User interactions
- Prop variations
- Edge cases (null, undefined, empty states)

### What NOT to Test
- API routes (tested via E2E tests)
- Server actions (tested via E2E tests)
- External library behavior
- Implementation details (test behavior, not implementation)

## Writing Tests

### Basic Test Structure

```typescript
import { describe, it, expect } from 'vitest'

describe('MyFunction', () => {
  it('should handle basic input', () => {
    const result = myFunction('input')
    expect(result).toBe('expected output')
  })

  it('should handle edge cases', () => {
    expect(myFunction('')).toBe('default')
    expect(myFunction(null)).toBe('fallback')
  })
})
```

### Component Testing

```typescript
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MyComponent } from '@/components/MyComponent'

describe('MyComponent', () => {
  it('should render children', () => {
    render(<MyComponent>Test Content</MyComponent>)
    expect(screen.getByText('Test Content')).toBeInTheDocument()
  })

  it('should apply custom className', () => {
    const { container } = render(
      <MyComponent className="custom-class">Content</MyComponent>
    )
    const element = container.firstChild as HTMLElement
    expect(element).toHaveClass('custom-class')
  })
})
```

### Mocking Dependencies

For testing functions that depend on external modules:

```typescript
import { vi } from 'vitest'

// Mock at the module level
vi.mock('sharp', () => ({
  default: vi.fn(() => ({
    metadata: vi.fn().mockResolvedValue({ width: 800, height: 600 }),
    composite: vi.fn().mockReturnThis(),
    toBuffer: vi.fn().mockResolvedValue(Buffer.from('mocked')),
  })),
}))
```

## Coverage Report

After running `npm run test:coverage`, coverage reports are available in:

- **Terminal**: Summary table
- **HTML**: `coverage/index.html` (detailed interactive report)
- **LCOV**: `coverage/lcov.info` (for CI/CD integration)

## Best Practices

1. **Test behavior, not implementation**: Focus on what the code does, not how it does it
2. **One assertion per test when possible**: Makes failures easier to diagnose
3. **Use descriptive test names**: Should read like documentation
4. **Test edge cases**: Empty strings, null, undefined, boundary values
5. **Keep tests isolated**: Each test should be independent
6. **Mock external dependencies**: Don't rely on network, filesystem, or external services

## CI/CD Integration

Tests run automatically on:
- Every push to a PR
- Before merging to main

The build will fail if:
- Any test fails
- Coverage drops below 80% threshold

## Troubleshooting

### Tests fail with import errors
- Check that paths are using `@/` alias correctly
- Verify `vitest.config.ts` has correct path resolution

### Coverage not including files
- Check `coverage.exclude` in `vitest.config.ts`
- Ensure files are imported in tests

### Mock not working
- Mocks must be defined before imports
- Use `vi.mock()` at the module level

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
