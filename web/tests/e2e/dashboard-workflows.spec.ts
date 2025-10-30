import { Buffer } from 'buffer'
import { test, expect, Page } from '@playwright/test'
import { unlockPreview, authenticateTestUser } from './helpers/auth'

type MockImageStatus = 'processing' | 'completed' | 'error'

interface MockImageRecord {
  id: string
  user_id: string
  name: string
  original_url: string
  coloring_page_url: string | null
  status: MockImageStatus
  created_at: string
  updated_at: string
  variant_urls: string[] | null
  variant_prompts: string[] | null
}

const createMockImage = (overrides: Partial<MockImageRecord> = {}): MockImageRecord => {
  const now = new Date().toISOString()
  return {
    id: overrides.id ?? `img-${Math.random().toString(36).slice(2, 10)}`,
    user_id: overrides.user_id ?? 'test-user-123',
    name: overrides.name ?? 'Sample Creation',
    original_url: overrides.original_url ?? 'https://example.com/original.png',
    coloring_page_url: overrides.coloring_page_url ?? null,
    status: overrides.status ?? 'processing',
    created_at: overrides.created_at ?? now,
    updated_at: overrides.updated_at ?? now,
    variant_urls: overrides.variant_urls ?? null,
    variant_prompts: overrides.variant_prompts ?? null,
  }
}

const setupSupabaseImageMock = async (page: Page, initialImages: MockImageRecord[]) => {
  const images: MockImageRecord[] = initialImages.map((image) => ({ ...image }))

  await page.route('**/rest/v1/images**', async (route, request) => {
    const method = request.method()

    if (method === 'GET') {
      const sorted = [...images].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(sorted),
      })
      return
    }

    if (method === 'POST') {
      const bodyText = request.postData() || '{}'
      const payload = JSON.parse(bodyText)
      const records = Array.isArray(payload) ? payload : [payload]

      const inserted = records.map((record: Partial<MockImageRecord>) => {
        const now = new Date().toISOString()
        const newRecord: MockImageRecord = {
          id: record.id ?? `img-${Math.random().toString(36).slice(2, 10)}`,
          user_id: record.user_id ?? 'test-user-123',
          name: record.name ?? 'Uploaded Image',
          original_url: record.original_url ?? 'https://example.com/uploaded.png',
          coloring_page_url: (record.coloring_page_url as string | null) ?? null,
          status: (record.status as MockImageStatus) ?? 'processing',
          created_at: record.created_at ?? now,
          updated_at: record.updated_at ?? now,
          variant_urls: (record.variant_urls as string[] | null) ?? null,
          variant_prompts: (record.variant_prompts as string[] | null) ?? null,
        }

        images.push(newRecord)
        return newRecord
      })

      const responseBody = inserted.length === 1 ? inserted[0] : inserted

      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify(responseBody),
      })
      return
    }

    if (method === 'PATCH') {
      const bodyText = request.postData() || '{}'
      const patch = JSON.parse(bodyText)
      const url = new URL(request.url())
      const idFilter = url.searchParams.get('id')
      const targetId = idFilter?.split('.').pop()

      const image = images.find((item) => item.id === targetId)

      if (image) {
        Object.assign(image, patch, { updated_at: new Date().toISOString() })
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(image),
        })
        return
      }

      await route.fulfill({ status: 404, contentType: 'application/json', body: '{}' })
      return
    }

    if (method === 'DELETE') {
      const url = new URL(request.url())
      const idFilter = url.searchParams.get('id')
      const targetId = idFilter?.split('.').pop()

      const index = images.findIndex((item) => item.id === targetId)
      if (index !== -1) {
        images.splice(index, 1)
      }

      await route.fulfill({ status: 204, body: '' })
      return
    }

    await route.continue()
  })

  return images
}

const stubClipboard = async (page: Page) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: async () => undefined,
      },
    })
  })
}

const SAMPLE_PNG_BUFFER = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=',
  'base64'
)

test.describe('Dashboard workflows', () => {
  test.beforeEach(async ({ page }) => {
    await unlockPreview(page)
    await authenticateTestUser(page)
    await stubClipboard(page)
  })

  test('shows coloring and upload galleries with Supabase data', async ({ page }) => {
    const initialImages = [
      createMockImage({
        id: 'img-finished-1',
        name: 'Rocket Ship Adventures',
        status: 'completed',
        created_at: '2024-01-15T12:00:00.000Z',
        coloring_page_url: 'https://example.com/coloring/rocket.png',
        variant_urls: ['https://example.com/variant/rocket-1.png'],
        variant_prompts: ['Rocket blasting through the clouds'],
      }),
      createMockImage({
        id: 'img-finished-2',
        name: 'Fairy Garden Picnic',
        status: 'completed',
        created_at: '2024-01-14T12:00:00.000Z',
        coloring_page_url: 'https://example.com/coloring/fairy.png',
      }),
      createMockImage({
        id: 'img-processing-1',
        name: 'Puppy Playtime',
        status: 'processing',
        created_at: '2024-01-13T12:00:00.000Z',
        coloring_page_url: null,
      }),
    ]

    await setupSupabaseImageMock(page, initialImages)

    await page.goto('/dashboard')

    await expect(page.getByRole('heading', { name: 'Your Coloring Pages Playground' })).toBeVisible()
    await expect(page.getByText('3 creations')).toBeVisible()
    await expect(page.getByText('2 ready to color')).toBeVisible()
    await expect(page.getByText('1 brewing')).toBeVisible()

    await expect(page.getByText('Rocket Ship Adventures')).toBeVisible()
    await expect(page.getByText('Ready!')).toBeVisible()

    await page.getByRole('button', { name: 'Uploads' }).click()

    await expect(page.getByRole('button', { name: 'Variants studio' })).toBeVisible()
    await expect(page.getByText('Puppy Playtime')).toBeVisible()
    await expect(page.getByText('Processing')).toBeVisible()
  })

  test('uploads an image and shows a success state', async ({ page }) => {
    const initialImages: MockImageRecord[] = []
    await setupSupabaseImageMock(page, initialImages)

    await page.route('**/storage/v1/object/images/**', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' })
    })

    await page.route('**/api/generate-coloring-page', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ coloringPageUrl: 'https://example.com/coloring/generated.png' }),
      })
    })

    await page.goto('/dashboard')

    await page.getByRole('button', { name: 'Upload Photos' }).first().click()

    await expect(page.getByRole('heading', { name: 'Upload Photos' })).toBeVisible()

    await page.setInputFiles('input[type="file"]', {
      name: 'sample-image.png',
      mimeType: 'image/png',
      buffer: SAMPLE_PNG_BUFFER,
    })

    await expect(page.getByText('Uploading your images...')).toBeVisible()
    await expect(page.getByText('Coloring page created!')).toBeVisible()
  })

  test('creates a photobook PDF from completed pages', async ({ page }) => {
    const initialImages = [
      createMockImage({
        id: 'img-book-1',
        name: 'Space Camp Memories',
        status: 'completed',
        coloring_page_url: 'https://example.com/coloring/space.png',
      }),
      createMockImage({
        id: 'img-book-2',
        name: 'Beach Day',
        status: 'completed',
        coloring_page_url: 'https://example.com/coloring/beach.png',
      }),
    ]

    await setupSupabaseImageMock(page, initialImages)

    await page.route('**/api/generate-photobook', async (route) => {
      const payload = JSON.parse(route.request().postData() || '{}')
      expect(Array.isArray(payload.images)).toBeTruthy()

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ downloadUrl: 'https://example.com/downloads/photobook.pdf' }),
      })
    })

    await page.route('https://example.com/downloads/photobook.pdf', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/pdf',
        body: '%PDF-1.4\n%',
      })
    })

    await page.goto('/dashboard')

    await page.getByRole('button', { name: 'Create photobook' }).click()

    await expect(page.getByRole('heading', { name: 'Create a printable book' })).toBeVisible()

    await page.getByPlaceholder('Enter photobook title...').fill('Family Adventures')
    await page.getByRole('button', { name: 'Space Camp Memories' }).click()

    const downloadPromise = page.waitForEvent('download')
    await page.getByRole('button', { name: 'Generate PDF' }).click()

    const download = await downloadPromise
    expect(download.suggestedFilename()).toBe('Family Adventures.pdf')

    await expect(page.getByRole('heading', { name: 'Create a printable book' })).not.toBeVisible()
  })

  test('creates a family album and provides a share link', async ({ page }) => {
    const initialImages = [
      createMockImage({
        id: 'img-album-1',
        name: 'Mountain Trail',
        status: 'completed',
        coloring_page_url: 'https://example.com/coloring/mountain.png',
      }),
      createMockImage({
        id: 'img-album-2',
        name: 'City Lights',
        status: 'completed',
        coloring_page_url: 'https://example.com/coloring/city.png',
      }),
    ]

    await setupSupabaseImageMock(page, initialImages)

    await page.route('**/api/family-albums', async (route) => {
      const payload = JSON.parse(route.request().postData() || '{}')
      expect(payload.title).toBe('Summer Fun')

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          album: {
            id: 'album-abc123',
            title: payload.title,
            description: payload.description,
            shareCode: 'abc123',
            shareUrl: 'https://example.com/album/abc123',
          },
        }),
      })
    })

    await page.route('**/api/family-albums/abc123?download=true', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/pdf',
        body: 'fake-pdf',
      })
    })

    await page.goto('/dashboard')

    await page.getByRole('button', { name: 'Build family album' }).click()

    await expect(page.getByRole('heading', { name: 'Bundle pages to share' })).toBeVisible()

    await page.getByPlaceholder('e.g., Cousins Coloring Club').fill('Summer Fun')
    await page
      .getByPlaceholder('Add a playful description for your family album...')
      .fill('A weekend with cousins and friends.')
    await page.getByRole('button', { name: 'Mountain Trail' }).click()

    await page.getByRole('button', { name: 'Create album' }).click()

    await expect(page.getByText('Album created!')).toBeVisible()
    await expect(page.getByText('https://example.com/album/abc123')).toBeVisible()

    await page.getByRole('button', { name: 'Copy link' }).click()
    await expect(page.getByRole('button', { name: 'Copied!' })).toBeVisible()

    const downloadPromise = page.waitForEvent('download')
    await page.getByRole('button', { name: 'Download PDF' }).click()
    const download = await downloadPromise
    expect(download.suggestedFilename()).toBe('summer_fun_coloring_book.pdf')

    await page.getByRole('button', { name: 'Done' }).click()
    await expect(page.getByText('Album created!')).not.toBeVisible()
  })
})

