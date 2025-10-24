import { test, expect, Page } from '@playwright/test'

const unlockPreview = async (page: Page) => {
  await page.addInitScript(() => {
    window.sessionStorage.setItem('dev_authenticated', 'true')
  })
}

test.describe('Home page workflows', () => {
  test.beforeEach(async ({ page }) => {
    await unlockPreview(page)
  })

  test('hero CTA drives visitors into the uploader flow', async ({ page }) => {
    await page.goto('/')

    await expect(page.getByRole('heading', { name: /Turn Photos into/ })).toBeVisible()

    await page.getByRole('button', { name: 'Sign In' }).click()
    await expect(page.getByRole('heading', { name: 'Sign In' })).toBeVisible()

    await page.getByRole('button', { name: /Sign up/ }).click()
    await expect(page.getByRole('heading', { name: 'Sign Up' })).toBeVisible()

    await page.getByRole('button', { name: '×' }).click()
    await expect(page.getByRole('heading', { name: /Turn Photos into/ })).toBeVisible()

    await page.getByRole('button', { name: 'Create Coloring Page' }).click()

    await expect(page.getByRole('heading', { name: 'Upload Your Photo' })).toBeVisible()
    await expect(page.getByText('Sign in to upload images')).toBeVisible()

    await page.getByRole('button', { name: '← Back to home' }).click()
    await expect(page.getByRole('heading', { name: /Turn Photos into/ })).toBeVisible()
  })
})
