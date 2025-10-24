'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Users, Download, Plus, X, Copy, Check, Sparkles } from 'lucide-react'

interface UserImage {
  id: string
  name: string
  original_url: string
  coloring_page_url?: string
  status: 'processing' | 'completed' | 'error'
  created_at: string
}

interface FamilyAlbumCreatorProps {
  images: UserImage[]
  onClose: () => void
}

interface CreatedAlbum {
  id: string
  title: string
  description: string
  shareCode: string
  shareUrl: string
}

export function FamilyAlbumCreator({ images, onClose }: FamilyAlbumCreatorProps) {
  const [selectedImages, setSelectedImages] = useState<UserImage[]>([])
  const [albumTitle, setAlbumTitle] = useState('')
  const [albumDescription, setAlbumDescription] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [createdAlbum, setCreatedAlbum] = useState<CreatedAlbum | null>(null)
  const [linkCopied, setLinkCopied] = useState(false)
  const { user } = useAuth()

  const availableImages = images.filter(img => img.status === 'completed' && img.coloring_page_url)

  const toggleImageSelection = (image: UserImage) => {
    setSelectedImages(prev => {
      const isSelected = prev.some(img => img.id === image.id)
      return isSelected ? prev.filter(img => img.id !== image.id) : [...prev, image]
    })
  }

  const createAlbum = async () => {
    if (!albumTitle.trim() || selectedImages.length === 0) {
      alert('Please provide a title and select at least one coloring page')
      return
    }

    setIsCreating(true)

    try {
      const response = await fetch('/api/family-albums', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: albumTitle.trim(),
          description: albumDescription.trim(),
          imageIds: selectedImages.map(img => img.id),
          userId: user?.id
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create family album')
      }

      const result = await response.json()
      setCreatedAlbum(result.album)
    } catch (error) {
      console.error('❌ Error creating family album:', error)
      alert('Failed to create family album. Please try again.')
    } finally {
      setIsCreating(false)
    }
  }

  const copyShareLink = async () => {
    if (!createdAlbum) return

    try {
      await navigator.clipboard.writeText(createdAlbum.shareUrl)
      setLinkCopied(true)
      setTimeout(() => setLinkCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy link:', error)
    }
  }

  const downloadPDF = () => {
    if (!createdAlbum) return

    const downloadUrl = `/api/family-albums/${createdAlbum.shareCode}?download=true`
    const link = document.createElement('a')
    link.href = downloadUrl
    link.download = `${albumTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_coloring_book.pdf`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (createdAlbum) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#3A2E39]/40 backdrop-blur-sm p-4">
        <div className="relative w-full max-w-3xl">
          <div className="pointer-events-none absolute -inset-6 rounded-[3rem] bg-gradient-to-br from-[#A0E7E5]/40 via-[#FFB3BA]/40 to-[#FFD166]/40 blur-2xl" aria-hidden="true" />
          <div className="relative overflow-hidden rounded-[2.75rem] border-4 border-[#A0E7E5] bg-[#FFF5D6]/95 p-8 shadow-[18px_18px_0_0_#55C6C0]">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#FFB3BA] text-white shadow-inner">
                  <Users className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#FF6F91]">Family album ready</p>
                  <h2 className="text-3xl font-extrabold text-[#3A2E39]">Album created!</h2>
                </div>
              </div>
              <button
                onClick={onClose}
                className="rounded-full border-2 border-[#FFB3BA] bg-white px-3 py-2 text-[#FF6F91] shadow-[4px_4px_0_0_#FF8A80] transition-transform hover:-translate-y-0.5"
                aria-label="Close family album modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-6 space-y-6">
              <div className="relative overflow-hidden rounded-[2rem] border-4 border-dashed border-[#FFB3BA] bg-[#FFE6EB]/80 p-6 text-center">
                <div className="pointer-events-none absolute -top-8 right-10 h-16 w-16 rounded-full bg-[#FFD166]/40" aria-hidden="true" />
                <h3 className="text-2xl font-extrabold text-[#3A2E39]">{createdAlbum.title}</h3>
                {createdAlbum.description && (
                  <p className="mt-2 text-base font-medium text-[#594144]">{createdAlbum.description}</p>
                )}
                <p className="mt-3 text-sm font-semibold text-[#FF6F91]">{selectedImages.length} coloring pages included</p>
              </div>

              <div className="space-y-4 rounded-[2rem] border-4 border-[#FFD166] bg-[#FFF3BF]/80 p-6">
                <label className="text-sm font-semibold uppercase tracking-widest text-[#AA6A00]">Share this link with family & friends</label>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <input
                    type="text"
                    value={createdAlbum.shareUrl}
                    readOnly
                    className="flex-1 rounded-full border-2 border-dashed border-[#FFD166] bg-white/80 px-4 py-3 text-sm font-semibold text-[#3A2E39]"
                  />
                  <button
                    onClick={copyShareLink}
                    className="inline-flex items-center justify-center gap-2 rounded-full border-4 border-[#FFB3BA] bg-[#FF6F91] px-6 py-3 text-sm font-semibold text-white shadow-[6px_6px_0_0_#f2557b] transition-transform hover:-translate-y-0.5"
                  >
                    {linkCopied ? (
                      <>
                        <Check className="h-4 w-4" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" />
                        Copy link
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  onClick={downloadPDF}
                  className="flex-1 rounded-full border-4 border-[#A0E7E5] bg-[#55C6C0] px-6 py-3 text-sm font-semibold text-white shadow-[8px_8px_0_0_#1DB9B3] transition-transform hover:-translate-y-0.5"
                >
                  <div className="flex items-center justify-center gap-2">
                    <Download className="h-4 w-4" />
                    Download PDF
                  </div>
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 rounded-full border-4 border-[#FFB3BA] bg-white px-6 py-3 text-sm font-semibold text-[#FF6F91] shadow-[8px_8px_0_0_#FF8A80] transition-transform hover:-translate-y-0.5"
                >
                  Done
                </button>
              </div>

              <p className="text-center text-xs font-semibold uppercase tracking-widest text-[#AA6A00]">
                Anyone with this link can view and download the coloring book PDF
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#3A2E39]/40 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-5xl">
        <div className="pointer-events-none absolute -inset-6 rounded-[3.5rem] bg-gradient-to-br from-[#FFB3BA]/40 via-[#FFD166]/40 to-[#A0E7E5]/40 blur-2xl" aria-hidden="true" />
        <div className="relative flex max-h-[90vh] w-full flex-col overflow-hidden rounded-[2.75rem] border-4 border-[#A0E7E5] bg-[#FFF5D6]/95 shadow-[20px_20px_0_0_#55C6C0]">
          <div className="flex items-start justify-between gap-4 border-b-4 border-dashed border-[#FFB3BA] px-8 py-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#FFB3BA] text-white shadow-inner">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#FF6F91]">Family album builder</p>
                <h2 className="text-3xl font-extrabold text-[#3A2E39]">Bundle pages to share</h2>
                <p className="text-sm font-medium text-[#594144]">Select your favorite coloring pages, give them a title, and we’ll package a shareable album.</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-full border-2 border-[#FFB3BA] bg-white px-3 py-2 text-[#FF6F91] shadow-[4px_4px_0_0_#FF8A80] transition-transform hover:-translate-y-0.5"
              aria-label="Close family album modal"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-6 border-b-4 border-dashed border-[#FFD166] bg-[#FFF9E6]/80 px-8 py-6">
            <div className="rounded-[2rem] border-4 border-dashed border-[#FFD166] bg-white/80 p-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-semibold uppercase tracking-widest text-[#AA6A00]">Album title *</label>
                  <input
                    type="text"
                    value={albumTitle}
                    onChange={(e) => setAlbumTitle(e.target.value)}
                    className="mt-2 w-full rounded-2xl border-2 border-[#FFD166] bg-white/80 px-4 py-3 text-[#3A2E39] focus:border-[#FF6F91] focus:outline-none"
                    placeholder="e.g., Cousins Coloring Club"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold uppercase tracking-widest text-[#AA6A00]">Description (optional)</label>
                  <textarea
                    value={albumDescription}
                    onChange={(e) => setAlbumDescription(e.target.value)}
                    className="mt-2 w-full rounded-2xl border-2 border-[#FFD166] bg-white/80 px-4 py-3 text-[#3A2E39] focus:border-[#FF6F91] focus:outline-none"
                    placeholder="Add a playful description for your family album..."
                    rows={2}
                  />
                </div>
              </div>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border-2 border-dashed border-[#FFB3BA] bg-[#FFE6EB] px-4 py-2 text-xs font-semibold uppercase tracking-widest text-[#FF6F91]">
              <Sparkles className="h-3 w-3" />
              Pick completed pages to include
            </div>
          </div>

          <div className="flex flex-1 flex-col gap-6 overflow-hidden px-8 py-6 lg:flex-row">
            <div className="flex-1 space-y-4 rounded-[2rem] border-4 border-[#FFB3BA] bg-[#FFE6EB]/80 p-5">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-extrabold text-[#3A2E39]">Available Coloring Pages ({availableImages.length})</h3>
                <span className="rounded-full border-2 border-[#FFB3BA] bg-white px-3 py-1 text-xs font-semibold text-[#FF6F91]">
                  {selectedImages.length} selected
                </span>
              </div>
              <div className="grid max-h-96 grid-cols-2 gap-4 overflow-y-auto pr-1">
                {availableImages.length === 0 ? (
                  <div className="col-span-2 rounded-[1.5rem] border-4 border-dashed border-[#FFB3BA] bg-white/70 p-8 text-center text-sm font-semibold text-[#FF6F91]">
                    Finish generating a coloring page to add it here.
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
                            ? 'border-[#FF6F91] bg-[#FFE6EB] shadow-[8px_8px_0_0_#FF8A80]'
                            : 'border-[#A0E7E5] bg-white/80 shadow-[6px_6px_0_0_#A0E7E5]/40'
                        }`}
                      >
                        <div className="relative overflow-hidden rounded-[1.1rem] border-2 border-white/70">
                          <img
                            src={image.coloring_page_url}
                            alt={image.name}
                            className="h-28 w-full object-cover"
                          />
                          <div className="absolute inset-0 flex items-center justify-center rounded-[1.1rem] bg-[#FF6F91]/0 transition group-hover:bg-[#FF6F91]/10">
                            <div className={`flex h-8 w-8 items-center justify-center rounded-full border-2 ${isSelected ? 'border-white bg-[#FF6F91] text-white' : 'border-[#FF6F91] bg-white text-[#FF6F91]' }`}>
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
                <h3 className="text-lg font-extrabold text-[#3A2E39]">Selected Pages ({selectedImages.length})</h3>
                {selectedImages.length > 0 && (
                  <span className="rounded-full border-2 border-[#A0E7E5] bg-white px-3 py-1 text-xs font-semibold text-[#1DB9B3]">
                    Ready to bundle
                  </span>
                )}
              </div>
              {selectedImages.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center rounded-[1.5rem] border-4 border-dashed border-[#A0E7E5] bg-white/70 p-8 text-center text-sm font-semibold text-[#1DB9B3]">
                  <Users className="mb-3 h-10 w-10 text-[#55C6C0]" />
                  Pick some completed pages to build your album.
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
                onClick={createAlbum}
                disabled={!albumTitle.trim() || selectedImages.length === 0 || isCreating}
                className="rounded-full border-4 border-[#55C6C0] bg-[#55C6C0] px-8 py-3 text-sm font-semibold text-white shadow-[8px_8px_0_0_#1DB9B3] transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none"
              >
                {isCreating ? 'Creating...' : 'Create album'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
