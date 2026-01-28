'use client'

import { useRef, useState } from 'react'
import { X, Sparkles, Loader2, Download, Image as ImageIcon } from 'lucide-react'
import type { PromptRemixJob } from '@/types/prompt-remix'

interface PromptRemixModalProps {
  isOpen: boolean
  onClose: () => void
  imageName: string
  imageUrl: string
}

interface RemixResult {
  id: string
  title: string
  prompt: string
  coloringPageUrl: string
}

const presetRemixes = [
  {
    id: 'beach-day',
    title: 'Sunny Beach Day',
    description: 'Add palm trees, umbrellas, and a sparkling shoreline for a seaside adventure.',
    prompt:
      'Place the family on a bright tropical beach with soft sand, palm trees, seashells, and a gentle ocean behind them. Include playful beach accessories like buckets, umbrellas, and a beach ball.',
  },
  {
    id: 'theme-park',
    title: 'Theme Park Magic',
    description: 'Create a whimsical amusement park backdrop with castles and rides.',
    prompt:
      'Reimagine the family visiting a whimsical theme park inspired by classic fantasy castles, roller coasters, and fireworks in the sky. Add cheerful banners and balloons.',
  },
  {
    id: 'campout',
    title: 'Cozy Campout',
    description: 'Surround the family with pine trees, tents, and twinkling stars.',
    prompt:
      'Move the family to a peaceful forest campsite with a tent, pine trees, a crackling campfire, and a sky full of stars. Add cozy camping details like mugs of cocoa and lanterns.',
  },
]

export function PromptRemixModal({ isOpen, onClose, imageName, imageUrl }: PromptRemixModalProps) {
  const [customPrompt, setCustomPrompt] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [activePromptId, setActivePromptId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [results, setResults] = useState<RemixResult[]>([])
  const [activeJob, setActiveJob] = useState<PromptRemixJob | null>(null)
  const promptTitleMapRef = useRef<Record<string, string>>({})

  if (!isOpen) return null

  const mergeCompletedResults = (job: PromptRemixJob) => {
    const completed = job.results?.filter(result => result.status === 'succeeded' && result.url)

    if (!completed?.length) {
      return
    }

    setResults(prev => {
      const existingUrls = new Set(prev.map(item => item.coloringPageUrl))

      const newEntries = completed
        .filter(result => result.url && !existingUrls.has(result.url))
        .map(result => ({
          id: `${job.id}-${result.prompt}-${result.completed_at ?? Date.now()}`,
          title: promptTitleMapRef.current[result.prompt] ?? 'Prompt Remix',
          prompt: result.prompt,
          coloringPageUrl: result.url as string,
        }))

      if (newEntries.length === 0) {
        return prev
      }

      return [...newEntries, ...prev]
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
      mergeCompletedResults(job)

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

  const handleGenerate = async (prompt: string, title: string, id: string) => {
    setIsGenerating(true)
    setActivePromptId(id)
    setError(null)
    promptTitleMapRef.current[prompt] = title

    try {
      const response = await fetch('/api/prompt-remix', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageUrl,
          remixPrompt: prompt,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        throw new Error(errorData?.error || 'Failed to generate remix')
      }

      const data = await response.json()
      const job = data.job as PromptRemixJob | undefined

      if (!job) {
        throw new Error('Failed to enqueue prompt remix job.')
      }

      const finalJob = await pollJobUntilFinished(job.id)

      if (finalJob.status === 'failed') {
        setError(finalJob.error_message || 'Prompt remix did not finish successfully.')
      } else {
        setError(null)
      }
    } catch (err) {
      console.error('Prompt remix failed:', err)
      setError(err instanceof Error ? err.message : 'Something went wrong while remixing the prompt.')
    } finally {
      setIsGenerating(false)
      setActivePromptId(null)
      setActiveJob(null)
    }
  }

  const handleCustomSubmit = () => {
    if (!customPrompt.trim()) {
      setError('Please describe the new scene you want to create.')
      return
    }

    handleGenerate(customPrompt.trim(), 'Custom Remix', 'custom')
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-gray-200 px-8 py-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 text-purple-600">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Prompt Remix Playground</h2>
              <p className="text-sm text-gray-500">Transform {imageName} into new adventures.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid gap-8 px-8 py-6 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Reference Photo</h3>
              <div className="overflow-hidden rounded-2xl border border-gray-200 bg-gray-50">
                <img src={imageUrl} alt={imageName} className="w-full object-cover" />
              </div>
            </div>

            <div className="rounded-2xl border border-dashed border-purple-200 bg-purple-50/60 p-5">
              <h4 className="text-sm font-semibold text-purple-700 uppercase tracking-wide">How it works</h4>
              <p className="mt-2 text-sm text-purple-700">
                Choose a remix to send your photo on a new adventure. We keep the same family and details but change the scene and
                props for a brand new coloring page.
              </p>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Quick Remix Ideas</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                {presetRemixes.map(option => (
                  <button
                    key={option.id}
                    onClick={() => handleGenerate(option.prompt, option.title, option.id)}
                    disabled={isGenerating}
                    className={`rounded-2xl border p-4 text-left transition focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                      activePromptId === option.id
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 bg-white hover:border-purple-300 hover:bg-purple-50/70'
                    }`}
                  >
                    <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                      {isGenerating && activePromptId === option.id ? (
                        <Loader2 className="h-4 w-4 animate-spin text-purple-500" />
                      ) : (
                        <Sparkles className="h-4 w-4 text-purple-500" />
                      )}
                      {option.title}
                    </h4>
                    <p className="mt-2 text-sm text-gray-600">{option.description}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-5">
              <h3 className="text-lg font-semibold text-gray-800">Create your own remix</h3>
              <p className="mt-1 text-sm text-gray-500">
                Describe the new scene or style you want. Keep it playful—think seasons, holidays, hobbies, or dream destinations.
              </p>
              <textarea
                value={customPrompt}
                onChange={event => setCustomPrompt(event.target.value)}
                rows={3}
                className="mt-3 w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-200"
                placeholder="Example: Turn this into a winter wonderland with snowflakes, scarves, and sleds."
                disabled={isGenerating}
              />
              <button
                onClick={handleCustomSubmit}
                disabled={isGenerating}
                className="mt-3 inline-flex items-center gap-2 rounded-full bg-purple-600 px-5 py-2 text-sm font-semibold text-white shadow-lg transition hover:bg-purple-700 disabled:bg-purple-300"
              >
                {isGenerating && activePromptId === 'custom' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                Remix my prompt
              </button>
            </div>

            {error && (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
                {error}
              </div>
            )}

            <div className="space-y-4">
              {isGenerating && (
                <div className="flex flex-col gap-2 rounded-2xl border border-purple-200 bg-purple-50 px-4 py-3 text-purple-700">
                  <div className="flex items-center gap-3">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Brewing up fresh coloring page magic...</span>
                  </div>
                  {activeJob && (
                    <p className="text-xs text-purple-600">
                      {activeJob.results.filter(result => result.status === 'succeeded').length} of {activeJob.results.length} scenes ready
                    </p>
                  )}
                </div>
              )}

              {results.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-gray-800">Remix Gallery</h3>
                  {results.map(result => (
                    <div key={result.id} className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
                      <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-start">
                        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-purple-100 text-purple-600">
                          <ImageIcon className="h-6 w-6" />
                        </div>
                        <div className="flex-1 space-y-2">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                            <h4 className="font-semibold text-gray-900">{result.title}</h4>
                            <a
                              href={result.coloringPageUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-2 inline-flex items-center gap-2 rounded-full bg-purple-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-purple-700 sm:mt-0"
                            >
                              <Download className="h-4 w-4" />
                              Download
                            </a>
                          </div>
                          <p className="text-sm text-gray-500">{result.prompt}</p>
                          <div className="overflow-hidden rounded-xl border border-dashed border-gray-200 bg-gray-50">
                            <img src={result.coloringPageUrl} alt={`${result.title} coloring page`} className="w-full" />
                          </div>
                        </div>
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
  )
}
