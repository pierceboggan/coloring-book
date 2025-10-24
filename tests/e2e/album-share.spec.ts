import { test, expect, Page } from '@playwright/test'

const unlockPreview = async (page: Page) => {
  await page.addInitScript(() => {
    window.sessionStorage.setItem('dev_authenticated', 'true')
  })
}

const sharedAlbumResponse = {
  album: {
    id: 'album-123',
    title: 'Magical Memories',
    description: 'A collection of our favourite moments.',
    createdAt: new Date('2024-11-12T10:00:00Z').toISOString(),
    imageCount: 2,
    images: [
      {
        id: 'img-1',
        name: 'Family picnic',
        original_url: 'https://example.com/picnic.jpg',
        coloring_page_url: 'https://example.com/picnic-coloring.jpg',
        status: 'completed',
      },
      {
        id: 'img-2',
        name: 'First day of school',
        original_url: 'https://example.com/school.jpg',
        coloring_page_url: 'https://example.com/school-coloring.jpg',
        status: 'completed',
      },
    ],
  },
}

test.describe('Public family album', () => {
  test.beforeEach(async ({ page }) => {
    await unlockPreview(page)
  })

  test('shows shared album details and supports PDF download', async ({ page }) => {
    await page.route('**/api/family-albums/test-share', async (route) => {
      const url = new URL(route.request().url())
      if (url.searchParams.get('download') === 'true') {
        await route.fulfill({
          status: 200,
          body: 'fake-pdf',
          headers: {
            'content-type': 'application/pdf',
          },
        })
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(sharedAlbumResponse),
        })
      }
    })

    await page.goto('/album/test-share')

    await expect(page.getByRole('heading', { name: 'Magical Memories' })).toBeVisible()
    await expect(page.getByText('2 coloring pages')).toBeVisible()

    const downloadButton = page.getByRole('button', { name: /Download PDF/ })
    await expect(downloadButton).toBeEnabled()

    const downloadPromise = page.waitForEvent('download')
    await downloadButton.click()
    const download = await downloadPromise
    // The filename should be a sanitized version of the album title followed by '_coloring_book.pdf'.
    // This regex allows for underscores or dashes, and is case-insensitive.
    const expectedFilenamePattern = /^magical[-_]memories_coloring_book\.pdf$/i;
    await expect(download.suggestedFilename()).toMatch(expectedFilenamePattern);
  })

  test('renders an error state when the share code is invalid', async ({ page }) => {
    await page.route('**/api/family-albums/missing', async (route) => {
      await route.fulfill({ status: 404, contentType: 'application/json', body: JSON.stringify({ error: 'Not found' }) })
    })

    await page.goto('/album/missing')

    await expect(page.getByText('Album Not Found')).toBeVisible()
    await expect(page.getByRole('link', { name: 'Go to ColoringBook.AI' })).toBeVisible()
  })
})
