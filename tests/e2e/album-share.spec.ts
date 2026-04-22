import { test, expect } from '@playwright/test'

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
  test('shows shared album details and supports PDF download', async ({ page }) => {
    let resolveDownloadRequest: (() => void) | null = null
    const downloadRequested = new Promise<void>(resolve => {
      resolveDownloadRequest = resolve
    })

    await page.route('**/api/family-albums/test-share**', async (route) => {
      const url = new URL(route.request().url())
      if (url.searchParams.get('download') === 'true') {
        await route.fulfill({
          status: 200,
          body: 'fake-pdf',
          headers: {
            'content-type': 'application/pdf',
          },
        })
        resolveDownloadRequest?.()
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(sharedAlbumResponse),
        })
      }
    })

    await page.goto('/album/test-share')

    await expect(page.getByRole('heading', { name: 'Magical Memories' }).first()).toBeVisible()
    await expect(page.getByText('2 coloring pages')).toBeVisible()

    const downloadButton = page.getByRole('button', { name: /Download PDF/ })
    await expect(downloadButton).toBeEnabled()

    await downloadButton.click()
    await downloadRequested
    await expect(downloadButton).toBeEnabled()
  })

  test('renders an error state when the share code is invalid', async ({ page }) => {
    await page.route('**/api/family-albums/missing', async (route) => {
      await route.fulfill({ status: 404, contentType: 'application/json', body: JSON.stringify({ error: 'Not found' }) })
    })

    await page.goto('/album/missing')

    await expect(page.getByRole('heading', { name: 'Album not found' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Return to ColoringBook.AI' })).toBeVisible()
  })
})
