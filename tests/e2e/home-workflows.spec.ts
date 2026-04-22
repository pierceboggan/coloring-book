import { test, expect } from '@playwright/test'
test.describe('Home page workflows', () => {
  test('hero CTA drives visitors into the uploader flow', async ({ page }) => {
    await page.goto('/')

    await expect(page.getByRole('heading', { name: 'Turn Your Photos into Coloring Adventures!' })).toBeVisible()

    await page.locator('nav').getByRole('button', { name: 'Sign In' }).click()
    await expect(page.getByRole('heading', { name: 'Sign in to keep coloring' })).toBeVisible()

    await page.getByRole('button', { name: /Sign up/ }).click()
    await expect(page.getByRole('heading', { name: 'Create your free account' })).toBeVisible()

    await page.getByRole('button', { name: 'Close authentication dialog' }).click()
    await expect(page.getByRole('heading', { name: 'Turn Your Photos into Coloring Adventures!' })).toBeVisible()

    await page.getByRole('button', { name: 'Create a Coloring Page' }).click()

    await expect(page.getByRole('heading', { name: 'Upload Your Photo Adventure' })).toBeVisible()
    await expect(page.getByText('Sign in to upload images')).toBeVisible()

    await page.getByRole('button', { name: '← Back to the playground' }).click()
    await expect(page.getByRole('heading', { name: 'Turn Your Photos into Coloring Adventures!' })).toBeVisible()
  })
})
