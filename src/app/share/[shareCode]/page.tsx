'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import {
  Download,
  Printer,
  Paintbrush,
  Loader2,
  Sparkles,
  Eye,
  Share2,
  AlertTriangle,
  ArrowLeft,
  Facebook,
  Twitter,
  X,
} from 'lucide-react'
import { FunBackground } from '@/components/FunBackground'

interface SharedImage {
  id: string
  name: string
  coloringPageUrl: string
  createdAt: string
}

interface SharedPageData {
  image: SharedImage
  shareCode: string
  expiresAt: string | null
  viewCount: number
}

type ColoringCanvasModalProps = {
  imageUrl: string
  imageName: string
  onClose: () => void
}

const ColoringCanvasModal = dynamic<ColoringCanvasModalProps>(
  () =>
    import('@/components/ColoringCanvasModal').then((mod) => ({
      default: mod.ColoringCanvasModal,
    })),
  { ssr: false, loading: () => null }
)

export default function SharedColoringPage() {
  const params = useParams()
  const shareCode = params.shareCode as string
  const [pageData, setPageData] = useState<SharedPageData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCanvas, setShowCanvas] = useState(false)
  const [copied, setCopied] = useState(false)

  const fetchSharedPage = useCallback(async () => {
    try {
      console.log('🔗 Fetching shared page:', shareCode)

      const response = await fetch(`/api/share/${shareCode}`)
      
      if (!response.ok) {
        if (response.status === 404) {
          setError('Coloring page not found')
        } else if (response.status === 410) {
          setError('Share link has expired')
        } else {
          setError('Failed to load coloring page')
        }
        return
      }

      const result = await response.json()
      setPageData(result)
      console.log('✅ Loaded shared page:', result.image.name)
      
    } catch (err) {
      console.error('❌ Error fetching shared page:', err)
      setError('Failed to load coloring page')
    } finally {
      setLoading(false)
    }
  }, [shareCode])

  useEffect(() => {
    fetchSharedPage()
  }, [fetchSharedPage])

  const handlePrint = () => {
    if (pageData) {
      window.print()
    }
  }

  const handleDownload = () => {
    if (pageData) {
      const link = document.createElement('a')
      link.href = pageData.image.coloringPageUrl
      link.download = `coloring-page-${pageData.image.name}.png`
      link.click()
    }
  }

  const copyShareLink = async () => {
    const url = window.location.href
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const shareToSocial = (platform: 'twitter' | 'facebook' | 'whatsapp') => {
    const url = window.location.href
    const text = `Check out this coloring page: ${pageData?.image.name || 'Coloring Page'}`
    
    let shareUrl = ''
    switch (platform) {
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`
        break
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`
        break
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`
        break
    }
    
    window.open(shareUrl, '_blank', 'width=600,height=400')
  }

  if (loading) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#FFE6EB] via-[#E0FBFC] to-[#FFF3BF]">
        <FunBackground />
        <div className="relative z-10 flex min-h-screen items-center justify-center">
          <div className="flex flex-col items-center gap-4 rounded-2xl border-2 border-[#FFB3BA] bg-white/90 p-8 shadow-[6px_6px_0_0_#FF8A80]">
            <Loader2 className="h-12 w-12 animate-spin text-[#FF6F91]" />
            <p className="text-lg font-semibold text-[#3A2E39]">Loading coloring page...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !pageData) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#FFE6EB] via-[#E0FBFC] to-[#FFF3BF]">
        <FunBackground />
        <div className="relative z-10 flex min-h-screen items-center justify-center px-4">
          <div className="max-w-md text-center">
            <div className="relative overflow-hidden rounded-2xl border-2 border-[#FF8A80] bg-white/90 p-8 shadow-[6px_6px_0_0_#FF8A80]">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border-2 border-white bg-[#FF6F91] text-white shadow-inner">
                <AlertTriangle className="h-7 w-7" />
              </div>
              <h2 className="mb-2 text-xl font-bold text-gray-800">{error || 'Page Not Found'}</h2>
              <p className="mb-4 text-sm text-gray-600">
                This coloring page might have been removed or the link has expired.
              </p>
              <Link
                href="/"
                className="inline-flex items-center gap-2 rounded-full border-2 border-[#FFB3BA] bg-[#FF6F91] px-5 py-2 text-sm font-semibold text-white shadow-[3px_3px_0_0_#f2557b] transition-transform hover:-translate-y-0.5"
              >
                <ArrowLeft className="h-4 w-4" />
                Go to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#FFE6EB] via-[#E0FBFC] to-[#FFF3BF] print:bg-white">
      <FunBackground />
      
      <div className="relative z-10 min-h-screen">
        <nav className="border-b-2 border-[#FFB3BA] bg-white/80 print:hidden">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <Link href="/" className="flex items-center gap-2 text-xl font-extrabold text-[#3A2E39]">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#C3B5FF] to-[#FF8BA7] text-white shadow-[0_4px_0_0_rgba(255,139,167,0.35)]">
                  <Sparkles className="h-5 w-5" />
                </span>
                ColoringBook.AI
              </Link>
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1.5 rounded-full border-2 border-[#A0E7E5] bg-[#E0F7FA] px-3 py-1.5 text-xs font-semibold text-[#1DB9B3]">
                  <Eye className="h-3.5 w-3.5" />
                  {pageData.viewCount} views
                </span>
              </div>
            </div>
          </div>
        </nav>

        <main className="container mx-auto px-4 py-8 print:p-0">
          <div className="mx-auto max-w-4xl space-y-6 print:space-y-0">
            <div className="overflow-hidden rounded-2xl border-2 border-[#FFB3BA] bg-white/90 shadow-[6px_6px_0_0_#FF8A80] print:border-0 print:shadow-none">
              <div className="p-6 print:p-0">
                <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between print:hidden">
                  <div>
                    <h1 className="text-2xl font-extrabold text-[#3A2E39]">{pageData.image.name}</h1>
                    <p className="text-sm text-[#594144]/70">
                      Shared coloring page • Ready to print & color
                    </p>
                  </div>
                </div>

                <div className="mb-6 flex flex-wrap gap-2 print:hidden">
                  <button
                    onClick={handleDownload}
                    className="flex items-center gap-2 rounded-full border-2 border-[#FFB3BA] bg-[#FF6F91] px-4 py-2 text-sm font-semibold text-white shadow-[3px_3px_0_0_#f2557b] transition-transform hover:-translate-y-0.5"
                  >
                    <Download className="h-4 w-4" />
                    Download
                  </button>
                  <button
                    onClick={handlePrint}
                    className="flex items-center gap-2 rounded-full border-2 border-[#A0E7E5] bg-white px-4 py-2 text-sm font-semibold text-[#1DB9B3] shadow-[3px_3px_0_0_#55C6C0] transition-transform hover:-translate-y-0.5"
                  >
                    <Printer className="h-4 w-4" />
                    Print
                  </button>
                  <button
                    onClick={() => setShowCanvas(true)}
                    className="flex items-center gap-2 rounded-full border-2 border-[#C3B5FF] bg-[#F6F3FF] px-4 py-2 text-sm font-semibold text-[#6C63FF] shadow-[3px_3px_0_0_#A599E9] transition-transform hover:-translate-y-0.5"
                  >
                    <Paintbrush className="h-4 w-4" />
                    Color Online
                  </button>
                  <button
                    onClick={copyShareLink}
                    className="flex items-center gap-2 rounded-full border-2 border-[#FFD166] bg-[#FFF3BF] px-4 py-2 text-sm font-semibold text-[#AA6A00] shadow-[3px_3px_0_0_#FFB84C] transition-transform hover:-translate-y-0.5"
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
                    {copied ? 'Copied!' : 'Copy Link'}
                  </button>
                </div>

                <div className="mb-4 flex flex-wrap gap-2 print:hidden">
                  <button
                    onClick={() => shareToSocial('twitter')}
                    className="flex items-center gap-2 rounded-full border-2 border-[#1DA1F2] bg-white px-3 py-1.5 text-xs font-semibold text-[#1DA1F2] shadow-[2px_2px_0_0_#1DA1F2] transition-transform hover:-translate-y-0.5"
                  >
                    <Twitter className="h-3.5 w-3.5" />
                    Share on Twitter
                  </button>
                  <button
                    onClick={() => shareToSocial('facebook')}
                    className="flex items-center gap-2 rounded-full border-2 border-[#1877F2] bg-white px-3 py-1.5 text-xs font-semibold text-[#1877F2] shadow-[2px_2px_0_0_#1877F2] transition-transform hover:-translate-y-0.5"
                  >
                    <Facebook className="h-3.5 w-3.5" />
                    Share on Facebook
                  </button>
                  <button
                    onClick={() => shareToSocial('whatsapp')}
                    className="flex items-center gap-2 rounded-full border-2 border-[#25D366] bg-white px-3 py-1.5 text-xs font-semibold text-[#25D366] shadow-[2px_2px_0_0_#25D366] transition-transform hover:-translate-y-0.5"
                  >
                    <Share2 className="h-3.5 w-3.5" />
                    Share on WhatsApp
                  </button>
                </div>

                <div className="overflow-hidden rounded-xl border-2 border-[#A0E7E5] bg-gray-50 print:border-0">
                  <img
                    src={pageData.image.coloringPageUrl}
                    alt={pageData.image.name}
                    className="mx-auto max-h-[600px] w-auto object-contain print:max-h-none print:w-full"
                  />
                </div>
              </div>
            </div>

            <div className="rounded-2xl border-2 border-[#C3B5FF] bg-white/90 p-6 shadow-[6px_6px_0_0_#A599E9] print:hidden">
              <h2 className="mb-3 text-xl font-bold text-[#3A2E39]">Create Your Own Coloring Pages</h2>
              <p className="mb-4 text-sm text-[#594144]">
                Turn your photos into beautiful coloring pages with AI. Upload any image and get custom coloring pages in seconds!
              </p>
              <Link
                href="/"
                className="inline-flex items-center gap-2 rounded-full border-2 border-[#FFB3BA] bg-gradient-to-r from-[#FF8BA7] to-[#FF6F91] px-5 py-2 text-sm font-semibold text-white shadow-[3px_3px_0_0_#f2557b] transition-transform hover:-translate-y-0.5"
              >
                <Sparkles className="h-4 w-4" />
                Try ColoringBook.AI Free
              </Link>
            </div>
          </div>
        </main>
      </div>

      {showCanvas && pageData && (
        <ColoringCanvasModal
          imageUrl={pageData.image.coloringPageUrl}
          imageName={pageData.image.name}
          onClose={() => setShowCanvas(false)}
        />
      )}
    </div>
  )
}
