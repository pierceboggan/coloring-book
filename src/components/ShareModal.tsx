'use client'

import { useState } from 'react'
import {
  X,
  Copy,
  Check,
  Share2,
  Facebook,
  Twitter,
  Loader2,
} from 'lucide-react'

interface ShareModalProps {
  imageId: string
  imageName: string
  isVariant?: boolean
  variantUrl?: string
  onClose: () => void
}

export function ShareModal({ imageId, imageName, isVariant, variantUrl, onClose }: ShareModalProps) {
  const [shareUrl, setShareUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createShare = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/share', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageId,
          isVariant: isVariant || false,
          variantUrl: variantUrl || null,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create share link')
      }

      const data = await response.json()
      setShareUrl(data.shareUrl)
    } catch (err) {
      console.error('❌ Failed to create share:', err)
      setError('Failed to create share link. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const copyShareLink = async () => {
    if (shareUrl) {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const shareToSocial = (platform: 'twitter' | 'facebook' | 'whatsapp') => {
    if (!shareUrl) return
    
    const text = `Check out this coloring page: ${imageName}`
    let url = ''
    
    switch (platform) {
      case 'twitter':
        url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`
        break
      case 'facebook':
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`
        break
      case 'whatsapp':
        url = `https://wa.me/?text=${encodeURIComponent(text + ' ' + shareUrl)}`
        break
    }
    
    window.open(url, '_blank', 'width=600,height=400')
  }

  const handleNativeShare = async () => {
    if (!shareUrl) return

    if (navigator.share) {
      try {
        await navigator.share({
          title: imageName,
          text: `Check out this coloring page: ${imageName}`,
          url: shareUrl,
        })
      } catch (err) {
        // User cancelled or error occurred
        console.log('Share cancelled or failed')
      }
    } else {
      // Fallback to copy link
      await copyShareLink()
    }
  }

  // Auto-create share on mount
  useState(() => {
    createShare()
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md overflow-hidden rounded-2xl border-2 border-[#FFB3BA] bg-white shadow-[6px_6px_0_0_#FF8A80]">
        <div className="flex items-center justify-between border-b-2 border-[#FFB3BA] bg-[#FFE6EB] p-4">
          <h2 className="text-lg font-bold text-[#3A2E39]">Share Coloring Page</h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#FFB3BA] bg-white text-[#FF6F91] transition-transform hover:-translate-y-0.5"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex flex-col items-center gap-4 py-8">
              <Loader2 className="h-12 w-12 animate-spin text-[#FF6F91]" />
              <p className="text-sm font-medium text-[#3A2E39]">Creating share link...</p>
            </div>
          ) : error ? (
            <div className="space-y-4">
              <p className="text-sm text-red-600">{error}</p>
              <button
                onClick={createShare}
                className="w-full rounded-full border-2 border-[#FFB3BA] bg-[#FF6F91] px-4 py-2 text-sm font-semibold text-white shadow-[3px_3px_0_0_#f2557b] transition-transform hover:-translate-y-0.5"
              >
                Try Again
              </button>
            </div>
          ) : shareUrl ? (
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-semibold text-[#3A2E39]">Share this link</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={shareUrl}
                    readOnly
                    className="flex-1 rounded-full border-2 border-[#A0E7E5] bg-[#E0FBFC] px-4 py-2 text-sm font-medium text-[#3A2E39]"
                  />
                  <button
                    onClick={copyShareLink}
                    className="flex items-center gap-2 rounded-full border-2 border-[#FFB3BA] bg-white px-4 py-2 text-sm font-semibold text-[#FF6F91] shadow-[3px_3px_0_0_#FF8A80] transition-transform hover:-translate-y-0.5"
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-[#3A2E39]">Share on social media</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => shareToSocial('twitter')}
                    className="flex items-center justify-center gap-2 rounded-full border-2 border-[#1DA1F2] bg-white px-4 py-2 text-sm font-semibold text-[#1DA1F2] shadow-[2px_2px_0_0_#1DA1F2] transition-transform hover:-translate-y-0.5"
                  >
                    <Twitter className="h-4 w-4" />
                    Twitter
                  </button>
                  <button
                    onClick={() => shareToSocial('facebook')}
                    className="flex items-center justify-center gap-2 rounded-full border-2 border-[#1877F2] bg-white px-4 py-2 text-sm font-semibold text-[#1877F2] shadow-[2px_2px_0_0_#1877F2] transition-transform hover:-translate-y-0.5"
                  >
                    <Facebook className="h-4 w-4" />
                    Facebook
                  </button>
                  <button
                    onClick={() => shareToSocial('whatsapp')}
                    className="col-span-2 flex items-center justify-center gap-2 rounded-full border-2 border-[#25D366] bg-white px-4 py-2 text-sm font-semibold text-[#25D366] shadow-[2px_2px_0_0_#25D366] transition-transform hover:-translate-y-0.5"
                  >
                    <Share2 className="h-4 w-4" />
                    WhatsApp
                  </button>
                </div>
              </div>

              <button
                onClick={handleNativeShare}
                className="w-full rounded-full border-2 border-[#C3B5FF] bg-[#F6F3FF] px-4 py-2 text-sm font-semibold text-[#6C63FF] shadow-[3px_3px_0_0_#A599E9] transition-transform hover:-translate-y-0.5"
              >
                <Share2 className="mr-2 inline h-4 w-4" />
                More Sharing Options
              </button>

              <div className="rounded-xl border-2 border-[#A0E7E5] bg-[#E0FBFC] p-3">
                <p className="text-xs text-[#1DB9B3]">
                  Anyone with this link can view, print, and color this page online. The link doesn't expire.
                </p>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
