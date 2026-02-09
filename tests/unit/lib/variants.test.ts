import { describe, it, expect } from 'vitest'
import {
  buildVariantPrompt,
  getThemePrompt,
  VARIANT_PACKS,
  VARIANT_THEMES,
  VARIANT_THEME_LOOKUP,
  type VariantTheme,
} from '@/lib/variants'

describe('variants.ts', () => {
  describe('Data Structure Validation', () => {
    it('should have valid VARIANT_PACKS structure', () => {
      expect(VARIANT_PACKS).toBeDefined()
      expect(Array.isArray(VARIANT_PACKS)).toBe(true)
      expect(VARIANT_PACKS.length).toBeGreaterThan(0)

      VARIANT_PACKS.forEach((pack) => {
        expect(pack.id).toBeDefined()
        expect(pack.title).toBeDefined()
        expect(pack.description).toBeDefined()
        expect(pack.category).toBeDefined()
        expect(pack.type).toMatch(/^(core|seasonal|community)$/)
        expect(pack.thumbnail).toBeDefined()
        expect(Array.isArray(pack.themes)).toBe(true)
        expect(pack.themes.length).toBeGreaterThan(0)
      })
    })

    it('should have valid theme structures', () => {
      VARIANT_PACKS.forEach((pack) => {
        pack.themes.forEach((theme) => {
          expect(theme.id).toBeDefined()
          expect(theme.title).toBeDefined()
          expect(theme.description).toBeDefined()
          expect(theme.prompt).toBeDefined()
          expect(theme.thumbnail).toBeDefined()
        })
      })
    })

    it('should flatten VARIANT_THEMES correctly', () => {
      expect(VARIANT_THEMES).toBeDefined()
      expect(Array.isArray(VARIANT_THEMES)).toBe(true)

      const totalThemes = VARIANT_PACKS.reduce((sum, pack) => sum + pack.themes.length, 0)
      expect(VARIANT_THEMES.length).toBe(totalThemes)

      VARIANT_THEMES.forEach((theme) => {
        expect(theme.packId).toBeDefined()
        expect(theme.packTitle).toBeDefined()
        expect(theme.packType).toBeDefined()
        expect(theme.packCategory).toBeDefined()
        expect(typeof theme.seasonal).toBe('boolean')
      })
    })

    it('should create valid VARIANT_THEME_LOOKUP', () => {
      expect(VARIANT_THEME_LOOKUP).toBeDefined()
      expect(typeof VARIANT_THEME_LOOKUP).toBe('object')

      VARIANT_THEMES.forEach((theme) => {
        expect(VARIANT_THEME_LOOKUP[theme.id]).toEqual(theme)
      })
    })

    it('should have unique theme IDs', () => {
      const themeIds = VARIANT_THEMES.map((theme) => theme.id)
      const uniqueIds = new Set(themeIds)
      expect(uniqueIds.size).toBe(themeIds.length)
    })
  })

  describe('buildVariantPrompt', () => {
    it('should build basic prompt with no themes', () => {
      const prompt = buildVariantPrompt('a dog', [])

      expect(prompt).toContain('a dog')
      expect(prompt).toContain('black and white coloring book page')
      expect(prompt).toContain('bold outlines')
      expect(prompt).toContain('white background')
      expect(prompt).toContain('black line art only')
    })

    it('should build prompt with single theme', () => {
      const campingTheme = VARIANT_THEMES.find((t) => t.id === 'camping')
      expect(campingTheme).toBeDefined()

      const prompt = buildVariantPrompt('a dog', ['camping'])

      expect(prompt).toContain('a dog')
      expect(prompt).toContain('camping in a cozy forest')
      expect(prompt).toContain('tents')
      expect(prompt).toContain('campfire')
    })

    it('should build prompt with multiple themes', () => {
      const prompt = buildVariantPrompt('a cat', ['camping', 'space'])

      expect(prompt).toContain('a cat')
      expect(prompt).toContain('camping')
      expect(prompt).toContain('space')
    })

    it('should handle custom prompt', () => {
      const customPrompt = 'Make it look like a superhero with a cape'
      const prompt = buildVariantPrompt('a dog', [], customPrompt)

      expect(prompt).toContain('a dog')
      expect(prompt).toContain(customPrompt)
      expect(prompt).toContain('black and white coloring book page')
    })

    it('should prioritize custom prompt over themes', () => {
      const customPrompt = 'Custom instructions here'
      const prompt = buildVariantPrompt('a dog', ['camping'], customPrompt)

      expect(prompt).toContain(customPrompt)
      expect(prompt).not.toContain('camping')
    })

    it('should handle non-existent theme IDs gracefully', () => {
      const prompt = buildVariantPrompt('a dog', ['non-existent-theme'])

      expect(prompt).toContain('a dog')
      expect(prompt).toContain('black and white coloring book page')
    })

    it('should include all required coloring book instructions', () => {
      const prompt = buildVariantPrompt('test subject', ['camping'])

      expect(prompt).toContain('clear, bold outlines')
      expect(prompt).toContain('suitable for coloring')
      expect(prompt).toContain('white background')
      expect(prompt).toContain('black line art only')
      expect(prompt).toContain('No shading, gradients, or filled areas')
      expect(prompt).toContain('clean outlines')
      expect(prompt).toContain("child's coloring book")
    })
  })

  describe('getThemePrompt', () => {
    it('should return theme prompt', () => {
      const campingTheme = VARIANT_THEMES.find((t) => t.id === 'camping')
      expect(campingTheme).toBeDefined()

      const prompt = getThemePrompt(campingTheme as VariantTheme)

      expect(prompt).toBe(campingTheme?.prompt)
      expect(prompt).toContain('camping')
    })

    it('should work for all themes', () => {
      VARIANT_THEMES.forEach((theme) => {
        const prompt = getThemePrompt(theme)
        expect(prompt).toBe(theme.prompt)
        expect(typeof prompt).toBe('string')
        expect(prompt.length).toBeGreaterThan(0)
      })
    })
  })

  describe('Theme Pack Types', () => {
    it('should have core theme packs', () => {
      const corePacks = VARIANT_PACKS.filter((pack) => pack.type === 'core')
      expect(corePacks.length).toBeGreaterThan(0)
    })

    it('should have seasonal theme packs', () => {
      const seasonalPacks = VARIANT_PACKS.filter((pack) => pack.type === 'seasonal')
      expect(seasonalPacks.length).toBeGreaterThan(0)

      seasonalPacks.forEach((pack) => {
        expect(pack.seasonal).toBe(true)
      })
    })

    it('should have community theme packs', () => {
      const communityPacks = VARIANT_PACKS.filter((pack) => pack.type === 'community')
      expect(communityPacks.length).toBeGreaterThan(0)
    })

    it('should mark seasonal themes correctly', () => {
      const seasonalThemes = VARIANT_THEMES.filter((theme) => theme.seasonal)
      expect(seasonalThemes.length).toBeGreaterThan(0)

      seasonalThemes.forEach((theme) => {
        const pack = VARIANT_PACKS.find((p) => p.id === theme.packId)
        expect(pack?.seasonal).toBe(true)
      })
    })
  })

  describe('Theme Metadata', () => {
    it('should have thumbnails for all packs', () => {
      VARIANT_PACKS.forEach((pack) => {
        expect(pack.thumbnail).toMatch(/^\/variant-thumbnails\//)
        expect(pack.thumbnail).toMatch(/\.(svg|png|jpg)$/)
      })
    })

    it('should have thumbnails for all themes', () => {
      VARIANT_THEMES.forEach((theme) => {
        expect(theme.thumbnail).toMatch(/^\/variant-thumbnails\//)
        expect(theme.thumbnail).toMatch(/\.(svg|png|jpg)$/)
      })
    })

    it('should have tags for some themes', () => {
      const themesWithTags = VARIANT_THEMES.filter((theme) => theme.tags && theme.tags.length > 0)
      expect(themesWithTags.length).toBeGreaterThan(0)
    })

    it('should have submittedBy for community themes', () => {
      const communityThemes = VARIANT_THEMES.filter((theme) => theme.packType === 'community')
      communityThemes.forEach((theme) => {
        expect(theme.submittedBy).toBeDefined()
        expect(typeof theme.submittedBy).toBe('string')
      })
    })
  })
})
