import AxeBuilder from '@axe-core/playwright'
import { test, expect, type Page } from '@playwright/test'
import { authenticateTestUser } from './helpers/auth'

async function openUploader(page: Page, signedIn: boolean) {
  if (signedIn) {
    await authenticateTestUser(page)
  }
  await page.goto('/')
  await page.getByRole('button', { name: 'Create a Coloring Page' }).click()
  await expect(page.getByRole('heading', { name: 'Upload Your Photo Adventure' })).toBeVisible()
}

const scan = (page: Page) =>
  new AxeBuilder({ page })
    .include('[data-testid="image-uploader"]')
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze()

test.describe('Image uploader accessibility', () => {
  test('signed-out uploader has no axe violations', async ({ page }) => {
    await openUploader(page, false)
    await expect(page.getByText('Sign in to upload images')).toBeVisible()
    const results = await scan(page)
    expect(results.violations.map((v) => `${v.id}: ${v.nodes.length}`)).toEqual([])
  })

  test('signed-in uploader has no axe violations', async ({ page }) => {
    await openUploader(page, true)
    await expect(page.getByText('Drop your images here or click to browse')).toBeVisible()
    const results = await scan(page)
    expect(results.violations.map((v) => `${v.id}: ${v.nodes.length}`)).toEqual([])
  })

  test('file picker is reachable and operable by keyboard', async ({ page }) => {
    await openUploader(page, true)
    const browse = page.getByRole('button', { name: /browse.*images/i })
    await expect(browse).toHaveCount(1)
    await browse.focus()
    await expect(browse).toBeFocused()
    const chooser = page.waitForEvent('filechooser')
    await page.keyboard.press('Enter')
    expect(await chooser).toBeTruthy()
  })

  test('announces validation errors via an alert', async ({ page }) => {
    await openUploader(page, true)
    await page
      .locator('input[type="file"]')
      .setInputFiles({ name: 'notes.txt', mimeType: 'text/plain', buffer: Buffer.from('hello') })
    await expect(page.locator('[data-testid="image-uploader"]').getByRole('alert')).toHaveText('notes.txt is not an image file')
  })

  test('exposes a polite status live region that is present before updates', async ({ page }) => {
    await openUploader(page, true)
    const status = page.locator('[data-testid="image-uploader"] [role="status"]')
    await expect(status).toHaveCount(1)
    await expect(status).toHaveAttribute('aria-live', 'polite')
  })
})
