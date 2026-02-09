import { describe, it, expect, vi } from 'vitest'
import sharp from 'sharp'

// Mock sharp module
vi.mock('sharp', () => {
  const mockSharpInstance = {
    metadata: vi.fn().mockResolvedValue({ width: 800, height: 600 }),
    composite: vi.fn().mockReturnThis(),
    png: vi.fn().mockReturnThis(),
    toBuffer: vi.fn().mockResolvedValue(Buffer.from('mocked-watermarked-image')),
  }

  return {
    default: vi.fn(() => mockSharpInstance),
  }
})

describe('imageProcessor.ts', () => {
  describe('Watermark utility functions', () => {
    it('should export addWatermark function', async () => {
      const { addWatermark } = await import('@/lib/imageProcessor')
      expect(addWatermark).toBeDefined()
      expect(typeof addWatermark).toBe('function')
    })

    it('should handle valid image buffer with default options', async () => {
      const { addWatermark } = await import('@/lib/imageProcessor')
      const inputBuffer = Buffer.from('test-image-data')

      const result = await addWatermark(inputBuffer)

      expect(result).toBeDefined()
      expect(Buffer.isBuffer(result)).toBe(true)
      expect(sharp).toHaveBeenCalledWith(inputBuffer)
    })

    it('should handle custom watermark options', async () => {
      const { addWatermark } = await import('@/lib/imageProcessor')
      const inputBuffer = Buffer.from('test-image-data')

      const customOptions = {
        text: 'Custom Watermark',
        position: 'bottom-left' as const,
        fontSize: 30,
        opacity: 0.5,
      }

      const result = await addWatermark(inputBuffer, customOptions)

      expect(result).toBeDefined()
      expect(Buffer.isBuffer(result)).toBe(true)
    })

    it('should handle different position options', async () => {
      const { addWatermark } = await import('@/lib/imageProcessor')
      const inputBuffer = Buffer.from('test-image-data')

      const positions = ['bottom-left', 'bottom-center', 'bottom-right'] as const

      for (const position of positions) {
        const result = await addWatermark(inputBuffer, {
          text: 'Test',
          position,
          fontSize: 24,
          opacity: 0.7,
        })

        expect(result).toBeDefined()
        expect(Buffer.isBuffer(result)).toBe(true)
      }
    })

    it('should return original buffer on error', async () => {
      // Reset the mock to throw an error
      vi.clearAllMocks()
      const errorMock = {
        metadata: vi.fn().mockRejectedValue(new Error('Image processing failed')),
      }
      vi.mocked(sharp).mockReturnValue(errorMock as any)

      const { addWatermark } = await import('@/lib/imageProcessor')
      const inputBuffer = Buffer.from('test-image-data')

      const result = await addWatermark(inputBuffer)

      // Should return original buffer on error
      expect(result).toEqual(inputBuffer)
    })
  })

  describe('Watermark text positioning', () => {
    it('should handle long text strings', async () => {
      const { addWatermark } = await import('@/lib/imageProcessor')
      const inputBuffer = Buffer.from('test-image-data')

      const longText = 'This is a very long watermark text that should be handled properly'
      const result = await addWatermark(inputBuffer, {
        text: longText,
        position: 'bottom-center',
        fontSize: 24,
        opacity: 0.7,
      })

      expect(result).toBeDefined()
      expect(Buffer.isBuffer(result)).toBe(true)
    })

    it('should handle empty text', async () => {
      const { addWatermark } = await import('@/lib/imageProcessor')
      const inputBuffer = Buffer.from('test-image-data')

      const result = await addWatermark(inputBuffer, {
        text: '',
        position: 'bottom-right',
        fontSize: 24,
        opacity: 0.7,
      })

      expect(result).toBeDefined()
      expect(Buffer.isBuffer(result)).toBe(true)
    })
  })

  describe('Font size and opacity', () => {
    it('should handle various font sizes', async () => {
      const { addWatermark } = await import('@/lib/imageProcessor')
      const inputBuffer = Buffer.from('test-image-data')

      const fontSizes = [12, 24, 36, 48]

      for (const fontSize of fontSizes) {
        const result = await addWatermark(inputBuffer, {
          text: 'Test',
          position: 'bottom-right',
          fontSize,
          opacity: 0.7,
        })

        expect(result).toBeDefined()
        expect(Buffer.isBuffer(result)).toBe(true)
      }
    })

    it('should handle various opacity values', async () => {
      const { addWatermark } = await import('@/lib/imageProcessor')
      const inputBuffer = Buffer.from('test-image-data')

      const opacities = [0.1, 0.3, 0.5, 0.7, 0.9, 1.0]

      for (const opacity of opacities) {
        const result = await addWatermark(inputBuffer, {
          text: 'Test',
          position: 'bottom-right',
          fontSize: 24,
          opacity,
        })

        expect(result).toBeDefined()
        expect(Buffer.isBuffer(result)).toBe(true)
      }
    })
  })
})
