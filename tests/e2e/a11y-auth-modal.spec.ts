import AxeBuilder from '@axe-core/playwright'
import { test, expect, type Page } from '@playwright/test'

async function openModal(page: Page) {
  await page.goto('/')
  const trigger = page.locator('nav').getByRole('button', { name: 'Sign In' })
  await trigger.click()
  return trigger
}

test.describe('Authentication modal accessibility', () => {
  test('exposes dialog semantics and has no axe violations', async ({ page }) => {
    await openModal(page)
    const dialog = page.getByRole('dialog', { name: 'Sign in to keep coloring' })
    await expect(dialog).toBeVisible()
    await expect(dialog).toHaveAttribute('aria-modal', 'true')

    const results = await new AxeBuilder({ page })
      .include('[role="dialog"]')
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze()
    expect(results.violations).toEqual([])
  })

  test('moves focus into the dialog, traps Tab, closes on Escape and restores focus', async ({ page }) => {
    const trigger = await openModal(page)
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await expect.poll(() => dialog.evaluate((el) => el.contains(document.activeElement))).toBe(true)

    for (let i = 0; i < 15; i++) {
      await page.keyboard.press('Tab')
      expect(await dialog.evaluate((el) => el.contains(document.activeElement))).toBe(true)
    }
    for (let i = 0; i < 15; i++) {
      await page.keyboard.press('Shift+Tab')
      expect(await dialog.evaluate((el) => el.contains(document.activeElement))).toBe(true)
    }

    await page.keyboard.press('Escape')
    await expect(dialog).toBeHidden()
    await expect(trigger).toBeFocused()
  })

  test('announces authentication errors to assistive tech and links them to inputs', async ({ page }) => {
    await page.route('**/auth/v1/token**', (route) =>
      route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'invalid_grant', error_description: 'Invalid login credentials' }),
      }),
    )
    await openModal(page)
    await page.getByLabel('Email').fill('parent@example.com')
    await page.getByLabel('Password').fill('wrong-password')
    await page.locator('form').getByRole('button', { name: 'Sign In' }).click()

    await expect(page.locator('#auth-error')).toHaveAttribute('role', 'alert')
    await expect(page.locator('#auth-error')).toHaveText('Invalid login credentials')
    await expect(page.getByLabel('Password')).toHaveAttribute('aria-invalid', 'true')
    await expect(page.getByLabel('Password')).toHaveAttribute('aria-describedby', 'auth-error')
  })
})
