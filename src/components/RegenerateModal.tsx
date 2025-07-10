'use client'

import { useState } from 'react'
import { X, RefreshCw, Loader2, ThumbsUp, ThumbsDown } from 'lucide-react'

interface RegenerateModalProps {
  isOpen: boolean
  onClose: () => void
  imageId: string
  imageName: string
  originalUrl: string
  currentColoringPageUrl: string
  onRegenerateComplete: (regeneratedUrl: string) => void
}

export function RegenerateModal({
  isOpen,
  onClose,
  imageId,
  imageName,
  originalUrl,
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
    
    console.log('🔄 Regenerating coloring page with feedback:', feedback)

    try {
      const response = await fetch('/api/regenerate-coloring-page', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageId,
          feedback: feedback.trim(),
          userId: 'current-user-id' // This should come from auth context
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to regenerate coloring page')
      }

      const result = await response.json()
      setRegeneratedUrl(result.regeneratedColoringPageUrl)
      console.log('✅ Regeneration completed successfully')
      
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
    // If original is selected, we don't need to do anything
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <RefreshCw className="w-6 h-6 text-orange-600" />
            <h2 className="text-2xl font-bold text-gray-800">Regenerate Coloring Page</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 p-2"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">"{imageName}"</h3>
            <p className="text-gray-600 text-sm">
              You can regenerate this coloring page once. Tell us what you'd like to change, and we'll create a new version for you to compare.
            </p>
          </div>

          {!regeneratedUrl ? (
            <>
              {/* Current Version */}
              <div className="mb-6">
                <h4 className="font-medium text-gray-700 mb-3">Current Coloring Page:</h4>
                <div className="bg-gray-50 rounded-xl p-4 max-w-sm">
                  <img
                    src={currentColoringPageUrl}
                    alt="Current coloring page"
                    className="w-full rounded-lg"
                  />
                </div>
              </div>

              {/* Feedback Form */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  What would you like to change? (Optional)
                </label>
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                  placeholder="e.g., 'Too complex, make it simpler' or 'Lines are too thin' or 'Add more details'"
                  rows={3}
                  disabled={isRegenerating}
                />
                <p className="text-xs text-gray-500 mt-2">
                  Common requests: simpler/more complex, thicker/thinner lines, more/fewer details, more cartoon-like, more realistic
                </p>
              </div>

              {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end space-x-3">
                <button
                  onClick={onClose}
                  className="px-6 py-2 text-gray-600 hover:text-gray-800 font-medium"
                  disabled={isRegenerating}
                >
                  Cancel
                </button>
                <button
                  onClick={handleRegenerate}
                  disabled={isRegenerating}
                  className="bg-orange-600 hover:bg-orange-700 disabled:bg-gray-300 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
                >
                  {isRegenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Regenerating...</span>
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4" />
                      <span>Regenerate</span>
                    </>
                  )}
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Version Comparison */}
              <div className="mb-6">
                <h4 className="font-medium text-gray-700 mb-4">Choose your preferred version:</h4>
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Original Version */}
                  <div className={`bg-gray-50 rounded-xl p-4 cursor-pointer transition-all ${
                    selectedVersion === 'original' ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:bg-gray-100'
                  }`} onClick={() => setSelectedVersion('original')}>
                    <div className="flex items-center justify-between mb-3">
                      <h5 className="font-medium text-gray-800">Original Version</h5>
                      {selectedVersion === 'original' && (
                        <ThumbsUp className="w-5 h-5 text-blue-600" />
                      )}
                    </div>
                    <img
                      src={currentColoringPageUrl}
                      alt="Original coloring page"
                      className="w-full rounded-lg"
                    />
                  </div>

                  {/* Regenerated Version */}
                  <div className={`bg-gray-50 rounded-xl p-4 cursor-pointer transition-all ${
                    selectedVersion === 'regenerated' ? 'ring-2 ring-green-500 bg-green-50' : 'hover:bg-gray-100'
                  }`} onClick={() => setSelectedVersion('regenerated')}>
                    <div className="flex items-center justify-between mb-3">
                      <h5 className="font-medium text-gray-800">Regenerated Version</h5>
                      {selectedVersion === 'regenerated' && (
                        <ThumbsUp className="w-5 h-5 text-green-600" />
                      )}
                    </div>
                    <img
                      src={regeneratedUrl}
                      alt="Regenerated coloring page"
                      className="w-full rounded-lg"
                    />
                  </div>
                </div>
              </div>

              {feedback && (
                <div className="mb-6 p-4 bg-orange-50 rounded-lg">
                  <p className="text-sm text-gray-700">
                    <strong>Your feedback:</strong> "{feedback}"
                  </p>
                </div>
              )}

              {/* Selection Buttons */}
              <div className="flex items-center justify-end space-x-3">
                <button
                  onClick={() => handleVersionSelection('original')}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
                >
                  <span>Use Original</span>
                </button>
                <button
                  onClick={() => handleVersionSelection('regenerated')}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
                >
                  <span>Use Regenerated</span>
                </button>
              </div>

              <p className="text-xs text-gray-500 mt-4 text-center">
                This choice is final. You can only regenerate each image once.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}