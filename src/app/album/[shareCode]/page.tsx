'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Download, Users, Calendar, Image as ImageIcon, Loader2, Sparkles } from 'lucide-react'
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
}

export default function SharedAlbumPage() {
  const params = useParams()
  const shareCode = params.shareCode as string
  const [album, setAlbum] = useState<SharedAlbum | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [downloadingPdf, setDownloadingPdf] = useState(false)

  const fetchAlbum = useCallback(async () => {
    try {
      console.log('🔗 Fetching shared album:', shareCode)

      const response = await fetch(`/api/family-albums/${shareCode}`)
      
      if (!response.ok) {
        if (response.status === 404) {
          setError('Album not found')
        } else {
          setError('Failed to load album')
        }
        return
      }

      const result = await response.json()
      setAlbum(result.album)
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

  const downloadPDF = async () => {
    if (!shareCode) return
    
    setDownloadingPdf(true)
    console.log('📄 Downloading PDF for album:', shareCode)
    
    try {
      const response = await fetch(`/api/family-albums/${shareCode}?download=true`)
      
      if (!response.ok) {
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
            <h1 className="text-3xl font-extrabold text-[#3A2E39]">Album not found</h1>
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
    <FunBackground>
      <nav className="container mx-auto px-4 pt-8">
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-full border-4 border-[#A0E7E5] bg-white/90 px-6 py-4 shadow-[12px_12px_0_0_#55C6C0] backdrop-blur">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#55C6C0] text-white shadow-inner">
              <Users className="h-7 w-7" />
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
              className="flex items-center gap-2 rounded-full border-4 border-[#A0E7E5] bg-[#55C6C0] px-6 py-2 text-sm font-semibold text-white shadow-[8px_8px_0_0_#1DB9B3] transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none"
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
      </nav>

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
                Share this page so friends can download each sheet or the full PDF.
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
                    <a
                      href={image.coloring_page_url}
                      download={`coloring-page-${image.name}`}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-full border-4 border-[#FFB3BA] bg-[#FF6F91] px-4 py-2 text-sm font-semibold text-white shadow-[6px_6px_0_0_#f2557b] transition-transform hover:-translate-y-0.5"
                    >
                      <Download className="h-4 w-4" />
                      Download page
                    </a>
                  </div>
                </div>
              ))}
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
    </FunBackground>
  )
}