'use client'

import { useState } from 'react'
import { X, RefreshCw, Loader2, ThumbsUp, ThumbsDown, Sparkles } from 'lucide-react'

interface RegenerateModalProps {
  isOpen: boolean
  onClose: () => void
  imageId: string
  imageName: string
  currentColoringPageUrl: string
  onRegenerateComplete: (regeneratedUrl: string) => void
}

export function RegenerateModal({
  isOpen,
  onClose,
  imageId,
  imageName,
  currentColoringPageUrl,
  onRegenerateComplete
}: RegenerateModalProps) {
  const [feedback, setFeedback] = useState('')
  const [isRegenerating, setIsRegenerating] = useState(false)
  const [regeneratedUrl, setRegeneratedUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [selectedVersion, setSelectedVersion] = useState<'original' | 'regenerated' | null>(null)

  const handleRegenerate = async () => {
    setIsRegenerating(true)
    setError(null)

    try {
      const response = await fetch('/api/regenerate-coloring-page', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageId,
          feedback: feedback.trim(),
          userId: 'current-user-id'
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to regenerate coloring page')
      }

      const result = await response.json()
      setRegeneratedUrl(result.regeneratedColoringPageUrl)
    } catch (err) {
      console.error('❌ Error regenerating coloring page:', err)
      setError(err instanceof Error ? err.message : 'Failed to regenerate coloring page')
    } finally {
      setIsRegenerating(false)
    }
  }

  const handleVersionSelection = (version: 'original' | 'regenerated') => {
    if (version === 'regenerated' && regeneratedUrl) {
      onRegenerateComplete(regeneratedUrl)
    }
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#3A2E39]/50 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-5xl">
        <div className="pointer-events-none absolute -inset-6 rounded-[3.5rem] bg-gradient-to-br from-[#FFB3BA]/40 via-[#FFD166]/40 to-[#A0E7E5]/40 blur-2xl" aria-hidden="true" />
        <div className="relative flex max-h-[90vh] w-full flex-col overflow-hidden rounded-[2.75rem] border-4 border-[#FFB3BA] bg-[#FFF5D6]/95 shadow-[20px_20px_0_0_#FF8A80]">
          <div className="flex items-start justify-between gap-4 border-b-4 border-dashed border-[#FFD166] px-8 py-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#FF6F91] text-white shadow-inner">
                <RefreshCw className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#FF6F91]">One-time makeover</p>
                <h2 className="text-3xl font-extrabold text-[#3A2E39]">Regenerate coloring page</h2>
                <p className="text-sm font-medium text-[#594144]">Tweak the vibe of <span className="font-semibold text-[#FF6F91]">&quot;{imageName}&quot;</span> and choose the version you love most.</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-full border-2 border-[#FFB3BA] bg-white px-3 py-2 text-[#FF6F91] shadow-[4px_4px_0_0_#FF8A80] transition-transform hover:-translate-y-0.5"
              aria-label="Close regenerate modal"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-8 py-6">
            {!regeneratedUrl ? (
              <div className="space-y-6">
                <div className="rounded-[2rem] border-4 border-dashed border-[#A0E7E5] bg-[#E0F7FA]/80 p-6">
                  <h3 className="text-lg font-extrabold text-[#3A2E39]">Current coloring page</h3>
                  <p className="mt-2 text-sm font-medium text-[#1DB9B3]">You can request tweaks once per image.</p>
                  <div className="mt-4 overflow-hidden rounded-[1.5rem] border-4 border-[#A0E7E5] bg-white/80 p-3">
                    <img src={currentColoringPageUrl} alt="Current coloring page" className="w-full rounded-[1rem] object-contain" />
                  </div>
                </div>

                <div className="rounded-[2rem] border-4 border-dashed border-[#FFD166] bg-[#FFF3BF]/80 p-6">
                  <label className="flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-[#AA6A00]">
                    <Sparkles className="h-4 w-4" />
                    What would you like to change? (Optional)
                  </label>
                  <textarea
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    className="mt-3 w-full rounded-2xl border-2 border-[#FFD166] bg-white/80 px-4 py-3 text-[#3A2E39] focus:border-[#FF6F91] focus:outline-none"
                    placeholder="e.g., 'Make it simpler', 'Thicker lines', 'More cartoon vibes'"
                    rows={4}
                    disabled={isRegenerating}
                  />
                  <p className="mt-2 text-xs font-semibold uppercase tracking-widest text-[#AA6A00]">
                    Tip: mention line weight, detail level, or mood so our crayons know what to adjust.
                  </p>
                </div>

                {error && (
                  <div className="rounded-[1.5rem] border-4 border-[#FFB3BA] bg-[#FFE6EB] p-4 text-sm font-semibold text-[#FF6F91]">
                    {error}
                  </div>
                )}

                <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                  <button
                    onClick={onClose}
                    className="rounded-full border-4 border-[#FFB3BA] bg-white px-6 py-3 text-sm font-semibold text-[#FF6F91] shadow-[6px_6px_0_0_#FF8A80] transition-transform hover:-translate-y-0.5"
                    disabled={isRegenerating}
                  >
                    Keep original
                  </button>
                  <button
                    onClick={handleRegenerate}
                    disabled={isRegenerating}
                    className="rounded-full border-4 border-[#FFB3BA] bg-[#FF6F91] px-8 py-3 text-sm font-semibold text-white shadow-[8px_8px_0_0_#f2557b] transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none"
                  >
                    {isRegenerating ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Regenerating...
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        <RefreshCw className="h-4 w-4" />
                        Regenerate magic
                      </span>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="rounded-[2rem] border-4 border-[#A0E7E5] bg-[#E0F7FA]/80 p-6">
                  <h3 className="text-lg font-extrabold text-[#3A2E39]">Compare & pick your favorite</h3>
                  <p className="mt-2 text-sm font-medium text-[#1DB9B3]">Tap a card below to lock in your preferred version.</p>
                  <div className="mt-6 grid gap-6 md:grid-cols-2">
                    <button
                      className={`group flex flex-col gap-4 rounded-[1.75rem] border-4 px-4 py-4 text-left transition-transform hover:-translate-y-0.5 ${
                        selectedVersion === 'original'
                          ? 'border-[#FF6F91] bg-white shadow-[10px_10px_0_0_#FF8A80]'
                          : 'border-dashed border-[#A0E7E5] bg-white/80 shadow-[8px_8px_0_0_#A0E7E5]/40'
                      }`}
                      onClick={() => setSelectedVersion('original')}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-[#FF6F91]">
                          <ThumbsDown className="h-4 w-4" />
                          Original version
                        </div>
                        {selectedVersion === 'original' && <ThumbsUp className="h-5 w-5 text-[#FF6F91]" />}
                      </div>
                      <div className="overflow-hidden rounded-[1.25rem] border-4 border-[#FFB3BA] bg-white/80 p-3">
                        <img src={currentColoringPageUrl} alt="Original coloring page" className="w-full rounded-[1rem] object-contain" />
                      </div>
                      <p className="text-xs font-semibold uppercase tracking-widest text-[#FF6F91]">Keep what you already have</p>
                    </button>

                    <button
                      className={`group flex flex-col gap-4 rounded-[1.75rem] border-4 px-4 py-4 text-left transition-transform hover:-translate-y-0.5 ${
                        selectedVersion === 'regenerated'
                          ? 'border-[#55C6C0] bg-white shadow-[10px_10px_0_0_#55C6C0]'
                          : 'border-dashed border-[#55C6C0] bg-white/80 shadow-[8px_8px_0_0_#55C6C0]/40'
                      }`}
                      onClick={() => setSelectedVersion('regenerated')}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-[#1DB9B3]">
                          <Sparkles className="h-4 w-4" />
                          Regenerated version
                        </div>
                        {selectedVersion === 'regenerated' && <ThumbsUp className="h-5 w-5 text-[#55C6C0]" />}
                      </div>
                      <div className="overflow-hidden rounded-[1.25rem] border-4 border-[#A0E7E5] bg-white/80 p-3">
                        <img src={regeneratedUrl} alt="Regenerated coloring page" className="w-full rounded-[1rem] object-contain" />
                      </div>
                      <p className="text-xs font-semibold uppercase tracking-widest text-[#1DB9B3]">Fresh lines, same memory</p>
                    </button>
                  </div>
                </div>

                {feedback && (
                  <div className="rounded-[1.5rem] border-4 border-dashed border-[#FFD166] bg-[#FFF3BF]/80 p-4 text-sm font-semibold text-[#AA6A00]">
                    <span className="uppercase tracking-widest">Your request:</span> &quot;{feedback}&quot;
                  </div>
                )}

                <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                  <button
                    onClick={() => handleVersionSelection('original')}
                    className="rounded-full border-4 border-[#FFB3BA] bg-white px-6 py-3 text-sm font-semibold text-[#FF6F91] shadow-[6px_6px_0_0_#FF8A80] transition-transform hover:-translate-y-0.5"
                  >
                    Use original
                  </button>
                  <button
                    onClick={() => handleVersionSelection('regenerated')}
                    className="rounded-full border-4 border-[#A0E7E5] bg-[#55C6C0] px-8 py-3 text-sm font-semibold text-white shadow-[8px_8px_0_0_#1DB9B3] transition-transform hover:-translate-y-0.5"
                  >
                    Use regenerated
                  </button>
                </div>

                <p className="text-center text-xs font-semibold uppercase tracking-widest text-[#AA6A00]">
                  This choice is final. Each image can be regenerated once.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
