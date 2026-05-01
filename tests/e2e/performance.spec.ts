import { Buffer } from 'buffer'
import { test, expect, Page } from '@playwright/test'
import { authenticateTestUser, unlockPreview } from './helpers/auth'

type PerformanceBudget = {
  readyMs: number
  domContentLoadedMs: number
  loadEventEndMs: number
}

type PerformanceCase = {
  name: string
  path: string
  budget: PerformanceBudget
  waitForReady: (page: Page) => Promise<void>
  setup?: (page: Page) => Promise<void>
}

type MockImageRecord = {
  id: string
  user_id: string
  name: string
  original_url: string
  coloring_page_url: string | null
  status: 'processing' | 'completed' | 'error'
  created_at: string
  updated_at: string
  variant_urls: string[] | null
  variant_prompts: string[] | null
}

const TINY_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=',
  'base64'
)

const getBudgetOverride = (name: string) => {
  const rawValue = process.env[name]

  if (!rawValue) {
    return undefined
  }

  const parsedValue = Number(rawValue)

  if (!Number.isFinite(parsedValue) || parsedValue <= 0) {
    throw new Error(`${name} must be a positive number of milliseconds`)
  }

  return parsedValue
}

const applyBudgetOverrides = (budget: PerformanceBudget): PerformanceBudget => ({
  readyMs: getBudgetOverride('PERF_READY_BUDGET_MS') ?? budget.readyMs,
  domContentLoadedMs:
    getBudgetOverride('PERF_DOM_CONTENT_LOADED_BUDGET_MS') ?? budget.domContentLoadedMs,
  loadEventEndMs:
    getBudgetOverride('PERF_LOAD_EVENT_BUDGET_MS') ?? budget.loadEventEndMs,
})

const setupFastImageResponses = async (page: Page) => {
  await page.route('https://example.com/**/*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'image/png',
      body: TINY_PNG,
    })
  })
}

const setupSharedAlbumMock = async (page: Page) => {
  await page.route('**/api/family-albums/performance-share', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        album: {
          id: 'performance-album',
          title: 'Fast Family Album',
          description: 'A speedy album for load-time guardrails.',
          createdAt: new Date('2024-11-12T10:00:00Z').toISOString(),
          imageCount: 2,
          commentsEnabled: false,
          downloadsEnabled: true,
          images: [
            {
              id: 'img-performance-1',
              name: 'Park Adventure',
              original_url: 'https://example.com/park-original.png',
              coloring_page_url: 'https://example.com/park-coloring.png',
              status: 'completed',
            },
            {
              id: 'img-performance-2',
              name: 'Puppy Portrait',
              original_url: 'https://example.com/puppy-original.png',
              coloring_page_url: 'https://example.com/puppy-coloring.png',
              status: 'completed',
            },
          ],
        },
      }),
    })
  })
}

const setupDashboardMock = async (page: Page) => {
  await unlockPreview(page)
  await authenticateTestUser(page)

  const images: MockImageRecord[] = [
    {
      id: 'img-dashboard-performance-1',
      user_id: 'test-user-123',
      name: 'Rocket Ship Adventures',
      original_url: 'https://example.com/rocket-original.png',
      coloring_page_url: 'https://example.com/rocket-coloring.png',
      status: 'completed',
      created_at: '2024-01-15T12:00:00.000Z',
      updated_at: '2024-01-15T12:00:00.000Z',
      variant_urls: ['https://example.com/rocket-variant.png'],
      variant_prompts: ['Rocket blasting through the clouds'],
    },
    {
      id: 'img-dashboard-performance-2',
      user_id: 'test-user-123',
      name: 'Puppy Playtime',
      original_url: 'https://example.com/puppy-original.png',
      coloring_page_url: null,
      status: 'processing',
      created_at: '2024-01-14T12:00:00.000Z',
      updated_at: '2024-01-14T12:00:00.000Z',
      variant_urls: null,
      variant_prompts: null,
    },
  ]

  await page.route('**/rest/v1/images**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(images),
    })
  })
}

const collectNavigationMetrics = async (page: Page) => {
  return page.evaluate(() => {
    const [navigation] = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[]

    if (!navigation) {
      throw new Error('No navigation performance entry found')
    }

    return {
      domContentLoadedMs: navigation.domContentLoadedEventEnd - navigation.startTime,
      loadEventEndMs: navigation.loadEventEnd - navigation.startTime,
    }
  })
}

const measurePageLoad = async (page: Page, performanceCase: PerformanceCase) => {
  await performanceCase.setup?.(page)
  await setupFastImageResponses(page)

  await page.goto(performanceCase.path, { waitUntil: 'load' })
  await performanceCase.waitForReady(page)

  const startTime = Date.now()
  await page.goto(performanceCase.path, { waitUntil: 'domcontentloaded' })
  await performanceCase.waitForReady(page)
  const readyMs = Date.now() - startTime

  await page.waitForLoadState('load')

  return {
    readyMs,
    ...(await collectNavigationMetrics(page)),
  }
}

test.describe('Web performance budgets', () => {
  test.describe.configure({ mode: 'serial' })

  const performanceCases: PerformanceCase[] = [
    {
      name: 'home page',
      path: '/',
      budget: applyBudgetOverrides({
        readyMs: 2500,
        domContentLoadedMs: 1800,
        loadEventEndMs: 2500,
      }),
      waitForReady: async (page) => {
        await expect(page.getByRole('heading', { name: 'Turn Your Photos into Coloring Adventures!' })).toBeVisible()
      },
    },
    {
      name: 'examples page',
      path: '/examples',
      budget: applyBudgetOverrides({
        readyMs: 2500,
        domContentLoadedMs: 1800,
        loadEventEndMs: 2500,
      }),
      waitForReady: async (page) => {
        await expect(page.getByRole('heading', { name: 'Peek at Examples' })).toBeVisible()
      },
    },
    {
      name: 'shared album page',
      path: '/album/performance-share',
      budget: applyBudgetOverrides({
        readyMs: 3000,
        domContentLoadedMs: 2200,
        loadEventEndMs: 3000,
      }),
      setup: setupSharedAlbumMock,
      waitForReady: async (page) => {
        await expect(page.getByRole('heading', { name: 'Fast Family Album' }).first()).toBeVisible()
      },
    },
    {
      name: 'dashboard page',
      path: '/dashboard',
      budget: applyBudgetOverrides({
        readyMs: 4000,
        domContentLoadedMs: 3000,
        loadEventEndMs: 4000,
      }),
      setup: setupDashboardMock,
      waitForReady: async (page) => {
        await expect(page.getByRole('heading', { name: 'Your Coloring Pages Playground' })).toBeVisible()
      },
    },
  ]

  for (const performanceCase of performanceCases) {
    test(`${performanceCase.name} stays within the load-time budget`, async ({ page }) => {
      const metrics = await measurePageLoad(page, performanceCase)

      expect(
        metrics.readyMs,
        `${performanceCase.name} took ${metrics.readyMs}ms to render its primary content`
      ).toBeLessThanOrEqual(performanceCase.budget.readyMs)
      expect(
        metrics.domContentLoadedMs,
        `${performanceCase.name} reached DOMContentLoaded in ${Math.round(metrics.domContentLoadedMs)}ms`
      ).toBeLessThanOrEqual(performanceCase.budget.domContentLoadedMs)
      expect(
        metrics.loadEventEndMs,
        `${performanceCase.name} reached the load event in ${Math.round(metrics.loadEventEndMs)}ms`
      ).toBeLessThanOrEqual(performanceCase.budget.loadEventEndMs)
    })
  }
})
