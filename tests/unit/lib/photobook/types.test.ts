import { describe, it, expect } from 'vitest'
import {
  serializePayload,
  parsePayload,
  type PhotobookJobPayload,
  type PhotobookImage,
} from '@/lib/photobook/types'

describe('photobook/types.ts', () => {
  describe('serializePayload', () => {
    it('should serialize valid payload', () => {
      const payload: PhotobookJobPayload = {
        images: [
          {
            id: 'img-1',
            name: 'Image 1',
            coloring_page_url: 'https://example.com/image1.jpg',
          },
          {
            id: 'img-2',
            name: 'Image 2',
            coloring_page_url: 'https://example.com/image2.jpg',
          },
        ],
        title: 'My Photobook',
        userId: 'user-123',
      }

      const serialized = serializePayload(payload)

      expect(serialized).toBeDefined()
      expect(serialized).toHaveProperty('images')
      expect(serialized).toHaveProperty('title')
      expect(serialized).toHaveProperty('userId')
    })

    it('should handle empty images array', () => {
      const payload: PhotobookJobPayload = {
        images: [],
        title: 'Empty Photobook',
        userId: 'user-123',
      }

      const serialized = serializePayload(payload)

      expect(serialized).toBeDefined()
      expect(Array.isArray((serialized as any).images)).toBe(true)
      expect((serialized as any).images.length).toBe(0)
    })
  })

  describe('parsePayload', () => {
    it('should parse valid payload', () => {
      const rawPayload = {
        images: [
          {
            id: 'img-1',
            name: 'Image 1',
            coloring_page_url: 'https://example.com/image1.jpg',
          },
          {
            id: 'img-2',
            name: 'Image 2',
            coloring_page_url: 'https://example.com/image2.jpg',
          },
        ],
        title: 'My Photobook',
        userId: 'user-123',
      }

      const parsed = parsePayload(rawPayload as any)

      expect(parsed).not.toBeNull()
      expect(parsed?.images).toHaveLength(2)
      expect(parsed?.title).toBe('My Photobook')
      expect(parsed?.userId).toBe('user-123')
      expect(parsed?.images[0]).toEqual({
        id: 'img-1',
        name: 'Image 1',
        coloring_page_url: 'https://example.com/image1.jpg',
      })
    })

    it('should return null for null payload', () => {
      const parsed = parsePayload(null as any)
      expect(parsed).toBeNull()
    })

    it('should return null for non-object payload', () => {
      const parsed = parsePayload('not an object' as any)
      expect(parsed).toBeNull()
    })

    it('should return null for payload without images array', () => {
      const rawPayload = {
        title: 'My Photobook',
        userId: 'user-123',
      }

      const parsed = parsePayload(rawPayload as any)
      expect(parsed).toBeNull()
    })

    it('should return null for payload without title', () => {
      const rawPayload = {
        images: [
          {
            id: 'img-1',
            name: 'Image 1',
            coloring_page_url: 'https://example.com/image1.jpg',
          },
        ],
        userId: 'user-123',
      }

      const parsed = parsePayload(rawPayload as any)
      expect(parsed).toBeNull()
    })

    it('should return null for payload without userId', () => {
      const rawPayload = {
        images: [
          {
            id: 'img-1',
            name: 'Image 1',
            coloring_page_url: 'https://example.com/image1.jpg',
          },
        ],
        title: 'My Photobook',
      }

      const parsed = parsePayload(rawPayload as any)
      expect(parsed).toBeNull()
    })

    it('should filter out invalid images', () => {
      const rawPayload = {
        images: [
          {
            id: 'img-1',
            name: 'Image 1',
            coloring_page_url: 'https://example.com/image1.jpg',
          },
          {
            // Missing coloring_page_url
            id: 'img-2',
            name: 'Image 2',
          },
          {
            id: 'img-3',
            name: 'Image 3',
            coloring_page_url: 'https://example.com/image3.jpg',
          },
          null, // null image
          'not an object', // invalid type
        ],
        title: 'My Photobook',
        userId: 'user-123',
      }

      const parsed = parsePayload(rawPayload as any)

      expect(parsed).not.toBeNull()
      expect(parsed?.images).toHaveLength(2)
      expect(parsed?.images[0].id).toBe('img-1')
      expect(parsed?.images[1].id).toBe('img-3')
    })

    it('should handle images with missing id', () => {
      const rawPayload = {
        images: [
          {
            name: 'Image 1',
            coloring_page_url: 'https://example.com/image1.jpg',
          },
        ],
        title: 'My Photobook',
        userId: 'user-123',
      }

      const parsed = parsePayload(rawPayload as any)

      expect(parsed).not.toBeNull()
      expect(parsed?.images).toHaveLength(0)
    })

    it('should handle images with missing name', () => {
      const rawPayload = {
        images: [
          {
            id: 'img-1',
            coloring_page_url: 'https://example.com/image1.jpg',
          },
        ],
        title: 'My Photobook',
        userId: 'user-123',
      }

      const parsed = parsePayload(rawPayload as any)

      expect(parsed).not.toBeNull()
      expect(parsed?.images).toHaveLength(0)
    })

    it('should handle images with wrong types', () => {
      const rawPayload = {
        images: [
          {
            id: 123, // should be string
            name: 'Image 1',
            coloring_page_url: 'https://example.com/image1.jpg',
          },
          {
            id: 'img-2',
            name: true, // should be string
            coloring_page_url: 'https://example.com/image2.jpg',
          },
          {
            id: 'img-3',
            name: 'Image 3',
            coloring_page_url: 12345, // should be string
          },
        ],
        title: 'My Photobook',
        userId: 'user-123',
      }

      const parsed = parsePayload(rawPayload as any)

      expect(parsed).not.toBeNull()
      expect(parsed?.images).toHaveLength(0)
    })

    it('should handle empty images array', () => {
      const rawPayload = {
        images: [],
        title: 'Empty Photobook',
        userId: 'user-123',
      }

      const parsed = parsePayload(rawPayload as any)

      expect(parsed).not.toBeNull()
      expect(parsed?.images).toHaveLength(0)
    })

    it('should handle title with wrong type', () => {
      const rawPayload = {
        images: [
          {
            id: 'img-1',
            name: 'Image 1',
            coloring_page_url: 'https://example.com/image1.jpg',
          },
        ],
        title: 123, // should be string
        userId: 'user-123',
      }

      const parsed = parsePayload(rawPayload as any)
      expect(parsed).toBeNull()
    })

    it('should handle userId with wrong type', () => {
      const rawPayload = {
        images: [
          {
            id: 'img-1',
            name: 'Image 1',
            coloring_page_url: 'https://example.com/image1.jpg',
          },
        ],
        title: 'My Photobook',
        userId: 123, // should be string
      }

      const parsed = parsePayload(rawPayload as any)
      expect(parsed).toBeNull()
    })
  })

  describe('Round-trip serialization', () => {
    it('should preserve data through serialize and parse', () => {
      const originalPayload: PhotobookJobPayload = {
        images: [
          {
            id: 'img-1',
            name: 'Image 1',
            coloring_page_url: 'https://example.com/image1.jpg',
          },
          {
            id: 'img-2',
            name: 'Image 2',
            coloring_page_url: 'https://example.com/image2.jpg',
          },
        ],
        title: 'My Photobook',
        userId: 'user-123',
      }

      const serialized = serializePayload(originalPayload)
      const parsed = parsePayload(serialized as any)

      expect(parsed).toEqual(originalPayload)
    })
  })
})
