'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Book, Plus, X, Sparkles } from 'lucide-react'

interface UserImage {
  id: string
  name: string
  original_url: string
  coloring_page_url?: string
  status: 'processing' | 'completed' | 'error'
  created_at: string
  selected?: boolean
}

interface PhotobookCreatorProps {
  images: UserImage[]
  onClose: () => void
}

export function PhotobookCreator({ images, onClose }: PhotobookCreatorProps) {
  const [selectedImages, setSelectedImages] = useState<UserImage[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [photobookTitle, setPhotobookTitle] = useState('My Coloring Book')
  const { user } = useAuth()

  const availableImages = images.filter(img => img.status === 'completed' && img.coloring_page_url && img.coloring_page_url.trim() !== '')

  const toggleImageSelection = (image: UserImage) => {
    setSelectedImages(prev => {
      const isSelected = prev.some(img => img.id === image.id)
      if (isSelected) {
        return prev.filter(img => img.id !== image.id)
      }

      const maxPages = 20
      if (prev.length >= maxPages) {
        alert(`Maximum ${maxPages} pages allowed for your plan`)
        return prev
      }

      return [...prev, image]
    })
  }

  const generatePhotobook = async () => {
    if (selectedImages.length === 0) {
      alert('Please select at least one coloring page')
      return
    }

    setIsGenerating(true)

    try {
      const response = await fetch('/api/generate-photobook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          images: selectedImages.map(img => ({
            id: img.id,
            name: img.name,
            coloring_page_url: img.coloring_page_url
          })),
          title: photobookTitle,
          userId: user?.id
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate photobook')
      }

      const result = await response.json()
      const link = document.createElement('a')
      link.href = result.downloadUrl
      link.download = `${photobookTitle}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      onClose()
    } catch (error) {
      console.error('❌ Error generating photobook:', error)
      alert('Failed to generate photobook. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#3A2E39]/40 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-5xl">
        <div className="pointer-events-none absolute -inset-6 rounded-[3.5rem] bg-gradient-to-br from-[#A0E7E5]/40 via-[#FFB3BA]/40 to-[#FFD166]/40 blur-2xl" aria-hidden="true" />
        <div className="relative flex max-h-[90vh] w-full flex-col overflow-hidden rounded-[2.75rem] border-4 border-[#A0E7E5] bg-[#FFF5D6]/95 shadow-[20px_20px_0_0_#55C6C0]">
          <div className="flex items-start justify-between gap-4 border-b-4 border-dashed border-[#A0E7E5] px-8 py-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#A0E7E5] text-white shadow-inner">
                <Book className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#1DB9B3]">Photobook studio</p>
                <h2 className="text-3xl font-extrabold text-[#3A2E39]">Create a printable book</h2>
                <p className="text-sm font-medium text-[#594144]">Sequence your favorite pages, name your book, and download a ready-to-print PDF.</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-full border-2 border-[#A0E7E5] bg-white px-3 py-2 text-[#1DB9B3] shadow-[4px_4px_0_0_#55C6C0] transition-transform hover:-translate-y-0.5"
              aria-label="Close photobook modal"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-6 border-b-4 border-dashed border-[#FFB3BA] bg-[#FFE6EB]/70 px-8 py-6">
            <div className="rounded-[2rem] border-4 border-dashed border-[#FFB3BA] bg-white/80 p-6">
              <label className="text-sm font-semibold uppercase tracking-widest text-[#FF6F91]">Photobook title</label>
              <input
                type="text"
                value={photobookTitle}
                onChange={(e) => setPhotobookTitle(e.target.value)}
                className="mt-3 w-full rounded-2xl border-2 border-[#FFB3BA] bg-white/80 px-4 py-3 text-[#3A2E39] focus:border-[#FF6F91] focus:outline-none"
                placeholder="Enter photobook title..."
              />
              <p className="mt-2 text-xs font-semibold uppercase tracking-widest text-[#FF6F91]">Up to 20 pages per book</p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border-2 border-dashed border-[#A0E7E5] bg-[#E0F7FA] px-4 py-2 text-xs font-semibold uppercase tracking-widest text-[#1DB9B3]">
              <Sparkles className="h-3 w-3" />
              Choose finished pages to add to your story
            </div>
          </div>

          <div className="flex flex-1 flex-col gap-6 overflow-hidden px-8 py-6 lg:flex-row">
            <div className="flex-1 space-y-4 rounded-[2rem] border-4 border-[#FFB3BA] bg-[#FFE6EB]/80 p-5">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-extrabold text-[#3A2E39]">Available Pages ({availableImages.length})</h3>
                <span className="rounded-full border-2 border-[#FFB3BA] bg-white px-3 py-1 text-xs font-semibold text-[#FF6F91]">
                  {selectedImages.length} selected
                </span>
              </div>
              <div className="grid max-h-96 grid-cols-2 gap-4 overflow-y-auto pr-1">
                {availableImages.length === 0 ? (
                  <div className="col-span-2 rounded-[1.5rem] border-4 border-dashed border-[#FFB3BA] bg-white/70 p-8 text-center text-sm font-semibold text-[#FF6F91]">
                    Generate a coloring page to add it to your photobook.
                  </div>
                ) : (
                  availableImages.map((image) => {
                    const isSelected = selectedImages.some(img => img.id === image.id)
                    return (
                      <button
                        key={image.id}
                        type="button"
                        onClick={() => toggleImageSelection(image)}
                        className={`group relative overflow-hidden rounded-[1.5rem] border-4 border-dashed px-2 pb-3 pt-2 transition-transform hover:-translate-y-0.5 ${
                          isSelected
                            ? 'border-[#55C6C0] bg-[#E0F7FA] shadow-[8px_8px_0_0_#55C6C0]/60'
                            : 'border-[#FFB3BA] bg-white/80 shadow-[6px_6px_0_0_#FFB3BA]/40'
                        }`}
                      >
                        <div className="relative overflow-hidden rounded-[1.1rem] border-2 border-white/70">
                          <img
                            src={image.coloring_page_url}
                            alt={image.name}
                            className="h-28 w-full object-cover"
                            onError={(e) => {
                              console.error('🖼️ Failed to load image:', image.name, image.coloring_page_url)
                              e.currentTarget.src = image.original_url
                            }}
                          />
                          <div className="absolute inset-0 flex items-center justify-center rounded-[1.1rem] bg-[#55C6C0]/0 transition group-hover:bg-[#55C6C0]/10">
                            <div className={`flex h-8 w-8 items-center justify-center rounded-full border-2 ${isSelected ? 'border-white bg-[#55C6C0] text-white' : 'border-[#55C6C0] bg-white text-[#55C6C0]' }`}>
                              <Plus className={`h-4 w-4 ${isSelected ? 'rotate-45' : ''}`} />
                            </div>
                          </div>
                        </div>
                        <p className="mt-2 truncate text-xs font-semibold text-[#3A2E39]">{image.name}</p>
                      </button>
                    )
                  })
                )}
              </div>
            </div>

            <div className="flex-1 space-y-4 rounded-[2rem] border-4 border-[#A0E7E5] bg-[#E0F7FA]/80 p-5">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-extrabold text-[#3A2E39]">Photobook Order ({selectedImages.length})</h3>
                {selectedImages.length > 0 && (
                  <span className="rounded-full border-2 border-[#A0E7E5] bg-white px-3 py-1 text-xs font-semibold text-[#1DB9B3]">
                    Drag to reorder (coming soon)
                  </span>
                )}
              </div>
              {selectedImages.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center rounded-[1.5rem] border-4 border-dashed border-[#A0E7E5] bg-white/70 p-8 text-center text-sm font-semibold text-[#1DB9B3]">
                  <Book className="mb-3 h-10 w-10 text-[#55C6C0]" />
                  Pick some pages to start assembling your photobook.
                </div>
              ) : (
                <div className="space-y-3 overflow-y-auto pr-1">
                  {selectedImages.map((image, index) => (
                    <div key={image.id} className="flex items-center gap-3 rounded-full border-2 border-[#A0E7E5] bg-white px-4 py-2 shadow-[4px_4px_0_0_#A0E7E5]/30">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#55C6C0] bg-[#E0F7FA] text-xs font-bold text-[#1DB9B3]">
                        {index + 1}
                      </span>
                      <img src={image.coloring_page_url} alt={image.name} className="h-12 w-12 rounded-full border-2 border-[#55C6C0] object-cover" />
                      <p className="flex-1 truncate text-sm font-semibold text-[#3A2E39]">{image.name}</p>
                      <button
                        onClick={() => toggleImageSelection(image)}
                        className="rounded-full border-2 border-[#FFB3BA] bg-[#FFE6EB] px-2 py-1 text-xs font-semibold text-[#FF6F91] shadow-[3px_3px_0_0_#FF8A80] transition-transform hover:-translate-y-0.5"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-4 border-t-4 border-dashed border-[#FFB3BA] bg-white/80 px-8 py-6 md:flex-row md:items-center md:justify-between">
            <div className="text-sm font-semibold text-[#594144]">
              {selectedImages.length > 0 ? `${selectedImages.length} pages selected` : 'Pick at least one page to continue'}
            </div>
            <div className="flex flex-col gap-3 md:flex-row">
              <button
                onClick={onClose}
                className="rounded-full border-4 border-[#FFB3BA] bg-white px-6 py-3 text-sm font-semibold text-[#FF6F91] shadow-[6px_6px_0_0_#FF8A80] transition-transform hover:-translate-y-0.5"
              >
                Cancel
              </button>
              <button
                onClick={generatePhotobook}
                disabled={selectedImages.length === 0 || isGenerating}
                className="rounded-full border-4 border-[#A0E7E5] bg-[#55C6C0] px-8 py-3 text-sm font-semibold text-white shadow-[8px_8px_0_0_#1DB9B3] transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none"
              >
                {isGenerating ? 'Generating...' : 'Generate PDF'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
