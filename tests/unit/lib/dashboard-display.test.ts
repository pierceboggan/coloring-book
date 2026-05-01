import { describe, it, expect } from 'vitest'
import { deriveDashboardDisplayData, type DashboardImage } from '@/lib/dashboard-display'

const baseImage: DashboardImage = {
  id: 'img-1',
  name: 'Image 1',
  original_url: 'https://example.com/original-1.png',
  coloring_page_url: 'https://example.com/coloring-1.png',
  status: 'completed',
  created_at: '2026-04-20T10:00:00.000Z',
  variant_urls: null,
  variant_prompts: null,
  archived_at: null,
  is_favorite: false,
}

describe('dashboard-display.ts', () => {
  it('builds and sorts coloring items with favorites first', () => {
    const images: DashboardImage[] = [
      {
        ...baseImage,
        id: 'img-new-favorite',
        name: 'Favorite image',
        created_at: '2026-04-20T12:00:00.000Z',
        is_favorite: true,
        variant_urls: ['https://example.com/variant-a.png'],
      },
      {
        ...baseImage,
        id: 'img-old-normal',
        name: 'Older image',
        created_at: '2026-04-19T12:00:00.000Z',
        is_favorite: false,
      },
      {
        ...baseImage,
        id: 'img-new-normal',
        name: 'Newer non-favorite image',
        created_at: '2026-04-20T11:00:00.000Z',
        is_favorite: false,
      },
    ]

    const result = deriveDashboardDisplayData({ images, favoritesOnly: false })

    expect(result.completedCount).toBe(4) // 3 mains + 1 variant
    expect(result.filteredColoringDisplayItems.map((item) => item.displayId)).toEqual([
      'img-new-favorite',
      'img-new-favorite-variant-0',
      'img-new-normal',
      'img-old-normal',
    ])
  })

  it('applies favorites-only filtering to both coloring and uploads lists', () => {
    const images: DashboardImage[] = [
      {
        ...baseImage,
        id: 'img-favorite',
        is_favorite: true,
      },
      {
        ...baseImage,
        id: 'img-non-favorite',
        created_at: '2026-04-19T10:00:00.000Z',
        is_favorite: false,
      },
    ]

    const result = deriveDashboardDisplayData({ images, favoritesOnly: true })

    expect(result.filteredColoringDisplayItems).toHaveLength(1)
    expect(result.filteredColoringDisplayItems[0].id).toBe('img-favorite')
    expect(result.filteredUploadsViewImages).toHaveLength(1)
    expect(result.filteredUploadsViewImages[0].id).toBe('img-favorite')
  })

  it('reports totals and processing state', () => {
    const images: DashboardImage[] = [
      {
        ...baseImage,
        id: 'img-processing',
        status: 'processing',
      },
      {
        ...baseImage,
        id: 'img-completed',
      },
      {
        ...baseImage,
        id: 'img-error',
        status: 'error',
      },
    ]

    const result = deriveDashboardDisplayData({ images, favoritesOnly: false })

    expect(result.totalImages).toBe(3)
    expect(result.processingCount).toBe(1)
    expect(result.isProcessing).toBe(true)
    expect(result.completedCount).toBe(1)
  })
})
