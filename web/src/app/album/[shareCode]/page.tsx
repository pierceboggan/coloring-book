'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import type { FormEvent } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  Download,
  Users,
  Calendar,
  Image as ImageIcon,
  Loader2,
  Sparkles,
  MessageCircle,
  Send,
  ShieldCheck,
  Lock,
  AlertTriangle,
} from 'lucide-react'
import { FunBackground } from '@/components/FunBackground'

interface SharedImage {
  id: string
  name: string
  original_url: string
  coloring_page_url: string
  status: string
}

interface SharedAlbum {
  id: string
  title: string
  description: string
  createdAt: string
  images: SharedImage[]
  imageCount: number
  coverImage?: SharedImage | null
  expiresAt?: string | null
  commentsEnabled?: boolean
  downloadsEnabled?: boolean
}

interface ViewerComment {
  id: string
  author: string
  message: string
  createdAt: string
}

const BANNED_WORDS = ['http', 'www', 'sex', 'kill', 'die', 'murder', 'drugs', 'weapon', 'blood']

export default function SharedAlbumPage() {
  const params = useParams()
  const shareCode = params.shareCode as string
  const [album, setAlbum] = useState<SharedAlbum | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [downloadingPdf, setDownloadingPdf] = useState(false)
  const [comments, setComments] = useState<ViewerComment[]>([])
  const [viewerName, setViewerName] = useState('')
  const [commentText, setCommentText] = useState('')
  const [commentError, setCommentError] = useState<string | null>(null)

  useEffect(() => {
    if (commentError) {
      setCommentError(null)
    }
  }, [commentText, viewerName, commentError])

  const fetchAlbum = useCallback(async () => {
    try {
      console.log('🔗 Fetching shared album:', shareCode)

      const response = await fetch(`/api/family-albums/${shareCode}`)
      
      if (!response.ok) {
        if (response.status === 404) {
          setError('Album not found')
        } else if (response.status === 410) {
          setError('Album link has expired')
        } else {
          setError('Failed to load album')
        }
        return
      }

      const result = await response.json()
      const normalizedAlbum: SharedAlbum = {
        ...result.album,
        commentsEnabled: result.album.commentsEnabled !== false,
        downloadsEnabled: result.album.downloadsEnabled !== false,
      }
      setAlbum(normalizedAlbum)
      console.log('✅ Loaded shared album:', result.album.title)
      
    } catch (err) {
      console.error('❌ Error fetching album:', err)
      setError('Failed to load album')
    } finally {
      setLoading(false)
    }
  }, [shareCode])

  useEffect(() => {
    if (shareCode) {
      fetchAlbum()
    }
  }, [shareCode, fetchAlbum])

  const storageKey = shareCode ? `album-comments-${shareCode}` : null

  useEffect(() => {
    if (!storageKey || typeof window === 'undefined') return

    try {
      const stored = window.localStorage.getItem(storageKey)
      if (stored) {
        const parsed = JSON.parse(stored) as ViewerComment[]
        if (Array.isArray(parsed)) {
          setComments(parsed)
        }
      }
    } catch (err) {
      console.warn('⚠️ Unable to load saved album comments', err)
    }
  }, [storageKey])

  useEffect(() => {
    if (!storageKey || typeof window === 'undefined') return
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(comments))
    } catch (err) {
      console.warn('⚠️ Unable to persist album comments', err)
    }
  }, [comments, storageKey])

  const downloadPDF = async () => {
    if (!shareCode) return

    if (album && album.downloadsEnabled === false) {
      alert('Downloads are disabled for this album.')
      return
    }

    setDownloadingPdf(true)
    console.log('📄 Downloading PDF for album:', shareCode)

    try {
      const response = await fetch(`/api/family-albums/${shareCode}?download=true`)

      if (!response.ok) {
        if (response.status === 403) {
          alert('Downloads are disabled for this album.')
          return
        }
        throw new Error('Failed to download PDF')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${album?.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_coloring_book.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      
      console.log('✅ PDF downloaded successfully')
      
    } catch (err) {
      console.error('❌ Error downloading PDF:', err)
      alert('Failed to download PDF. Please try again.')
    } finally {
      setDownloadingPdf(false)
    }
  }

  const sanitizeField = (value: string) => value.replace(/[<>]/g, '').replace(/\s+/g, ' ').trim()

  const containsBannedWord = (value: string) => {
    const normalized = value.toLowerCase()
    return BANNED_WORDS.some(word => normalized.includes(word))
  }

  const sortedComments = useMemo(
    () => [...comments].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [comments]
  )

  const handleCommentSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!album?.commentsEnabled) {
      return
    }

    const safeName = sanitizeField(viewerName).slice(0, 24) || 'Little Artist'
    const safeMessage = sanitizeField(commentText)

    if (!safeMessage) {
      setCommentError('Please add a note to share with the family.')
      return
    }

    if (safeMessage.length > 280) {
      setCommentError('Please keep messages under 280 characters.')
      return
    }

    if (containsBannedWord(safeMessage) || containsBannedWord(safeName)) {
      setCommentError("Let’s keep notes kid-friendly. Try different words.")
      return
    }

    const newComment: ViewerComment = {
      id: typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}`,
      author: safeName,
      message: safeMessage,
      createdAt: new Date().toISOString(),
    }

    setComments(prev => [newComment, ...prev])
    setViewerName('')
    setCommentText('')
    setCommentError(null)
  }

  if (loading) {
    return (
      <FunBackground>
        <div className="flex min-h-screen items-center justify-center">
          <div className="rounded-[2.75rem] border-4 border-[#FFB3BA] bg-white/90 px-12 py-10 text-center shadow-[14px_14px_0_0_#FF8A80]">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full border-4 border-white bg-[#FF6F91] text-white shadow-inner">
              <Loader2 className="h-10 w-10 animate-spin" />
            </div>
            <p className="text-lg font-semibold text-[#3A2E39]">Loading family album...</p>
          </div>
        </div>
      </FunBackground>
    )
  }

  if (error) {
    return (
      <FunBackground>
        <div className="flex min-h-screen items-center justify-center px-4">
          <div className="relative mx-auto max-w-lg overflow-hidden rounded-[3rem] border-4 border-[#FFB3BA] bg-white/95 p-10 text-center shadow-[18px_18px_0_0_#FF8A80]">
            <div className="pointer-events-none absolute -top-8 right-8 h-20 w-20 rounded-full bg-[#FFD166]/50" aria-hidden="true" />
            <Users className="mx-auto mb-6 h-16 w-16 text-[#FF6F91]" />
            <h1 className="text-3xl font-extrabold text-[#3A2E39]">
              {error === 'Album link has expired' ? 'Album link expired' : 'Album not found'}
            </h1>
            <p className="mt-3 text-sm font-medium text-[#594144]">{error}</p>
            <Link
              href="/"
              className="mt-8 inline-flex items-center gap-2 rounded-full border-4 border-[#A0E7E5] bg-[#55C6C0] px-8 py-3 text-sm font-semibold text-white shadow-[10px_10px_0_0_#1DB9B3] transition-transform hover:-translate-y-0.5"
            >
              Return to ColoringBook.AI
            </Link>
          </div>
        </div>
      </FunBackground>
    )
  }

  if (!album) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-col gap-3 text-center md:text-left">
              <div className="flex flex-col items-center gap-4 md:flex-row md:items-center md:gap-4">
                {album.coverImage ? (
                  <div className="h-20 w-20 overflow-hidden rounded-3xl border-4 border-[#FFB3BA] bg-[#FFE6EB]/60 shadow-[6px_6px_0_0_#FF8A80]">
                    <img
                      src={album.coverImage.coloring_page_url}
                      alt={album.coverImage.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#FFE6EB] text-[#FF6F91] shadow-inner">
                    <Users className="h-8 w-8" />
                  </div>
                )}
                <div>
                  <h1 className="text-2xl font-bold text-gray-800">{album.title}</h1>
                  {album.description && (
                    <p className="text-gray-600">{album.description}</p>
                  )}
                </div>
              </div>
              {album.expiresAt && (
                <div className="mx-auto mt-2 flex max-w-sm items-center justify-center gap-2 rounded-full border-2 border-dashed border-[#FFD166] bg-[#FFF3BF]/70 px-4 py-1 text-xs font-semibold uppercase tracking-widest text-[#AA6A00] md:mx-0">
                  <AlertTriangle className="h-4 w-4" />
                  Link expires on {new Date(album.expiresAt).toLocaleDateString()}
                </div>
              )}
              {album.downloadsEnabled === false && (
                <div className="mx-auto mt-2 flex max-w-sm items-center justify-center gap-2 rounded-full border-2 border-dashed border-[#FFB3BA] bg-[#FFE6EB]/70 px-4 py-1 text-xs font-semibold uppercase tracking-widest text-[#FF6F91] md:mx-0">
                  <Lock className="h-4 w-4" />
                  PDF downloads disabled by album owner
                </div>
              )}
            </div>
            <div className="text-left">
              <span className="block text-xs font-semibold uppercase tracking-[0.3em] text-[#1DB9B3]">Shared album</span>
              <span className="text-2xl font-extrabold text-[#3A2E39]">{album.title}</span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/"
              className="flex items-center gap-2 rounded-full border-4 border-[#FFB3BA] bg-white px-5 py-2 text-sm font-semibold text-[#FF6F91] shadow-[6px_6px_0_0_#FF8A80] transition-transform hover:-translate-y-0.5"
            >
              Back to home
            </Link>
            <button
              onClick={downloadPDF}
              disabled={downloadingPdf || album.imageCount === 0}
              className="w-full md:w-auto bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              {downloadingPdf ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating PDF...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  Download PDF
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 pb-24 pt-12">
        <div className="relative overflow-hidden rounded-[3rem] border-4 border-[#FFB3BA] bg-white/90 px-8 py-10 shadow-[18px_18px_0_0_#FF8A80]">
          <div className="pointer-events-none absolute -top-10 right-10 h-24 w-24 rounded-full bg-[#FFD166]/60" aria-hidden="true" />
          <div className="pointer-events-none absolute -bottom-8 left-6 h-20 w-20 rounded-full bg-[#A0E7E5]/60" aria-hidden="true" />
          <div className="grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border-4 border-dashed border-[#FFD166] bg-[#FFF3BF] px-6 py-3 text-sm font-bold uppercase tracking-widest text-[#E97777]">
                <Sparkles className="h-4 w-4" />
                Family coloring fun
              </div>
              <h1 className="text-4xl font-extrabold text-[#3A2E39]">{album.title}</h1>
              {album.description ? (
                <p className="text-lg font-medium text-[#594144]">{album.description}</p>
              ) : (
                <p className="text-lg font-medium text-[#594144]">A curated collection of AI-crafted coloring adventures ready for crayons and markers.</p>
              )}
            </div>
            <div className="flex flex-col gap-4 rounded-[2rem] border-4 border-[#A0E7E5] bg-[#E0F7FA]/80 p-6">
              <div className="flex items-center gap-3 rounded-full border-2 border-dashed border-[#A0E7E5] bg-white px-4 py-2 text-xs font-semibold uppercase tracking-widest text-[#1DB9B3]">
                <ImageIcon className="h-4 w-4" />
                {album.imageCount} coloring pages
              </div>
              <div className="flex items-center gap-3 rounded-full border-2 border-dashed border-[#FFD166] bg-[#FFF3BF] px-4 py-2 text-xs font-semibold uppercase tracking-widest text-[#AA6A00]">
                <Calendar className="h-4 w-4" />
                Created {new Date(album.createdAt).toLocaleDateString()}
              </div>
              <p className="text-sm font-semibold text-[#1DB9B3]">
                {album.downloadsEnabled === false
                  ? 'Viewing is open! The album owner kept PDF downloads turned off for now.'
                  : 'Share this page so friends can download each sheet or the full PDF.'}
              </p>
            </div>
          </div>
        </div>

        <section className="mt-16 space-y-10">
          {album.imageCount === 0 ? (
            <div className="mx-auto max-w-2xl">
              <div className="relative overflow-hidden rounded-[3rem] border-4 border-[#A0E7E5] bg-white/90 p-12 text-center shadow-[18px_18px_0_0_#55C6C0]">
                <div className="pointer-events-none absolute -top-8 right-12 h-20 w-20 rounded-full bg-[#FFB3BA]/50" aria-hidden="true" />
                <ImageIcon className="mx-auto mb-6 h-16 w-16 text-[#55C6C0]" />
                <h3 className="text-2xl font-extrabold text-[#3A2E39]">No coloring pages yet</h3>
                <p className="mt-3 text-base font-medium text-[#594144]">This album doesn&apos;t have any completed coloring pages to display.</p>
              </div>
            </div>
          ) : (
            <div className="grid gap-10 md:grid-cols-2 xl:grid-cols-3">
              {album.images.map((image) => (
                <div key={image.id} className="group relative overflow-hidden rounded-[2.5rem] border-4 border-[#A0E7E5] bg-white/90 p-5 shadow-[14px_14px_0_0_#55C6C0] transition-transform hover:-translate-y-1">
                  <div className="pointer-events-none absolute -top-6 right-6 h-16 w-16 rounded-full bg-[#FFB3BA]/50 blur-xl" aria-hidden="true" />
                  <div className="overflow-hidden rounded-[1.75rem] border-4 border-dashed border-[#FFB3BA] bg-[#FFE6EB]/80">
                    <img src={image.coloring_page_url} alt={image.name} className="h-full w-full rounded-[1.25rem] object-cover" />
                  </div>
                  <div className="mt-5 space-y-4">
                    <h3 className="text-lg font-extrabold text-[#3A2E39]">{image.name}</h3>
                    {album.downloadsEnabled === false ? (
                      <div className="inline-flex w-full items-center justify-center gap-2 rounded-full border-4 border-[#FFB3BA] bg-[#FFE6EB] px-4 py-2 text-sm font-semibold text-[#FF6F91] shadow-[6px_6px_0_0_#FF8A80]">
                        <Lock className="h-4 w-4" />
                        Downloads paused
                      </div>
                    ) : (
                      <a
                        href={image.coloring_page_url}
                        download={`coloring-page-${image.name}`}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-full border-4 border-[#FFB3BA] bg-[#FF6F91] px-4 py-2 text-sm font-semibold text-white shadow-[6px_6px_0_0_#f2557b] transition-transform hover:-translate-y-0.5"
                      >
                        <Download className="h-4 w-4" />
                        Download page
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="mt-16">
          {album.commentsEnabled === false ? (
            <div className="mx-auto max-w-3xl">
              <div className="relative overflow-hidden rounded-[3rem] border-4 border-[#FFD166] bg-white/90 px-8 py-10 text-center shadow-[18px_18px_0_0_#FFB84C]">
                <div className="pointer-events-none absolute -top-8 right-10 h-20 w-20 rounded-full bg-[#FFB3BA]/40" aria-hidden="true" />
                <ShieldCheck className="mx-auto mb-4 h-12 w-12 text-[#FF6F91]" />
                <h3 className="text-2xl font-extrabold text-[#3A2E39]">Comments are turned off</h3>
                <p className="mt-2 text-sm font-medium text-[#594144]">The album owner disabled notes for this share link.</p>
              </div>
            </div>
          ) : (
            <div className="relative overflow-hidden rounded-[3rem] border-4 border-[#A0E7E5] bg-white/90 px-8 py-10 shadow-[18px_18px_0_0_#55C6C0]">
              <div className="pointer-events-none absolute -top-10 left-8 h-20 w-20 rounded-full bg-[#FFB3BA]/50" aria-hidden="true" />
              <div className="pointer-events-none absolute -bottom-12 right-12 h-24 w-24 rounded-full bg-[#FFD166]/50" aria-hidden="true" />
              <div className="flex flex-col gap-8 lg:flex-row">
                <div className="flex-1 space-y-5">
                  <div className="inline-flex items-center gap-2 rounded-full border-4 border-dashed border-[#FFB3BA] bg-[#FFE6EB] px-6 py-3 text-sm font-bold uppercase tracking-widest text-[#FF6F91]">
                    <MessageCircle className="h-4 w-4" />
                    Family shout-outs
                  </div>
                  {sortedComments.length === 0 ? (
                    <div className="rounded-[2rem] border-4 border-dashed border-[#FFB3BA] bg-[#FFE6EB]/60 px-6 py-10 text-center text-sm font-semibold text-[#FF6F91]">
                      No notes yet—be the first to leave an encouraging message!
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {sortedComments.map(comment => (
                        <div key={comment.id} className="rounded-[1.75rem] border-4 border-[#FFB3BA] bg-white/90 px-6 py-5 shadow-[10px_10px_0_0_#FF8A80]">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="text-sm font-semibold text-[#FF6F91]">{comment.author}</span>
                            <time className="text-xs font-medium text-[#594144]">
                              {new Date(comment.createdAt).toLocaleString()}
                            </time>
                          </div>
                          <p className="mt-3 text-sm font-medium text-[#3A2E39]">{comment.message}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="lg:w-1/3">
                  <form onSubmit={handleCommentSubmit} className="space-y-4 rounded-[2rem] border-4 border-dashed border-[#FFD166] bg-[#FFF9E6]/80 p-6">
                    <div className="flex items-center gap-3">
                      <ShieldCheck className="h-5 w-5 text-[#AA6A00]" />
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-widest text-[#AA6A00]">Kid-friendly notes</p>
                        <p className="text-xs font-medium text-[#594144]">We gently filter out links and grown-up words.</p>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-widest text-[#AA6A00]">Nickname</label>
                      <input
                        type="text"
                        value={viewerName}
                        onChange={(event) => setViewerName(event.target.value)}
                        maxLength={24}
                        placeholder="e.g., Auntie Jess"
                        className="mt-2 w-full rounded-2xl border-2 border-[#FFD166] bg-white/80 px-4 py-2 text-sm text-[#3A2E39] focus:border-[#FF6F91] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-widest text-[#AA6A00]">Cheer them on</label>
                      <textarea
                        value={commentText}
                        onChange={(event) => setCommentText(event.target.value)}
                        maxLength={280}
                        placeholder="Leave a short, encouraging message"
                        className="mt-2 w-full rounded-2xl border-2 border-[#FFD166] bg-white/80 px-4 py-3 text-sm text-[#3A2E39] focus:border-[#FF6F91] focus:outline-none"
                        rows={4}
                      />
                      <div className="mt-1 flex items-center justify-between text-xs font-medium text-[#AA6A00]">
                        <span>{commentText.length}/280</span>
                        <span>Links are automatically blocked</span>
                      </div>
                    </div>
                    {commentError && (
                      <p className="rounded-full border-2 border-[#FFB3BA] bg-[#FFE6EB] px-3 py-2 text-center text-xs font-semibold text-[#FF6F91]">
                        {commentError}
                      </p>
                    )}
                    <button
                      type="submit"
                      disabled={!commentText.trim()}
                      className="flex w-full items-center justify-center gap-2 rounded-full border-4 border-[#FFB3BA] bg-[#FF6F91] px-5 py-3 text-sm font-semibold text-white shadow-[8px_8px_0_0_#f2557b] transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none"
                    >
                      <Send className="h-4 w-4" />
                      Share note
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )}
        </section>

        <footer className="mt-16 rounded-[2.5rem] border-4 border-dashed border-[#FFD166] bg-white/90 px-8 py-10 text-center shadow-[14px_14px_0_0_#FFB84C]">
          <p className="text-sm font-semibold uppercase tracking-widest text-[#AA6A00]">Created with</p>
          <Link
            href="/"
            className="mt-3 inline-block rounded-full border-4 border-[#FFB3BA] bg-[#FF6F91] px-8 py-3 text-sm font-semibold text-white shadow-[8px_8px_0_0_#f2557b] transition-transform hover:-translate-y-0.5"
          >
            ColoringBook.AI
          </Link>
          <p className="mt-3 text-sm font-medium text-[#594144]">Transform your photos into whimsical coloring pages with our friendly AI crayons.</p>
        </footer>
      </main>
    </div>
  )
}