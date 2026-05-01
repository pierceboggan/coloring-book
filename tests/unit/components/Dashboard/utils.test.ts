import { describe, it, expect } from 'vitest'
import {
  buildColoringDisplayItems,
  formatImageDate,
  getVariantSummaries,
  sortUploads,
} from '@/components/Dashboard/utils'
import type { UserImage } from '@/components/Dashboard/types'

const baseImage = (overrides: Partial<UserImage> = {}): UserImage => ({
  id: 'img-1',
  name: 'Sample',
  original_url: 'https://example.com/o.png',
  coloring_page_url: 'https://example.com/c.png',
  status: 'completed',
  created_at: '2025-01-01T00:00:00.000Z',
  ...overrides,
})

describe('Dashboard utils', () => {
  describe('formatImageDate', () => {
    it('returns the input string when given a non-date value', () => {
      expect(formatImageDate('not-a-date')).toBe('not-a-date')
    })

    it('formats a date string with ordinal suffix and relative label', () => {
      const today = new Date()
      const iso = today.toISOString()
      const result = formatImageDate(iso)
      expect(result).toContain('today')
      expect(result).toMatch(/, \d{4}/)
    })

    it('handles "days ago" formatting for past dates', () => {
      const past = new Date()
      past.setDate(past.getDate() - 3)
      const result = formatImageDate(past.toISOString())
      expect(result).toContain('3 days ago')
    })
  })

  describe('getVariantSummaries', () => {
    it('returns an empty array when there are no variants', () => {
      expect(getVariantSummaries(baseImage())).toEqual([])
    })

    it('pairs urls with prompts and falls back when prompt missing', () => {
      const image = baseImage({
        variant_urls: ['url-a', 'url-b'],
        variant_prompts: ['Prompt A'],
      })
      const result = getVariantSummaries(image)
      expect(result).toEqual([
        { url: 'url-a', prompt: 'Prompt A' },
        { url: 'url-b', prompt: 'Custom variant scene' },
      ])
    })

    it('filters out empty urls', () => {
      const image = baseImage({
        variant_urls: ['url-a', ''],
        variant_prompts: ['A', 'B'],
      })
      expect(getVariantSummaries(image)).toHaveLength(1)
    })
  })

  describe('buildColoringDisplayItems', () => {
    it('skips processing images and produces only completed entries', () => {
      const items = buildColoringDisplayItems([
        baseImage({ id: 'a', status: 'processing', coloring_page_url: undefined }),
        baseImage({ id: 'b' }),
      ])
      expect(items).toHaveLength(1)
      expect(items[0].id).toBe('b')
    })

    it('expands variants into additional display items', () => {
      const items = buildColoringDisplayItems([
        baseImage({
          id: 'a',
          variant_urls: ['v1', 'v2'],
          variant_prompts: ['P1', 'P2'],
        }),
      ])
      expect(items).toHaveLength(3)
      expect(items.filter(i => i.isVariant)).toHaveLength(2)
      expect(items[1].variantPrompt).toBe('P1')
      expect(items[1].displayId).toBe('a-variant-0')
    })

    it('sorts favorites before non-favorites', () => {
      const items = buildColoringDisplayItems([
        baseImage({ id: 'a', is_favorite: false, created_at: '2025-02-01T00:00:00Z' }),
        baseImage({ id: 'b', is_favorite: true, created_at: '2025-01-01T00:00:00Z' }),
      ])
      expect(items[0].id).toBe('b')
    })
  })

  describe('sortUploads', () => {
    it('places favorites first then sorts by date desc', () => {
      const result = sortUploads([
        baseImage({ id: 'a', is_favorite: false, created_at: '2025-03-01T00:00:00Z' }),
        baseImage({ id: 'b', is_favorite: true, created_at: '2025-01-01T00:00:00Z' }),
        baseImage({ id: 'c', is_favorite: false, created_at: '2025-02-01T00:00:00Z' }),
      ])
      expect(result.map(i => i.id)).toEqual(['b', 'a', 'c'])
    })
  })
})
