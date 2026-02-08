'use client'

import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import {
  Users,
  Download,
  Plus,
  X,
  Copy,
  Check,
  Sparkles,
  Image as ImageIcon,
  Clock,
  MessageCircle,
  Share2,
  ShieldCheck,
  FileLock2,
} from 'lucide-react'

interface UserImage {
  id: string
  name: string
  original_url: string
  coloring_page_url?: string
  status: 'processing' | 'completed' | 'error'
  created_at: string
  archived_at?: string | null
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
  coverImageId: string | null
  expiresAt: string | null
  commentsEnabled: boolean
  downloadsEnabled: boolean
}

type ExpirationOption = 'never' | '7days' | '30days' | 'custom'

type ResendStatus = 'idle' | 'success' | 'error'

const EXPIRATION_CHOICES: { id: ExpirationOption; label: string }[] = [
  { id: 'never', label: 'Never' },
  { id: '7days', label: '7 days' },
  { id: '30days', label: '30 days' },
  { id: 'custom', label: 'Pick a date' },
]

const getIsoFromChoice = (choice: ExpirationOption, custom: string): string | null | undefined => {
  if (choice === 'never') {
    return null
  }

  if (choice === 'custom') {
    if (!custom) {
      alert('Please select an expiration date')
      return undefined
    }

    const parsed = new Date(custom)
    if (Number.isNaN(parsed.getTime())) {
      alert('Please provide a valid expiration date')
      return undefined
    }

    return parsed.toISOString()
  }

  const days = choice === '7days' ? 7 : 30
  const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000)
  return expires.toISOString()
}

const formatExpirationSummary = (expiresAt: string | null) => {
  if (!expiresAt) {
    return 'No expiration — share link stays active'
  }

  const date = new Date(expiresAt)
  if (Number.isNaN(date.getTime())) {
    return 'Link expires soon'
  }

  return `Link expires on ${date.toLocaleDateString()}`
}

export function FamilyAlbumCreator({ images, onClose }: FamilyAlbumCreatorProps) {
  const [selectedImages, setSelectedImages] = useState<UserImage[]>([])
  const [albumTitle, setAlbumTitle] = useState('')
  const [albumDescription, setAlbumDescription] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [createdAlbum, setCreatedAlbum] = useState<CreatedAlbum | null>(null)
  const [linkCopied, setLinkCopied] = useState(false)
  const [coverImageId, setCoverImageId] = useState<string | null>(null)
  const [expirationOption, setExpirationOption] = useState<ExpirationOption>('never')
  const [customExpiration, setCustomExpiration] = useState('')
  const [commentsEnabled, setCommentsEnabled] = useState(true)
  const [downloadsEnabled, setDownloadsEnabled] = useState(true)
  const [resendStatus, setResendStatus] = useState<ResendStatus>('idle')
  const [updatingDownloads, setUpdatingDownloads] = useState(false)
  const { user } = useAuth()

  const availableImages = images.filter(
    img =>
      !img.archived_at &&
      img.status === 'completed' &&
      img.coloring_page_url
  )

  useEffect(() => {
    if (selectedImages.length === 0) {
      setCoverImageId(null)
      return
    }

    const isCoverStillSelected = selectedImages.some(image => image.id === coverImageId)
    if (!isCoverStillSelected) {
      setCoverImageId(selectedImages[0]?.id ?? null)
    }
  }, [selectedImages, coverImageId])

  const coverImagePreview = useMemo(() => {
    if (!coverImageId) return null
    return selectedImages.find(image => image.id === coverImageId) ?? null
  }, [coverImageId, selectedImages])

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

    const resolvedExpiration = getIsoFromChoice(expirationOption, customExpiration)
    if (resolvedExpiration === undefined) {
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
          userId: user?.id,
          coverImageId,
          expiresAt: resolvedExpiration,
          commentsEnabled,
          downloadsEnabled,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create family album')
      }

      const result = await response.json()
      setCreatedAlbum(result.album)
      setDownloadsEnabled(result.album.downloadsEnabled)
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

  const handleResendLink = async () => {
    if (!createdAlbum) return

    try {
      if (navigator.share) {
        await navigator.share({
          title: createdAlbum.title,
          text: 'Take another look at our family coloring album!',
          url: createdAlbum.shareUrl,
        })
        setResendStatus('success')
        setTimeout(() => setResendStatus('idle'), 2000)
        return
      }

      await copyShareLink()
      setResendStatus('success')
      setTimeout(() => setResendStatus('idle'), 2000)
    } catch (error) {
      console.error('Failed to resend link', error)
      setResendStatus('error')
      setTimeout(() => setResendStatus('idle'), 2500)
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

  const toggleDownloads = async () => {
    if (!createdAlbum || !user?.id) return

    setUpdatingDownloads(true)
    try {
      const response = await fetch(`/api/family-albums/${createdAlbum.shareCode}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          downloadsEnabled: !createdAlbum.downloadsEnabled,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update download settings')
      }

      const result = await response.json()
      setCreatedAlbum(prev =>
        prev
          ? {
              ...prev,
              downloadsEnabled: result.album.downloadsEnabled,
            }
          : prev
      )
      setDownloadsEnabled(result.album.downloadsEnabled)
    } catch (error) {
      console.error('Failed to toggle downloads', error)
      alert('Unable to update download preferences. Please try again.')
    } finally {
      setUpdatingDownloads(false)
    }
  }

  if (createdAlbum) {
    const coverSummary = coverImagePreview || selectedImages.find(image => image.id === createdAlbum.coverImageId) || null

    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-[#3A2E39]/40 backdrop-blur-sm p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="family-album-created-title"
      >
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
                  <h2 id="family-album-created-title" className="text-3xl font-extrabold text-[#3A2E39]">Album created!</h2>
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
                <p className="mt-2 flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-widest text-[#1DB9B3]">
                  <Clock className="h-4 w-4" />
                  {formatExpirationSummary(createdAlbum.expiresAt)}
                </p>
              </div>

              <div className="space-y-4 rounded-[2rem] border-4 border-[#FFD166] bg-[#FFF3BF]/80 p-6">
                {coverSummary && (
                  <div className="flex items-center gap-3 rounded-2xl border-2 border-dashed border-[#FFD166] bg-[#FFF3BF]/70 p-3">
                    <ImageIcon className="h-5 w-5 text-[#AA6A00]" />
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-widest text-[#AA6A00]">Cover art</p>
                      <p className="text-sm font-semibold text-[#3A2E39]">{coverSummary.name}</p>
                    </div>
                  </div>
                )}
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
                  <button
                    onClick={handleResendLink}
                    className="inline-flex items-center justify-center gap-2 rounded-full border-4 border-[#A0E7E5] bg-[#55C6C0] px-6 py-3 text-sm font-semibold text-white shadow-[6px_6px_0_0_#1DB9B3] transition-transform hover:-translate-y-0.5"
                  >
                    <Share2 className="h-4 w-4" />
                    {resendStatus === 'success' ? 'Link shared!' : resendStatus === 'error' ? 'Try again' : 'Resend link'}
                  </button>
                </div>
                <p className="text-xs font-medium text-[#594144]">
                  Child-safe comments are {createdAlbum.commentsEnabled ? 'enabled so kids can cheer each other on.' : 'disabled for this album.'}
                </p>
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
                {createdAlbum.downloadsEnabled
                  ? 'Anyone with this link can view the pages and download the PDF'
                  : 'Viewing is allowed, but PDF downloads are currently disabled'}
              </p>
              <button
                onClick={toggleDownloads}
                disabled={updatingDownloads}
                className="mx-auto inline-flex items-center gap-2 rounded-full border-2 border-dashed border-[#FFB3BA] bg-white px-5 py-2 text-xs font-semibold uppercase tracking-widest text-[#FF6F91] transition-transform hover:-translate-y-0.5 disabled:opacity-60"
              >
                <FileLock2 className="h-4 w-4" />
                {updatingDownloads
                  ? 'Saving...'
                  : createdAlbum.downloadsEnabled
                    ? 'Disable downloads'
                    : 'Enable downloads'}
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#3A2E39]/40 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="family-album-builder-title"
    >
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
                <h2 id="family-album-builder-title" className="text-3xl font-extrabold text-[#3A2E39]">Bundle pages to share</h2>
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
                    onChange={(event) => setAlbumTitle(event.target.value)}
                    className="mt-2 w-full rounded-2xl border-2 border-[#FFD166] bg-white/80 px-4 py-3 text-[#3A2E39] focus:border-[#FF6F91] focus:outline-none"
                    placeholder="e.g., Cousins Coloring Club"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold uppercase tracking-widest text-[#AA6A00]">Description (optional)</label>
                  <textarea
                    value={albumDescription}
                    onChange={(event) => setAlbumDescription(event.target.value)}
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
            <div className="grid gap-4 rounded-[2rem] border-4 border-dashed border-[#A0E7E5] bg-white/80 p-6 md:grid-cols-2">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <ImageIcon className="h-5 w-5 text-[#1DB9B3]" />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-[#1DB9B3]">Cover art</p>
                    <p className="text-sm font-medium text-[#3A2E39]">Choose the hero image for the shared viewer</p>
                  </div>
                </div>
                {selectedImages.length === 0 ? (
                  <p className="rounded-2xl border-2 border-dashed border-[#A0E7E5] bg-[#E0F7FA]/70 px-4 py-3 text-sm font-semibold text-[#1DB9B3]">
                    Select at least one coloring page to unlock cover art options.
                  </p>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {selectedImages.map(image => (
                      <button
                        type="button"
                        key={image.id}
                        onClick={() => setCoverImageId(image.id)}
                        className={`rounded-2xl border-2 px-4 py-3 text-left transition-all ${
                          coverImageId === image.id
                            ? 'border-[#FF6F91] bg-[#FFE6EB] shadow-[0_6px_0_0_#FFB3BA]'
                            : 'border-dashed border-[#A0E7E5] bg-white hover:border-[#55C6C0]'
                        }`}
                      >
                        <p className="text-xs font-semibold uppercase tracking-widest text-[#AA6A00]">Cover image</p>
                        <p className="text-sm font-semibold text-[#3A2E39]">{image.name}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-[#AA6A00]" />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-[#AA6A00]">Link expiration</p>
                    <p className="text-sm font-medium text-[#3A2E39]">Control how long the share link stays live</p>
                  </div>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {EXPIRATION_CHOICES.map(option => (
                    <button
                      type="button"
                      key={option.id}
                      onClick={() => setExpirationOption(option.id)}
                      className={`rounded-full border-2 px-4 py-2 text-sm font-semibold transition-all ${
                        expirationOption === option.id
                          ? 'border-[#FF6F91] bg-[#FFE6EB] text-[#FF6F91] shadow-[0_4px_0_0_#FFB3BA]'
                          : 'border-dashed border-[#FFD166] bg-white text-[#AA6A00] hover:border-[#FF6F91]'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
                {expirationOption === 'custom' && (
                  <input
                    type="date"
                    value={customExpiration}
                    onChange={(event) => setCustomExpiration(event.target.value)}
                    className="w-full rounded-2xl border-2 border-[#FFD166] bg-white/80 px-4 py-2 text-[#3A2E39] focus:border-[#FF6F91] focus:outline-none"
                    min={new Date().toISOString().split('T')[0]}
                  />
                )}
              </div>
            </div>
            <div className="grid gap-4 rounded-[2rem] border-4 border-dashed border-[#FFD166] bg-white/80 p-6 md:grid-cols-2">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <MessageCircle className="h-5 w-5 text-[#1DB9B3]" />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-[#1DB9B3]">Child-safe comments</p>
                    <p className="text-sm font-medium text-[#3A2E39]">Enable a moderated note board for little artists</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setCommentsEnabled(prev => !prev)}
                  className={`inline-flex items-center gap-2 rounded-full border-4 px-5 py-2 text-sm font-semibold transition-all ${
                    commentsEnabled
                      ? 'border-[#A0E7E5] bg-[#55C6C0] text-white shadow-[0_6px_0_0_#1DB9B3]'
                      : 'border-dashed border-[#A0E7E5] bg-white text-[#1DB9B3] hover:border-[#55C6C0]'
                  }`}
                >
                  <ShieldCheck className="h-4 w-4" />
                  {commentsEnabled ? 'Comments enabled' : 'Comments disabled'}
                </button>
                <p className="text-xs font-medium text-[#594144]">
                  Comments are lightly filtered for links and grown-up topics so younger viewers can cheer each other on.
                </p>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <FileLock2 className="h-5 w-5 text-[#AA6A00]" />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-[#AA6A00]">Downloads</p>
                    <p className="text-sm font-medium text-[#3A2E39]">Let viewers save the complete PDF</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setDownloadsEnabled(prev => !prev)}
                  className={`inline-flex items-center gap-2 rounded-full border-4 px-5 py-2 text-sm font-semibold transition-all ${
                    downloadsEnabled
                      ? 'border-[#FFD166] bg-[#FFB347] text-white shadow-[0_6px_0_0_#AA6A00]'
                      : 'border-dashed border-[#FFD166] bg-white text-[#AA6A00] hover:border-[#FFB347]'
                  }`}
                >
                  <Download className="h-4 w-4" />
                  {downloadsEnabled ? 'PDF downloads on' : 'PDF downloads off'}
                </button>
                <p className="text-xs font-medium text-[#594144]">
                  You can always toggle this again after creating the album.
                </p>
              </div>
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
                  availableImages.map(image => {
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
                            <div className={`flex h-8 w-8 items-center justify-center rounded-full border-2 ${isSelected ? 'border-white bg-[#FF6F91] text-white' : 'border-[#FF6F91] bg-white text-[#FF6F91]'}`}>
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
