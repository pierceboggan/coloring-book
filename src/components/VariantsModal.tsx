'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  Sparkles,
  Loader2,
  X,
  Check,
  Image as ImageIcon,
  Download,
  Wand2,
} from 'lucide-react'
import {
  VARIANT_PACKS,
  VARIANT_THEMES,
  getThemePrompt,
  type VariantPack,
  type VariantTheme,
} from '@/lib/variants'
import type { PromptRemixJob } from '@/types/prompt-remix'

const CATEGORY_FILTERS = Array.from(new Set(['All', ...VARIANT_PACKS.map(pack => pack.category)]))

interface VariantSummary {
  url: string
  prompt: string
}

interface GenerationAttempt {
  id: string
  prompt: string
  status: 'loading' | 'success' | 'error'
  url?: string | null
  error?: string
}

interface VariantsModalProps {
  isOpen: boolean
  onClose: () => void
  imageId: string
  imageName: string
  originalUrl: string
  variants: VariantSummary[]
  onVariantsUpdated: (variants: VariantSummary[]) => void
  onUseVariant: (variantUrl: string) => Promise<void>
}

const MAX_VARIANT_PROMPTS = 10

export function VariantsModal({
  isOpen,
  onClose,
  imageId,
  imageName,
  originalUrl,
  variants,
  onVariantsUpdated,
  onUseVariant,
}: VariantsModalProps) {
  const [selectedThemes, setSelectedThemes] = useState<Set<string>>(new Set())
  const [customPrompt, setCustomPrompt] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [storedVariants, setStoredVariants] = useState<VariantSummary[]>(variants)
  const [generationAttempts, setGenerationAttempts] = useState<GenerationAttempt[]>([])
  const [activeJob, setActiveJob] = useState<PromptRemixJob | null>(null)
  const [applyInProgress, setApplyInProgress] = useState<string | null>(null)
  const [activeCategory, setActiveCategory] = useState('All')

  useEffect(() => {
    if (isOpen) {
      setStoredVariants(variants)
    } else {
      setSelectedThemes(new Set())
      setCustomPrompt('')
      setGenerationAttempts([])
      setError(null)
      setApplyInProgress(null)
      setActiveCategory('All')
    }
  }, [isOpen, variants])

  const selectedCount = selectedThemes.size + (customPrompt.trim() ? 1 : 0)

  const selectedThemeObjects = useMemo<VariantTheme[]>(
    () => VARIANT_THEMES.filter(theme => selectedThemes.has(theme.id)),
    [selectedThemes]
  )

  const visiblePacks = useMemo(() => {
    if (activeCategory === 'All') {
      return VARIANT_PACKS
    }

    return VARIANT_PACKS.filter(pack => pack.category === activeCategory)
  }, [activeCategory])

  const packTypeLabels: Record<VariantPack['type'], string> = {
    core: 'Curated pack',
    seasonal: 'Seasonal drop',
    community: 'Community pick',
  }

  const packTypeClasses: Record<VariantPack['type'], string> = {
    core: 'border-[#C3B5FF] bg-[#E5E0FF] text-[#6C63FF]',
    seasonal: 'border-[#FFD166] bg-[#FFF3BF] text-[#AA6A00]',
    community: 'border-[#93C5FD] bg-[#DBEAFE] text-[#1D4ED8]',
  }

  const mapJobResultsToGenerationAttempts = (job: PromptRemixJob): GenerationAttempt[] =>
    job.results.map((result, index) => {
      const status: GenerationAttempt['status'] =
        result.status === 'succeeded' ? 'success' : result.status === 'failed' ? 'error' : 'loading'

      return {
        id: `${job.id}-${index}`,
        prompt: result.prompt,
        status,
        url: result.url ?? undefined,
        error: result.error ?? undefined,
      }
    })

  const mergeVariantsFromJob = (job: PromptRemixJob) => {
    const successful = job.results?.filter(result => result.status === 'succeeded' && result.url)

    if (!successful?.length) {
      return
    }

    setStoredVariants(prev => {
      const existingUrls = new Set(prev.map(variant => variant.url))

      const newEntries = successful
        .filter(result => result.url && !existingUrls.has(result.url))
        .map(result => ({
          url: result.url as string,
          prompt: result.prompt,
        }))

      if (newEntries.length === 0) {
        return prev
      }

      const updated = [...newEntries, ...prev]
      onVariantsUpdated(updated)
      return updated
    })
  }

  const pollJobUntilFinished = async (jobId: string): Promise<PromptRemixJob> => {
    const maxAttempts = 120
    let latestJob: PromptRemixJob | null = null

    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      if (attempt > 0) {
        await new Promise(resolve => setTimeout(resolve, 2000))
      }

      const statusResponse = await fetch(`/api/prompt-remix/${jobId}`)

      if (!statusResponse.ok) {
        throw new Error('Failed to fetch prompt remix job status.')
      }

      const statusData = await statusResponse.json()
      const job = statusData.job as PromptRemixJob

      latestJob = job
      setActiveJob(job)
      setGenerationAttempts(mapJobResultsToGenerationAttempts(job))
      mergeVariantsFromJob(job)

      if (job.status === 'completed' || job.status === 'failed') {
        break
      }
    }

    if (!latestJob) {
      throw new Error('Prompt remix job did not return any status updates.')
    }

    if (latestJob.status !== 'completed' && latestJob.status !== 'failed') {
      throw new Error('Prompt remix job timed out before completion.')
    }

    return latestJob
  }

  const themeSelectionLimitReached = selectedThemes.size >= MAX_VARIANT_PROMPTS

  const toggleTheme = (themeId: string) => {
    const updated = new Set(selectedThemes)
    if (updated.has(themeId)) {
      updated.delete(themeId)
    } else {
      if (updated.size >= MAX_VARIANT_PROMPTS) {
        setError(`Maximum ${MAX_VARIANT_PROMPTS} prompts at a time`)
        return
      }
      updated.add(themeId)
    }

    setSelectedThemes(updated)
    setError(null)
  }

  const handleGenerate = async () => {
    const promptInputs = [
      ...selectedThemeObjects.map(theme => getThemePrompt(theme)),
      ...(customPrompt.trim() ? [customPrompt.trim()] : []),
    ]

    if (promptInputs.length === 0) {
      setError('Pick at least one scene or write your own prompt to start generating variants.')
      return
    }

    if (promptInputs.length > MAX_VARIANT_PROMPTS) {
      setError(`Maximum ${MAX_VARIANT_PROMPTS} prompts at a time`)
      return
    }

    setIsGenerating(true)
    setError(null)

    const initialAttempts = promptInputs.map((prompt, index) => ({
      id: `${Date.now()}-${index}`,
      prompt,
      status: 'loading' as const,
    }))
    setGenerationAttempts(initialAttempts)

    try {
      const response = await fetch('/api/prompt-remix', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageId,
          imageUrl: originalUrl,
          prompts: promptInputs,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        throw new Error(errorData?.error || 'Failed to generate variants. Please try again.')
      }

      const data = await response.json()
      const job = data.job as PromptRemixJob | undefined

      if (!job) {
        throw new Error('Failed to enqueue prompt remix job.')
      }

      setActiveJob(job)
      setGenerationAttempts(mapJobResultsToGenerationAttempts(job))

      const finalJob = await pollJobUntilFinished(job.id)

      if (finalJob.status === 'failed') {
        setError(finalJob.error_message || 'Some prompts failed to generate. You can retry the failed prompts later.')
      } else {
        setError(null)
      }
    } catch (err) {
      console.error('Variant generation failed:', err)
      setError(err instanceof Error ? err.message : 'Unable to generate variants right now.')
      setGenerationAttempts([])
    } finally {
      setIsGenerating(false)
      setActiveJob(null)
    }
  }

  const handleUseVariant = async (variantUrl: string) => {
    try {
      setApplyInProgress(variantUrl)
      await onUseVariant(variantUrl)
    } catch (err) {
      console.error('Failed to apply variant:', err)
      setError(err instanceof Error ? err.message : 'Failed to update the coloring page with this variant.')
    } finally {
      setApplyInProgress(null)
    }
  }

  if (!isOpen) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#3A2E39]/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden rounded-[2.5rem] border-4 border-[#C3B5FF] bg-white shadow-[20px_20px_0_0_#A599E9]">
        <div className="flex-shrink-0 flex items-center justify-between border-b-4 border-[#C3B5FF] bg-[#F6F3FF] px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#C3B5FF] text-white shadow-inner">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-[#6C63FF]">Variant studio</p>
              <h2 className="text-xl font-bold text-[#3A2E39]">{imageName}</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-[#C3B5FF] bg-white text-[#6C63FF] shadow-[4px_4px_0_0_#A599E9] transition-transform hover:-translate-y-0.5"
            aria-label="Close variants"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="grid gap-6 p-6 lg:grid-cols-[minmax(0,2.2fr)_minmax(0,2.8fr)]">
            <div className="space-y-5">
            <div className="overflow-hidden rounded-[1.75rem] border-4 border-[#E5E0FF] bg-[#F6F3FF] p-4">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-[#6C63FF]">Reference photo</h3>
              <div className="mt-3 overflow-hidden rounded-2xl border-2 border-dashed border-[#C3B5FF]/70 bg-white">
                <img src={originalUrl} alt={imageName} className="w-full object-cover" />
              </div>
            </div>

            <div className="rounded-[1.75rem] border-4 border-[#E5E0FF] bg-white/90 p-5 shadow-[8px_8px_0_0_#D8CEF9]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold text-[#3A2E39]">Scene ideas</h3>
                  <p className="text-sm font-medium text-[#594144]/70">
                    Pick up to {MAX_VARIANT_PROMPTS} themes or write your own magical adventure.
                  </p>
                </div>
                <div className="rounded-full border-2 border-[#C3B5FF] bg-[#F6F3FF] px-3 py-1 text-xs font-semibold text-[#6C63FF]">
                  {selectedCount} selected
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {CATEGORY_FILTERS.map(category => {
                  const isActive = activeCategory === category
                  return (
                    <button
                      key={category}
                      type="button"
                      onClick={() => setActiveCategory(category)}
                      disabled={isGenerating}
                      className={`rounded-full border-2 px-4 py-1.5 text-xs font-semibold transition-all ${
                        isActive
                          ? 'border-[#6C63FF] bg-[#6C63FF] text-white shadow-[4px_4px_0_0_#4F46E5]'
                          : 'border-[#E5E0FF] bg-white text-[#6C63FF] hover:border-[#C3B5FF]'
                      } disabled:cursor-not-allowed disabled:opacity-60`}
                    >
                      {category}
                    </button>
                  )
                })}
              </div>

              <div className="mt-4 space-y-4">
                {visiblePacks.map(pack => (
                  <div
                    key={pack.id}
                    className="rounded-2xl border-2 border-[#E5E0FF] bg-white/95 p-4 shadow-[4px_4px_0_0_#D8CEF9]"
                  >
                    <div className="flex flex-wrap items-start gap-4">
                      <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl border-2 border-white bg-[#F6F3FF] shadow-[4px_4px_0_0_#C3B5FF]">
                        <img src={pack.thumbnail} alt={`${pack.title} badge`} className="h-full w-full object-cover" />
                      </div>
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="text-sm font-bold text-[#3A2E39]">{pack.title}</h4>
                          <span
                            className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${packTypeClasses[pack.type]}`}
                          >
                            {packTypeLabels[pack.type]}
                          </span>
                          <span className="rounded-full border border-[#E5E0FF] bg-[#F6F3FF] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#6C63FF]">
                            {pack.category}
                          </span>
                          {pack.seasonal && (
                            <span className="rounded-full border border-[#FFD166] bg-[#FFF3BF] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#AA6A00]">
                              Seasonal
                            </span>
                          )}
                        </div>
                        <p className="text-xs font-medium text-[#594144]/80">{pack.description}</p>
                        {pack.availabilityNote && (
                          <p className="text-xs font-semibold text-[#AA6A00]">{pack.availabilityNote}</p>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      {pack.themes.map(theme => {
                        const isSelected = selectedThemes.has(theme.id)
                        const disableSelection = isGenerating || (!isSelected && themeSelectionLimitReached)

                        return (
                          <button
                            key={theme.id}
                            type="button"
                            onClick={() => toggleTheme(theme.id)}
                            disabled={disableSelection}
                            className={`group flex items-center gap-3 rounded-2xl border-2 px-3 py-3 text-left transition-all ${
                              isSelected
                                ? 'border-[#6C63FF] bg-[#F3F0FF] text-[#3A2E39] shadow-[4px_4px_0_0_#C3B5FF]'
                                : 'border-[#E5E0FF] bg-white text-[#594144] hover:border-[#C3B5FF] hover:shadow-[4px_4px_0_0_#E5E0FF]'
                            } disabled:cursor-not-allowed disabled:opacity-60`}
                            title={theme.description}
                          >
                            <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-xl border-2 border-white bg-[#F6F3FF] shadow-[2px_2px_0_0_#C3B5FF]">
                              <img src={theme.thumbnail} alt={`${theme.title} thumbnail`} className="h-full w-full object-cover" />
                              {isSelected && (
                                <div className="absolute inset-0 flex items-center justify-center bg-[#6C63FF]/70 text-white">
                                  <Check className="h-5 w-5" />
                                </div>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-semibold text-[#3A2E39]">{theme.title}</p>
                              <p className="mt-0.5 text-xs font-medium text-[#594144]/70 line-clamp-2">{theme.description}</p>
                              <div className="mt-1 flex flex-wrap gap-1">
                                {theme.tags?.map(tag => (
                                  <span
                                    key={tag}
                                    className="rounded-full border border-[#E5E0FF] bg-[#F6F3FF] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#6C63FF]"
                                  >
                                    {tag}
                                  </span>
                                ))}
                                {theme.submittedBy && (
                                  <span className="rounded-full border border-[#93C5FD] bg-[#DBEAFE] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#1D4ED8]">
                                    From {theme.submittedBy}
                                  </span>
                                )}
                              </div>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4">
                <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-[#6C63FF]">
                  Custom scene (optional)
                </label>
                <textarea
                  value={customPrompt}
                  onChange={event => setCustomPrompt(event.target.value)}
                  rows={3}
                  disabled={isGenerating}
                  placeholder="E.g., exploring a magical garden with butterflies and sparkling fountains"
                  className="w-full rounded-xl border-2 border-[#E5E0FF] px-4 py-2 text-sm text-[#3A2E39] focus:border-[#6C63FF] focus:outline-none focus:ring-2 focus:ring-[#C3B5FF]/50 disabled:cursor-not-allowed disabled:opacity-60"
                />
              </div>

              {error && (
                <div className="mt-4 rounded-xl border-2 border-[#FF8BA7] bg-[#FFE6EB] px-4 py-3 text-sm text-[#FF6F91]">
                  {error}
                </div>
              )}

              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={isGenerating || selectedCount === 0}
                className="inline-flex items-center gap-2 rounded-full border-4 border-[#6C63FF] bg-[#6C63FF] px-6 py-3 text-sm font-bold text-white shadow-[8px_8px_0_0_#5650E0] transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:border-gray-300 disabled:bg-gray-300 disabled:shadow-none"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    {activeJob ? (
                      <>Brewing {activeJob.results.filter(result => result.status === 'succeeded').length}/{activeJob.results.length} variants</>
                    ) : (
                      <>Brewing {selectedCount} variant{selectedCount === 1 ? '' : 's'}</>
                    )}
                  </>
                ) : (
                  <>
                    <Sparkles className="h-5 w-5" />
                    Generate variants
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedThemes(new Set())
                    setCustomPrompt('')
                    setError(null)
                  }}
                  disabled={isGenerating || (selectedThemes.size === 0 && !customPrompt.trim())}
                  className="inline-flex items-center gap-2 rounded-full border-4 border-[#C3B5FF] bg-white px-6 py-3 text-sm font-semibold text-[#6C63FF] shadow-[6px_6px_0_0_#A599E9] transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:border-gray-200 disabled:text-gray-400 disabled:shadow-none"
                >
                  <Wand2 className="h-5 w-5" />
                  Reset selections
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-[1.75rem] border-4 border-[#A0E7E5] bg-white/90 p-5 shadow-[10px_10px_0_0_#55C6C0]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold text-[#3A2E39]">Saved variants</h3>
                  <p className="text-sm font-medium text-[#594144]/70">
                    Promote a variant to become the main coloring page or download it for later.
                  </p>
                </div>
                <div className="rounded-full border-2 border-[#A0E7E5] bg-[#E0F7FA] px-3 py-1 text-xs font-semibold text-[#1DB9B3]">
                  {storedVariants.length} saved
                </div>
              </div>

              {storedVariants.length === 0 ? (
                <div className="mt-5 rounded-2xl border-2 border-dashed border-[#A0E7E5]/60 bg-[#E0F7FA]/40 p-6 text-center">
                  <p className="text-sm font-semibold text-[#1DB9B3]">
                    No variants yet. Generate scenes to build your collection!
                  </p>
                </div>
              ) : (
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  {storedVariants.map((variant) => (
                    <div
                      key={variant.url}
                      className="flex h-full flex-col overflow-hidden rounded-2xl border-2 border-[#A0E7E5]/70 bg-white shadow-sm"
                    >
                      <div className="aspect-square overflow-hidden border-b-2 border-[#A0E7E5]/60 bg-[#F6F3FF]">
                        <img src={variant.url} alt={variant.prompt} className="h-full w-full object-cover" />
                      </div>
                      <div className="flex flex-1 flex-col gap-3 p-4">
                        <p className="flex-1 text-sm font-medium text-[#594144] line-clamp-3">{variant.prompt}</p>
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => handleUseVariant(variant.url)}
                            disabled={applyInProgress === variant.url}
                            className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border-2 border-[#FFB3BA] bg-[#FF6F91] px-3 py-1.5 text-xs font-semibold text-white shadow-[4px_4px_0_0_#f2557b] transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:border-gray-200 disabled:bg-gray-200 disabled:text-gray-500 disabled:shadow-none"
                          >
                            {applyInProgress === variant.url ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Check className="h-4 w-4" />
                            )}
                            Use as main page
                          </button>
                          <a
                            href={variant.url}
                            download={`${imageName}-variant.png`}
                            className="inline-flex items-center gap-2 rounded-full border-2 border-[#FFB3BA] bg-white px-3 py-1.5 text-xs font-semibold text-[#FF6F91] shadow-[4px_4px_0_0_#FF8A80] transition-transform hover:-translate-y-0.5"
                          >
                            <Download className="h-4 w-4" />
                            Download
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-[1.75rem] border-4 border-dashed border-[#FFD166] bg-[#FFF3BF]/70 p-5 shadow-[8px_8px_0_0_#FFB84C]">
              <div className="flex items-start gap-3">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-white text-[#AA6A00] shadow-inner">
                  <Sparkles className="h-6 w-6" />
                </div>
                <div className="flex-1 space-y-3">
                  <div>
                    <h3 className="text-base font-bold text-[#3A2E39]">Latest generation run</h3>
                    <p className="text-sm font-medium text-[#594144]/70">
                      We keep track of the most recent prompts so you know what finished and what needs another try.
                    </p>
                  </div>

                  {generationAttempts.length === 0 ? (
                    <p className="text-sm font-semibold text-[#AA6A00]">
                      Start a new batch to see progress updates here.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {generationAttempts.map(attempt => (
                        <div
                          key={attempt.id}
                          className="flex items-start gap-3 rounded-2xl border-2 border-white/60 bg-white/80 px-4 py-3"
                        >
                          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-[#FFE6EB] text-[#FF6F91]">
                            {attempt.status === 'loading' ? (
                              <Loader2 className="h-5 w-5 animate-spin" />
                            ) : attempt.status === 'success' ? (
                              <Check className="h-5 w-5" />
                            ) : (
                              <ImageIcon className="h-5 w-5" />
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-[#3A2E39]">{attempt.prompt}</p>
                            {attempt.status === 'error' && (
                              <p className="text-xs font-medium text-[#FF6F91]">
                                {attempt.error || 'Variant failed to generate'}
                              </p>
                            )}
                            {attempt.status === 'success' && attempt.url && (
                              <a
                                href={attempt.url}
                                target="_blank"
                                rel="noreferrer"
                                className="mt-1 inline-flex items-center gap-2 text-xs font-semibold text-[#1DB9B3] hover:underline"
                              >
                                View preview
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  )
}

