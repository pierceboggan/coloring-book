'use client'

import { useState } from 'react'
import { Sparkles, Loader2, Download, ChevronDown, ChevronUp, Check, Image as ImageIcon } from 'lucide-react'
import { VARIANT_THEMES, getThemePrompt } from '@/lib/variants'

interface Variant {
  id: string
  prompt: string
  url: string | null
  error?: string
  loading?: boolean
}

interface VariantsPanelProps {
  imageName: string
  originalUrl: string
  onVariantSelected?: (variantUrl: string) => void
}

export function VariantsPanel({ imageName, originalUrl, onVariantSelected }: VariantsPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [variants, setVariants] = useState<Variant[]>([])
  const [selectedThemes, setSelectedThemes] = useState<Set<string>>(new Set())
  const [customPrompt, setCustomPrompt] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const toggleTheme = (themeId: string) => {
    const newSelected = new Set(selectedThemes)
    if (newSelected.has(themeId)) {
      newSelected.delete(themeId)
    } else {
      // Limit to 10 total themes
      if (newSelected.size >= 10) {
        setError('Maximum 10 themes allowed')
        return
      }
      newSelected.add(themeId)
    }
    setSelectedThemes(newSelected)
    setError(null)
  }

  const generateVariants = async () => {
    const selectedThemeObjects = VARIANT_THEMES.filter((t) => selectedThemes.has(t.id))
    const allPrompts = [
      ...selectedThemeObjects.map((t) => getThemePrompt(t)),
      ...(customPrompt.trim() ? [customPrompt.trim()] : []),
    ]

    if (allPrompts.length === 0) {
      setError('Please select at least one theme or enter a custom prompt')
      return
    }

    if (allPrompts.length > 10) {
      setError('Maximum 10 prompts allowed (themes + custom)')
      return
    }

    setIsGenerating(true)
    setError(null)

    // Create initial variant entries with loading state
    const initialVariants: Variant[] = allPrompts.map((prompt, index) => ({
      id: `variant-${Date.now()}-${index}`,
      prompt,
      url: null,
      loading: true,
    }))
    setVariants(initialVariants)

    try {
      const response = await fetch('/api/prompt-remix', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageUrl: originalUrl,
          prompts: allPrompts,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to generate variants')
      }

      const data = await response.json()

      // Update variants with results
      setVariants(
        data.results.map((result: { prompt: string; url: string | null; error?: string }, index: number) => ({
          id: `variant-${Date.now()}-${index}`,
          prompt: result.prompt,
          url: result.url,
          error: result.error,
          loading: false,
        }))
      )
    } catch (err) {
      console.error('Failed to generate variants:', err)
      setError(err instanceof Error ? err.message : 'Failed to generate variants')
      setVariants([])
    } finally {
      setIsGenerating(false)
    }
  }

  const selectVariant = (variantUrl: string) => {
    if (onVariantSelected) {
      onVariantSelected(variantUrl)
    }
  }

  const successfulVariants = variants.filter((v) => v.url && !v.error)
  const hasVariants = variants.length > 0

  return (
    <div className="mt-4 overflow-hidden rounded-2xl border-4 border-[#C3B5FF] bg-white/90 shadow-[8px_8px_0_0_#A599E9]">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center justify-between px-5 py-4 text-left transition-colors hover:bg-[#F3F0FF]/50"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#C3B5FF] text-white">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-base font-bold text-[#3A2E39]">Generate Variants</h4>
            <p className="text-xs text-[#594144]/70">
              {hasVariants ? `${successfulVariants.length} variant${successfulVariants.length !== 1 ? 's' : ''} created` : 'Create multiple themed coloring pages'}
            </p>
          </div>
        </div>
        {isExpanded ? <ChevronUp className="h-5 w-5 text-[#6C63FF]" /> : <ChevronDown className="h-5 w-5 text-[#6C63FF]" />}
      </button>

      {isExpanded && (
        <div className="border-t-4 border-[#C3B5FF] p-5 space-y-5">
          {/* Theme Selection */}
          <div>
            <h5 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[#6C63FF]">Choose Themes (max 10)</h5>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
              {VARIANT_THEMES.map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => toggleTheme(theme.id)}
                  disabled={isGenerating}
                  className={`rounded-xl border-2 px-3 py-2 text-left text-xs font-semibold transition-all ${
                    selectedThemes.has(theme.id)
                      ? 'border-[#6C63FF] bg-[#F3F0FF] text-[#6C63FF] shadow-[4px_4px_0_0_#C3B5FF]'
                      : 'border-[#E5E0FF] bg-white text-[#594144] hover:border-[#C3B5FF]'
                  } disabled:cursor-not-allowed disabled:opacity-50`}
                  title={theme.description}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate">{theme.title}</span>
                    {selectedThemes.has(theme.id) && <Check className="h-3 w-3 flex-shrink-0" />}
                  </div>
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-[#594144]/60">
              {selectedThemes.size}/10 themes selected
            </p>
          </div>

          {/* Custom Prompt */}
          <div>
            <h5 className="mb-2 text-sm font-semibold uppercase tracking-wide text-[#6C63FF]">Custom Scene (Optional)</h5>
            <textarea
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              rows={2}
              disabled={isGenerating}
              className="w-full rounded-xl border-2 border-[#E5E0FF] px-4 py-2 text-sm focus:border-[#6C63FF] focus:outline-none focus:ring-2 focus:ring-[#C3B5FF]/50 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="E.g., playing in a magical garden with butterflies and flowers"
            />
          </div>

          {/* Error Display */}
          {error && (
            <div className="rounded-xl border-2 border-[#FF8BA7] bg-[#FFE6EB] px-4 py-3 text-sm text-[#FF6F91]">
              {error}
            </div>
          )}

          {/* Generate Button */}
          <button
            onClick={generateVariants}
            disabled={isGenerating || (selectedThemes.size === 0 && !customPrompt.trim())}
            className="flex w-full items-center justify-center gap-2 rounded-full border-4 border-[#6C63FF] bg-[#6C63FF] px-6 py-3 text-sm font-bold text-white shadow-[6px_6px_0_0_#5650E0] transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:border-gray-300 disabled:bg-gray-300 disabled:shadow-none disabled:translate-y-0"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Generating {selectedThemes.size + (customPrompt.trim() ? 1 : 0)} variants...
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5" />
                Generate All Variants
              </>
            )}
          </button>

          {/* Variants Display */}
          {hasVariants && (
            <div className="space-y-3 border-t-2 border-dashed border-[#E5E0FF] pt-5">
              <h5 className="text-sm font-semibold uppercase tracking-wide text-[#6C63FF]">
                Generated Variants ({successfulVariants.length})
              </h5>
              <div className="space-y-3">
                {variants.map((variant) => (
                  <div
                    key={variant.id}
                    className="overflow-hidden rounded-xl border-2 border-[#E5E0FF] bg-white transition-shadow hover:shadow-lg"
                  >
                    {variant.loading ? (
                      <div className="flex items-center gap-4 p-4">
                        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-[#F3F0FF]">
                          <Loader2 className="h-6 w-6 animate-spin text-[#6C63FF]" />
                        </div>
                        <div className="flex-1">
                          <div className="mb-2 h-4 w-3/4 animate-pulse rounded bg-gray-200" />
                          <div className="h-3 w-1/2 animate-pulse rounded bg-gray-200" />
                        </div>
                      </div>
                    ) : variant.error ? (
                      <div className="flex items-center gap-4 p-4">
                        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-[#FFE6EB]">
                          <ImageIcon className="h-6 w-6 text-[#FF6F91]" />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-[#FF6F91]">Failed to generate</p>
                          <p className="text-xs text-[#594144]/70">{variant.prompt}</p>
                          {variant.error && <p className="mt-1 text-xs text-[#FF6F91]">{variant.error}</p>}
                        </div>
                      </div>
                    ) : variant.url ? (
                      <div className="space-y-3 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <p className="flex-1 text-sm text-[#594144]">{variant.prompt}</p>
                          <div className="flex gap-2">
                            <button
                              onClick={() => selectVariant(variant.url!)}
                              className="flex items-center gap-1 rounded-full border-2 border-[#A0E7E5] bg-[#E0F7FA] px-3 py-1 text-xs font-semibold text-[#1DB9B3] shadow-[3px_3px_0_0_#55C6C0] transition-transform hover:-translate-y-0.5"
                              title="Use this as primary"
                            >
                              <Check className="h-3 w-3" />
                              Use
                            </button>
                            <a
                              href={variant.url}
                              download={`${imageName}-variant-${variant.id}.png`}
                              className="flex items-center gap-1 rounded-full border-2 border-[#FFB3BA] bg-[#FF6F91] px-3 py-1 text-xs font-semibold text-white shadow-[3px_3px_0_0_#f2557b] transition-transform hover:-translate-y-0.5"
                            >
                              <Download className="h-3 w-3" />
                              Download
                            </a>
                          </div>
                        </div>
                        <div className="overflow-hidden rounded-lg border-2 border-dashed border-[#E5E0FF]">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={variant.url} alt={`Variant: ${variant.prompt}`} className="w-full" />
                        </div>
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
