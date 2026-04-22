import { test, expect } from '@playwright/test'

test.describe('Landing page', () => {
  test('shows the public homepage with unauthenticated actions', async ({ page }) => {
    await page.goto('/')

    await expect(page.getByRole('heading', { name: 'Turn Your Photos into Coloring Adventures!' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Get Started' })).toBeVisible()
  })
})
