import { test, expect } from '@playwright/test'
import { unlockPreview } from './helpers/auth'

const sharedPageResponse = {
  image: {
    id: 'img-123',
    name: 'Sunset Adventure',
    coloringPageUrl: 'https://example.com/sunset-coloring.png',
    createdAt: new Date('2024-11-15T14:30:00Z').toISOString(),
  },
  shareCode: 'abc123XY',
  expiresAt: null,
  viewCount: 5,
}

test.describe('Public shared coloring page', () => {
  test.beforeEach(async ({ page }) => {
    await unlockPreview(page)
  })

  test('shows shared page details and supports actions', async ({ page }) => {
    await page.route('**/api/share/abc123XY', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(sharedPageResponse),
      })
    })

    await page.goto('/share/abc123XY')

    // Check that the page loads
    await expect(page.locator('h1')).toContainText('Sunset Adventure')
    
    // Check that view count is displayed
    await expect(page.locator('text=/5 views/i')).toBeVisible()

    // Check that action buttons are visible
    await expect(page.locator('button:has-text("Download")')).toBeVisible()
    await expect(page.locator('button:has-text("Print")')).toBeVisible()
    await expect(page.locator('button:has-text("Color Online")')).toBeVisible()
    await expect(page.locator('button:has-text("Copy Link")')).toBeVisible()

    // Check that social sharing buttons are visible
    await expect(page.locator('button:has-text("Share on Twitter")')).toBeVisible()
    await expect(page.locator('button:has-text("Share on Facebook")')).toBeVisible()
    await expect(page.locator('button:has-text("Share on WhatsApp")')).toBeVisible()

    // Check that the image is displayed
    await expect(page.locator('img[alt="Sunset Adventure"]')).toBeVisible()

    // Check CTA section
    await expect(page.locator('text=/Create Your Own Coloring Pages/i')).toBeVisible()
    await expect(page.locator('a:has-text("Try ColoringBook.AI Free")')).toBeVisible()
  })

  test('handles 404 for non-existent share', async ({ page }) => {
    await page.route('**/api/share/notfound', async (route) => {
      await route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Share not found' }),
      })
    })

    await page.goto('/share/notfound')

    // Check error message
    await expect(page.locator('text=/Page Not Found/i')).toBeVisible()
    await expect(page.locator('text=/coloring page might have been removed/i')).toBeVisible()
    
    // Check for home link
    await expect(page.locator('a:has-text("Go to Home")')).toBeVisible()
  })

  test('handles expired share link', async ({ page }) => {
    await page.route('**/api/share/expired', async (route) => {
      await route.fulfill({
        status: 410,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Share link has expired' }),
      })
    })

    await page.goto('/share/expired')

    // Check error message
    await expect(page.locator('text=/Share link has expired/i')).toBeVisible()
    await expect(page.locator('a:has-text("Go to Home")')).toBeVisible()
  })

  test('copy link button works', async ({ page, context }) => {
    // Grant clipboard permissions
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])

    await page.route('**/api/share/abc123XY', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(sharedPageResponse),
      })
    })

    await page.goto('/share/abc123XY')

    // Click copy button
    await page.locator('button:has-text("Copy Link")').click()

    // Check that button text changes
    await expect(page.locator('button:has-text("Copied!")')).toBeVisible()

    // Check clipboard content
    const clipboardText = await page.evaluate(() => navigator.clipboard.readText())
    expect(clipboardText).toContain('/share/abc123XY')
  })
})
