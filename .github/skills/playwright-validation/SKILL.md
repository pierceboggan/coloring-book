---
name: playwright-validation
description: Validate UI changes using Playwright browser tools and screenshots. Use this skill when making UI-related changes that need visual verification before completion.
---

This skill ensures UI changes are properly validated using Playwright MCP browser tools before marking tasks as complete.

## Validation Requirements

For ANY UI-related task, you MUST validate changes using Playwright MCP browser tools before considering the task complete.

## Validation Steps

1. **Take screenshots** to prove the implementation works as expected
2. **Handle authentication** if required by injecting the saved auth state from `auth.json`:
   - Set the Supabase cookie
   - Set the localStorage token before navigating
3. **Iterate on fixes** if the validation reveals issues
4. **Continue until confirmed** - screenshots must confirm the user's requirements are fully met

## Completion Criteria

Do not mark a task as done until visual confirmation via Playwright demonstrates correct behavior.

## Best Practices

- Use Playwright's browser tools for navigation, interaction, and screenshot capture
- Verify that all interactive elements work as expected
- Check responsive behavior if applicable
- Validate error states and edge cases when relevant
- Document any issues found during validation
