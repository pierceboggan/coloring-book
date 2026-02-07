---
agent: agent
tools: ['vscode', 'execute', 'read', 'agent', 'edit', 'search', 'playwright/*', 'todo']
model: Claude Opus 4.5 (copilot)
---

Analyze the codebase for accessibility compliance and ensure proper accessibility best practices are followed.

## Accessibility Audit Checklist

When reviewing code, check for the following:

### Semantic HTML
- Use proper heading hierarchy (h1 → h2 → h3, etc.)
- Use semantic elements (`<nav>`, `<main>`, `<article>`, `<section>`, `<aside>`, `<footer>`, `<header>`)
- Use `<button>` for interactive elements, not `<div>` with click handlers
- Use `<a>` for navigation links with proper `href` attributes

### ARIA Attributes
- Add `aria-label` or `aria-labelledby` to interactive elements without visible text
- Use `aria-describedby` for additional context
- Add `aria-live` regions for dynamic content updates
- Use `role` attributes only when semantic HTML isn't sufficient
- Ensure `aria-hidden="true"` is used appropriately for decorative elements

### Keyboard Navigation
- All interactive elements must be focusable
- Ensure logical tab order (`tabIndex` usage)
- Implement proper focus management for modals and dialogs
- Add visible focus indicators (`:focus-visible` styles)
- Support keyboard shortcuts where appropriate (Escape to close modals, etc.)

### Images & Media
- All `<img>` elements must have `alt` attributes
- Decorative images should have `alt=""`
- Complex images need detailed descriptions
- Videos should have captions and transcripts
- Audio content should have transcripts

### Forms
- All form inputs must have associated `<label>` elements
- Use `htmlFor` (React) or `for` (HTML) to connect labels to inputs
- Provide clear error messages with `aria-invalid` and `aria-describedby`
- Group related inputs with `<fieldset>` and `<legend>`
- Mark required fields with `aria-required="true"`

### Color & Contrast
- Text must meet WCAG AA contrast ratios (4.5:1 for normal text, 3:1 for large text)
- Don't rely solely on color to convey information
- Ensure focus indicators have sufficient contrast

### Motion & Animations
- Respect `prefers-reduced-motion` media query
- Provide controls to pause/stop animations
- Avoid content that flashes more than 3 times per second

## Common Issues in This Codebase

When auditing this Next.js/React application, pay special attention to:

1. **Modals** (`AuthModal.tsx`, `RegenerateModal.tsx`, `VariantsModal.tsx`, `ColoringCanvasModal.tsx`, `PromptRemixModal.tsx`):
   - Focus trapping within modals
   - Return focus to trigger element on close
   - Escape key to close
   - Proper `role="dialog"` and `aria-modal="true"`

2. **Image Upload Components** (`ImageUploader.tsx`):
   - Screen reader announcements for upload progress
   - Error state communication

3. **Dynamic Content** (`Dashboard`):
   - Live region announcements for status changes
   - Loading state communication

4. **Interactive Elements**:
   - Button vs div usage
   - Click handlers with keyboard equivalents

## Testing Recommendations

1. **Automated Testing**: Run axe-core or similar tools via Playwright
2. **Keyboard Testing**: Navigate entire app using only keyboard
3. **Screen Reader Testing**: Test with VoiceOver (macOS) or NVDA (Windows)
4. **Color Contrast**: Use browser dev tools or contrast checker extensions

## Output Format

After analysis, provide:
1. **Critical Issues**: Barriers that prevent access (P0)
2. **Major Issues**: Significant usability problems (P1)
3. **Minor Issues**: Best practice improvements (P2)
4. **Recommendations**: Enhancements for better UX

For each issue, include:
- File and line number
- Description of the problem
- WCAG guideline reference (e.g., WCAG 2.1 Level AA - 1.4.3)
- Suggested fix with code example
