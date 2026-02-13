'use client'

import { useState, useEffect, useCallback } from 'react'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { FunBackground } from '@/components/FunBackground'
import {
  Palette,
  Plus,
  Download,
  Archive,
  ArrowLeft,
  Loader2,
  Book,
  Users,
  RotateCcw,
  Paintbrush,
  Sparkles,
  Star,
  Pencil,
  X,
  Check,
  Images,
  Heart,
  Grid3x3,
  LayoutGrid,
} from 'lucide-react'

interface UserImage {
  id: string
  name: string
  original_url: string
  coloring_page_url?: string
  status: 'processing' | 'completed' | 'error'
  created_at: string
  variant_urls?: string[] | null
  variant_prompts?: string[] | null
  archived_at?: string | null
  is_favorite?: boolean | null
}

type VariantSummary = {
  url: string
  prompt: string
}

interface ColoringDisplayItem {
  id: string
  displayId: string
  name: string
  coloringPageUrl: string
  createdAt: string
  isVariant: boolean
  variantPrompt?: string
  parentImage: UserImage
  isFavorite: boolean
}

const getOrdinalSuffix = (day: number) => {
  const remainder = day % 100

  if (remainder >= 11 && remainder <= 13) {
    return 'th'
  }

  switch (day % 10) {
    case 1:
      return 'st'
    case 2:
      return 'nd'
    case 3:
      return 'rd'
    default:
      return 'th'
  }
}

const formatImageDate = (value: string) => {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  const month = new Intl.DateTimeFormat('en-US', { month: 'long' }).format(date)
  const day = date.getDate()
  const year = date.getFullYear()
  const formattedDate = `${month} ${day}${getOrdinalSuffix(day)}, ${year}`

  const startOfDay = (input: Date) => new Date(input.getFullYear(), input.getMonth(), input.getDate())
  const today = startOfDay(new Date())
  const targetDay = startOfDay(date)
  const msPerDay = 1000 * 60 * 60 * 24
  const diffInDays = Math.round((today.getTime() - targetDay.getTime()) / msPerDay)

  let relativeLabel: string

  if (diffInDays === 0) {
    relativeLabel = 'today'
  } else if (diffInDays > 0) {
    relativeLabel = diffInDays === 1 ? '1 day ago' : `${diffInDays} days ago`
  } else {
    const daysAhead = Math.abs(diffInDays)
    relativeLabel = daysAhead === 1 ? 'in 1 day' : `in ${daysAhead} days`
  }

  return `${formattedDate} (${relativeLabel})`
}

const getVariantSummaries = (image: UserImage): VariantSummary[] => {
  const urls = image.variant_urls || []
  const prompts = image.variant_prompts || []

  return urls
    .map((url, index) => ({
      url,
      prompt: prompts[index] || 'Custom variant scene',
    }))
    .filter((variant): variant is VariantSummary => Boolean(variant.url))
}

type PhotobookCreatorProps = {
  images: UserImage[]
  onClose: () => void
}

type FamilyAlbumCreatorProps = {
  images: UserImage[]
  onClose: () => void
}

type RegenerateModalProps = {
  isOpen: boolean
  onClose: () => void
  imageId: string
  imageName: string
  currentColoringPageUrl: string
  onRegenerateComplete: (regeneratedUrl: string) => void
}

type ImageUploaderProps = {
  onUploadComplete?: () => void
}

type ColoringCanvasModalProps = {
  imageUrl: string
  imageName: string
  onClose: () => void
}

type PromptRemixModalProps = {
  isOpen: boolean
  onClose: () => void
  imageName: string
  imageUrl: string
}

type VariantsModalProps = {
  isOpen: boolean
  onClose: () => void
  imageId: string
  imageName: string
  originalUrl: string
  variants: VariantSummary[]
  onVariantsUpdated: (variants: VariantSummary[]) => void
  onUseVariant: (variantUrl: string) => Promise<void>
}

const PhotobookCreator = dynamic<PhotobookCreatorProps>(
  () =>
    import('@/components/PhotobookCreator').then((mod) => ({
      default: mod.PhotobookCreator,
    })),
  { ssr: false, loading: () => null }
)

const FamilyAlbumCreator = dynamic<FamilyAlbumCreatorProps>(
  () =>
    import('@/components/FamilyAlbumCreator').then((mod) => ({
      default: mod.FamilyAlbumCreator,
    })),
  { ssr: false, loading: () => null }
)

const RegenerateModal = dynamic<RegenerateModalProps>(
  () =>
    import('@/components/RegenerateModal').then((mod) => ({
      default: mod.RegenerateModal,
    })),
  { ssr: false, loading: () => null }
)

const ImageUploader = dynamic<ImageUploaderProps>(
  () => import('@/components/ImageUploader'),
  { ssr: false, loading: () => null }
)

const ColoringCanvasModal = dynamic<ColoringCanvasModalProps>(
  () =>
    import('@/components/ColoringCanvasModal').then((mod) => ({
      default: mod.ColoringCanvasModal,
    })),
  { ssr: false, loading: () => null }
)

const PromptRemixModal = dynamic<PromptRemixModalProps>(
  () =>
    import('@/components/PromptRemixModal').then((mod) => ({
      default: mod.PromptRemixModal,
    })),
  { ssr: false, loading: () => null }
)

const VariantsModal = dynamic<VariantsModalProps>(
  () =>
    import('@/components/VariantsModal').then((mod) => ({
      default: mod.VariantsModal,
    })),
  { ssr: false, loading: () => null }
)

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const userId = user?.id ?? null
  const [images, setImages] = useState<UserImage[]>([])
  const [loading, setLoading] = useState(true)
  const [showPhotobookCreator, setShowPhotobookCreator] = useState(false)
  const [showFamilyAlbumCreator, setShowFamilyAlbumCreator] = useState(false)
  const [showUploader, setShowUploader] = useState(false)
  const [regenerateImage, setRegenerateImage] = useState<UserImage | null>(null)
  const [retryingProcessing, setRetryingProcessing] = useState(false)
  const [activeDrawingImage, setActiveDrawingImage] = useState<UserImage | null>(null)
  const [promptRemixImage, setPromptRemixImage] = useState<UserImage | null>(null)
  const [variantsImage, setVariantsImage] = useState<UserImage | null>(null)
  const [editingImageId, setEditingImageId] = useState<string | null>(null)
  const [imageNameInput, setImageNameInput] = useState('')
  const [renamingImageId, setRenamingImageId] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'coloring' | 'uploads'>('coloring')
  const [layoutMode, setLayoutMode] = useState<'expanded' | 'compact'>('compact')

  const fetchUserImages = useCallback(async () => {
    try {
      const devBypassActive =
        process.env.NODE_ENV !== 'production' &&
        process.env.NEXT_PUBLIC_ENABLE_DEV_AUTH_BYPASS === 'true'

      if (devBypassActive) {
        setImages([])
        setLoading(false)
        return
      }

      if (!userId) {
        console.error('❌ No user ID available for fetching images')
        return
      }

      const { data, error } = await supabase
        .from('images')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('❌ Error fetching images:', error)
        throw error
      }

      const userImages = (data || []) as UserImage[]
      const nonArchivedImages = userImages.filter(img => !img.archived_at)
      setImages(nonArchivedImages)
    } catch (error) {
      console.error('💥 Failed to fetch images:', error)
    } finally {
      setLoading(false)
    }
  }, [userId])

  const totalImages = images.length
  const coloringPages = images.filter(img => img.status === 'completed' && img.coloring_page_url)
  const uploadsViewImages = images
  const processingCount = images.filter(img => img.status === 'processing').length
  const isProcessing = processingCount > 0

  // Flatten coloring pages and their variants into a single display list
  const coloringDisplayItems: ColoringDisplayItem[] = coloringPages.flatMap((image) => {
    const mainItem: ColoringDisplayItem = {
      id: image.id,
      displayId: image.id,
      name: image.name,
      coloringPageUrl: image.coloring_page_url!,
      createdAt: image.created_at,
      isVariant: false,
      parentImage: image,
      isFavorite: image.is_favorite ?? false,
    }

    const variantItems: ColoringDisplayItem[] = (image.variant_urls || []).map((url, index) => ({
      id: image.id,
      displayId: `${image.id}-variant-${index}`,
      name: image.name,
      coloringPageUrl: url,
      createdAt: image.created_at,
      isVariant: true,
      variantPrompt: image.variant_prompts?.[index] || 'Custom variant',
      parentImage: image,
      isFavorite: image.is_favorite ?? false,
    }))

    return [mainItem, ...variantItems]
  })

  // Sort coloring items: favorites first, then by creation date
  coloringDisplayItems.sort((a, b) => {
    if (a.isFavorite !== b.isFavorite) {
      return a.isFavorite ? -1 : 1
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })

  // Sort uploads: favorites first, then by creation date
  const sortedUploadsViewImages = [...uploadsViewImages].sort((a, b) => {
    const aFav = a.is_favorite ?? false
    const bFav = b.is_favorite ?? false
    if (aFav !== bFav) {
      return aFav ? -1 : 1
    }
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })

  const completedCount = coloringDisplayItems.length

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/')
      return
    }

    if (!userId) {
      return
    }

    fetchUserImages()

    // Set up real-time subscription for image updates (with fallback handling)
    let subscription: RealtimeChannel | null = null
    let isRealTimeWorking = false

    try {
      subscription = supabase
        .channel('images_changes')
        .on(
          'postgres_changes',
          {
            event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
            schema: 'public',
            table: 'images',
            filter: `user_id=eq.${userId}`,
          },
          () => {
            fetchUserImages()
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            isRealTimeWorking = true
          } else if (status === 'CHANNEL_ERROR') {
            console.warn('⚠️ Real-time subscription failed, using polling instead')
            isRealTimeWorking = false
          }
        })
    } catch (error) {
      console.warn('⚠️ Real-time setup failed, using polling only:', error)
      isRealTimeWorking = false
    }

    // Enhanced polling mechanism - more frequent when processing images
    let pollInterval: NodeJS.Timeout

    const startPolling = () => {
      const poll = async () => {
        try {
          const { data } = await supabase
            .from('images')
            .select('status')
            .eq('user_id', userId)

          const hasProcessingImages = data?.some(img => img.status === 'processing')

          // Poll more frequently if real-time isn't working or there are processing images
          if (!isRealTimeWorking || hasProcessingImages) {
            await fetchUserImages()
          }

          // Schedule next poll with dynamic interval
          const nextInterval = hasProcessingImages ? 3000 : (isRealTimeWorking ? 15000 : 5000)
          pollInterval = setTimeout(poll, nextInterval)
        } catch (error) {
          console.error('❌ Polling error:', error)
          pollInterval = setTimeout(poll, 5000) // Retry in 5s on error
        }
      }

      poll() // Start first poll immediately
    }

    startPolling()

    return () => {
      subscription?.unsubscribe()
      clearTimeout(pollInterval)
    }
  }, [authLoading, fetchUserImages, router, user, userId])

  const archiveImage = async (imageId: string) => {
    try {
      const response = await fetch(`/api/images/${imageId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'archive' }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to archive image')
      }

      // Update local state
      setImages(prev => prev.filter(img => img.id !== imageId))

    } catch (error) {
      console.error('❌ Failed to archive image:', error)
      // Show user-friendly error
      alert(`Failed to archive image: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const toggleFavorite = async (imageId: string, currentFavorite: boolean) => {
    try {
      const action = currentFavorite ? 'unfavorite' : 'favorite'
      const response = await fetch(`/api/images/${imageId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update favorite status')
      }

      // Update local state
      setImages(prev =>
        prev.map(img =>
          img.id === imageId
            ? { ...img, is_favorite: !currentFavorite }
            : img
        )
      )

    } catch (error) {
      console.error('❌ Failed to toggle favorite:', error)
      alert(`Failed to update favorite: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const retryStuckImages = async () => {
    setRetryingProcessing(true)

    try {
      const response = await fetch('/api/retry-processing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
          body: JSON.stringify({
            userId
          }),
      })

      if (!response.ok) {
        throw new Error('Failed to retry processing')
      }

      const result = await response.json()
      
      // Refresh the images after retry
      await fetchUserImages()
      
      if (result.processedCount > 0) {
        alert(`Successfully processed ${result.processedCount} images!`)
      } else {
        alert(result.message || 'No images needed processing')
      }
      
    } catch (error) {
      console.error('❌ Error retrying processing:', error)
      alert('Failed to retry processing. Please try again.')
    } finally {
      setRetryingProcessing(false)
    }
  }

  const startRenamingImage = (image: UserImage) => {
    setEditingImageId(image.id)
    setImageNameInput(image.name)
    setRenamingImageId(null)
  }

  const cancelRenamingImage = () => {
    setEditingImageId(null)
    setImageNameInput('')
    setRenamingImageId(null)
  }

  const saveImageName = async (imageId: string) => {
    const trimmedName = imageNameInput.trim()

    if (!trimmedName) {
      alert('Image name cannot be empty.')
      return
    }

    const currentImage = images.find(img => img.id === imageId)
    if (currentImage && currentImage.name === trimmedName) {
      cancelRenamingImage()
      return
    }

    try {
      setRenamingImageId(imageId)

      const response = await fetch(`/api/images/${imageId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: trimmedName })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to rename image')
      }

      setImages(prev =>
        prev.map(img =>
          img.id === imageId
            ? { ...img, name: result.data?.name ?? trimmedName }
            : img
        )
      )

      cancelRenamingImage()
    } catch (error) {
      console.error('❌ Failed to rename image:', error)
      alert(`Failed to rename image: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setRenamingImageId(null)
    }
  }

  const renderImageTitleSection = (image: UserImage) => {
    if (editingImageId === image.id) {
      return (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          <input
            value={imageNameInput}
            onChange={(event) => setImageNameInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault()
                saveImageName(image.id)
              }
              if (event.key === 'Escape') {
                event.preventDefault()
                cancelRenamingImage()
              }
            }}
            className="w-full rounded-full border-2 border-[#FFB3BA] px-4 py-2 text-sm font-semibold text-[#3A2E39] shadow-[4px_4px_0_0_#FF8A80] focus:outline-none focus:ring-2 focus:ring-[#FF6F91] sm:w-64"
            maxLength={120}
            aria-label="Image name"
          />
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => saveImageName(image.id)}
              disabled={renamingImageId === image.id}
              className="flex items-center gap-2 rounded-full border-2 border-[#A0E7E5] bg-white px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-[#1DB9B3] shadow-[4px_4px_0_0_#55C6C0] transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {renamingImageId === image.id ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Check className="h-3.5 w-3.5" />
              )}
              <span>{renamingImageId === image.id ? 'Saving' : 'Save'}</span>
            </button>
            <button
              type="button"
              onClick={cancelRenamingImage}
              className="flex items-center gap-2 rounded-full border-2 border-[#FFB3BA] bg-[#FFE6EB] px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-[#FF6F91] shadow-[4px_4px_0_0_#FF8A80] transition-transform hover:-translate-y-0.5"
            >
              <X className="h-3.5 w-3.5" />
              <span>Cancel</span>
            </button>
          </div>
        </div>
      )
    }

    return (
      <div className="flex items-center gap-2">
        <h3 className="max-w-[14rem] truncate text-lg font-extrabold text-[#3A2E39]">{image.name}</h3>
        <button
          type="button"
          onClick={() => startRenamingImage(image)}
          className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-[#FFB3BA] bg-[#FFE6EB] text-[#FF6F91] shadow-[4px_4px_0_0_#FF8A80] transition-transform hover:-translate-y-0.5"
          title="Rename"
        >
          <Pencil className="h-4 w-4" />
          <span className="sr-only">Rename image</span>
        </button>
      </div>
    )
  }

  const downloadColoringPage = (imageId: string, imageName: string) => {
    const link = document.createElement('a')
    link.href = `/api/download/${imageId}`
    link.download = `coloring-page-${imageName}`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const applyVariantAsPrimary = async (image: UserImage, variantUrl: string) => {
    const { error } = await supabase
      .from('images')
      .update({ coloring_page_url: variantUrl })
      .eq('id', image.id)

    if (error) {
      throw error
    }

    setImages(prev =>
      prev.map(img =>
        img.id === image.id
          ? { ...img, coloring_page_url: variantUrl }
          : img
      )
    )
  }

  if (authLoading || loading) {
    return (
      <FunBackground>
        <div className="flex min-h-screen items-center justify-center">
          <div className="rounded-[2.75rem] border-4 border-[#FFB3BA] bg-white/90 px-12 py-10 text-center shadow-[14px_14px_0_0_#FF8A80]">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full border-4 border-white bg-[#FF6F91] text-white shadow-inner">
              <Loader2 className="h-10 w-10 animate-spin" />
            </div>
            <p className="text-lg font-semibold text-[#3A2E39]">Loading your colorful dashboard...</p>
            <p className="mt-2 text-sm font-medium text-[#FF6F91]">
              Auth: {authLoading ? 'loading' : 'ready'} • Data: {loading ? 'loading' : 'ready'}
            </p>
          </div>
        </div>
      </FunBackground>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50">
      {/* Header */}
      <nav className="container mx-auto px-4 pt-2">
        <div className="relative overflow-hidden rounded-2xl border-2 border-[#FFB3BA] bg-white/90 px-4 py-3 shadow-[6px_6px_0_0_#FF8A80]">
          <div className="pointer-events-none absolute -top-16 left-6 h-28 w-28 rounded-full bg-[#FFD6E0]/70 blur-sm" aria-hidden="true" />
          <div className="pointer-events-none absolute -bottom-10 right-8 h-24 w-24 rounded-full bg-[#B4F8C8]/80 blur-[2px]" aria-hidden="true" />
          <div className="relative flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-col gap-2 text-center lg:flex-row lg:items-center lg:gap-3 lg:text-left">
              <button
                onClick={() => router.push('/')}
                className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-[#FF8BA7] bg-white/80 px-3 py-1.5 text-xs font-semibold text-[#FF6F91] shadow-[0_6px_0_0_rgba(255,143,188,0.5)] transition-transform hover:-translate-y-0.5 hover:shadow-[0_8px_0_0_rgba(255,143,188,0.55)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF8BA7]"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to playground
              </button>
              <div className="flex items-center justify-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-[#C3B5FF] to-[#FF8BA7] text-white shadow-[0_4px_0_0_rgba(255,139,167,0.35)]">
                  <Palette className="h-4.5 w-4.5" />
                </span>
                <div className="text-gray-800">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#FF8BA7]">Studio HQ</p>
                  <span className="text-lg font-extrabold text-[#3A2E39]">Dashboard</span>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2 lg:justify-end">
              {user?.email && (
                <span className="inline-flex items-center gap-2 rounded-full border-2 border-[#A0E7E5] bg-[#E0FBFC] px-3 py-1.5 text-sm font-medium text-[#3A2E39] shadow-[0_4px_0_0_rgba(160,231,229,0.6)]">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#55C6C0]" />
                  {user.email}
                </span>
              )}

              <button
                onClick={() => setShowFamilyAlbumCreator(true)}
                disabled={images.filter(img => img.status === 'completed').length === 0}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full border-2 border-[#B4F8C8] bg-[#E9FFE5] px-3 py-1.5 text-sm font-semibold text-[#2F9D66] shadow-[0_6px_0_0_rgba(180,248,200,0.5)] transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_0_0_rgba(180,248,200,0.55)] sm:w-auto disabled:translate-y-0 disabled:border-gray-200 disabled:bg-gray-100 disabled:text-gray-400 disabled:shadow-none"
              >
                <Users className="h-4 w-4" />
                <span>Family Album</span>
              </button>
              <button
                onClick={() => setShowPhotobookCreator(true)}
                disabled={images.filter(img => img.status === 'completed').length === 0}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full border-2 border-[#FFD166] bg-[#FFF3BF] px-3 py-1.5 text-sm font-semibold text-[#D96C00] shadow-[0_6px_0_0_rgba(255,209,102,0.55)] transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_0_0_rgba(255,209,102,0.6)] sm:w-auto disabled:translate-y-0 disabled:border-gray-200 disabled:bg-gray-100 disabled:text-gray-400 disabled:shadow-none"
              >
                <Book className="h-4 w-4" />
                <span>Create Photobook</span>
              </button>
              <button
                onClick={() => setShowUploader(true)}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full border-2 border-[#FF8BA7] bg-gradient-to-r from-[#FF8BA7] to-[#FF6F91] px-4 py-1.5 text-sm font-semibold text-white shadow-[0_8px_0_0_rgba(255,111,145,0.6)] transition-all hover:-translate-y-0.5 hover:shadow-[0_10px_0_0_rgba(255,111,145,0.65)] sm:w-auto"
              >
                <Plus className="h-4 w-4" />
                <span>Upload Photos</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 pb-10 pt-3">
        <div className="relative overflow-hidden rounded-2xl border-2 border-[#A0E7E5] bg-white/90 px-5 py-4 shadow-[6px_6px_0_0_#55C6C0]">
          <div className="pointer-events-none absolute -top-10 right-10 h-24 w-24 rounded-full bg-[#FF8A80]/70" aria-hidden="true" />
          <div className="pointer-events-none absolute -bottom-8 left-6 h-20 w-20 rounded-full bg-[#B4F8C8]/70" aria-hidden="true" />
          <div className="flex flex-col gap-4">
            <div className="max-w-3xl space-y-2.5">
              <div className="inline-flex items-center gap-1.5 rounded-full border-2 border-dashed border-[#FFD166] bg-[#FFF3BF] px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-[#E97777]">
                <Sparkles className="h-3.5 w-3.5" />
                Studio status
              </div>
              <h1 className="text-xl font-extrabold text-[#3A2E39] md:text-2xl">
                Your Coloring Pages Playground
              </h1>
              <p className="text-sm font-medium text-[#594144]">
                Keep track of every doodle-ready download, peek at works-in-progress, and build magical books for your crew.
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1.5 rounded-full border-2 border-dashed border-[#FFB3BA] bg-[#FFE6EB] px-3 py-1 text-xs font-semibold text-[#FF6F91] shadow-[3px_3px_0_0_#FF8A80]">
                  <Star className="h-3.5 w-3.5" />
                  {totalImages} creations
                </div>
                <div className="flex items-center gap-1.5 rounded-full border-2 border-dashed border-[#A0E7E5] bg-[#E0F7FA] px-3 py-1 text-xs font-semibold text-[#1DB9B3] shadow-[3px_3px_0_0_#55C6C0]">
                  <Paintbrush className="h-3.5 w-3.5" />
                  {completedCount} ready to color
                </div>
                {isProcessing && (
                  <div className="flex items-center gap-1.5 rounded-full border-2 border-dashed border-[#FFD166] bg-[#FFF3BF] px-3 py-1 text-xs font-semibold text-[#AA6A00] shadow-[3px_3px_0_0_#FFB84C]">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    {processingCount} brewing
                  </div>
                )}
                {(isProcessing || retryingProcessing) && (
                  <button
                    onClick={retryStuckImages}
                    disabled={!isProcessing || retryingProcessing}
                    className="flex items-center gap-1.5 rounded-full border-2 border-[#FFD166] bg-[#FFF3BF] px-3 py-1 text-xs font-semibold text-[#AA6A00] shadow-[3px_3px_0_0_#FFB84C] transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none"
                  >
                    <Loader2 className={`h-3.5 w-3.5 ${retryingProcessing ? 'animate-spin' : ''}`} />
                    Fix stuck pages
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        <section className="mt-4 space-y-4">
          <div className="flex items-center justify-center gap-3">
            <div className="inline-flex items-center gap-1 rounded-full border-2 border-[#FFB3BA] bg-white/95 p-1 shadow-[4px_4px_0_0_#FF8A80]">
              <button
                type="button"
                onClick={() => setViewMode('coloring')}
                className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-semibold transition-all ${
                  viewMode === 'coloring'
                    ? 'bg-[#FF6F91] text-white shadow-[3px_3px_0_0_#f2557b]'
                    : 'text-[#FF6F91] hover:bg-[#FFE6EB]'
                }`}
              >
                <Palette className="h-4 w-4" />
                Coloring pages
              </button>
              <button
                type="button"
                onClick={() => setViewMode('uploads')}
                className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-semibold transition-all ${
                  viewMode === 'uploads'
                    ? 'bg-[#55C6C0] text-white shadow-[3px_3px_0_0_#1DB9B3]'
                    : 'text-[#1DB9B3] hover:bg-[#E0F7FA]'
                }`}
              >
                <Images className="h-4 w-4" />
                Uploads
              </button>
            </div>

            {viewMode === 'coloring' && coloringDisplayItems.length > 0 && (
              <div className="inline-flex items-center gap-1 rounded-full border-2 border-[#FFB3BA] bg-white/95 p-1 shadow-[4px_4px_0_0_#FF8A80]">
                <button
                  type="button"
                  onClick={() => setLayoutMode('expanded')}
                  className={`flex items-center justify-center rounded-full p-2 transition-all ${
                    layoutMode === 'expanded'
                      ? 'bg-[#FF6F91] text-white shadow-[3px_3px_0_0_#f2557b]'
                      : 'text-[#FF6F91] hover:bg-[#FFE6EB]'
                  }`}
                  title="Expanded view"
                >
                  <LayoutGrid className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setLayoutMode('compact')}
                  className={`flex items-center justify-center rounded-full p-2 transition-all ${
                    layoutMode === 'compact'
                      ? 'bg-[#FF6F91] text-white shadow-[3px_3px_0_0_#f2557b]'
                      : 'text-[#FF6F91] hover:bg-[#FFE6EB]'
                  }`}
                  title="Compact view"
                >
                  <Grid3x3 className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>

          {viewMode === 'coloring' ? (
            coloringDisplayItems.length === 0 ? (
              <div className="mx-auto max-w-2xl">
                <div className="relative overflow-hidden rounded-2xl border-2 border-[#FFB3BA] bg-white/90 p-8 text-center shadow-[6px_6px_0_0_#FF8A80]">
                  <div className="pointer-events-none absolute -top-10 right-10 h-20 w-20 rounded-full bg-[#FF8A80]/40" aria-hidden="true" />
                  <div className="pointer-events-none absolute -bottom-8 left-8 h-20 w-20 rounded-full bg-[#A0E7E5]/40" aria-hidden="true" />
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border-2 border-white bg-[#FF6F91] text-white shadow-inner">
                    <Palette className="h-7 w-7" />
                  </div>
                  <h3 className="mb-2 text-xl font-bold text-gray-800">No coloring pages yet</h3>
                  <p className="mb-4 text-sm text-gray-600">Upload photos or explore uploads to start creating pages.</p>
                  <button
                    onClick={() => setShowUploader(true)}
                    className="inline-flex items-center gap-2 rounded-full border-2 border-[#FFB3BA] bg-[#FF6F91] px-5 py-2 text-sm font-semibold text-white shadow-[3px_3px_0_0_#f2557b] transition-transform hover:-translate-y-0.5"
                  >
                    <Plus className="h-4 w-4" />
                    Upload photos
                  </button>
                </div>
              </div>
            ) : (
              <div className={layoutMode === 'compact'
                ? 'grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6'
                : 'grid grid-cols-2 gap-6 lg:grid-cols-3'
              }>
                {coloringDisplayItems.map((item) =>
                  layoutMode === 'compact' ? (
                    /* ── Compact card ── */
                    <div
                      key={item.displayId}
                      className={`group relative overflow-hidden rounded-2xl border-2 bg-white/90 transition-all hover:-translate-y-0.5 hover:shadow-lg ${
                        item.isVariant
                          ? 'border-[#C3B5FF]'
                          : 'border-[#FFB3BA]'
                      }`}
                    >
                      <div className="relative aspect-square overflow-hidden bg-gray-100">
                        <img src={item.coloringPageUrl} alt={item.name} className="h-full w-full object-cover" />

                        {/* Hover overlay with quick actions */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-[#3A2E39]/60 opacity-0 backdrop-blur-[2px] transition-opacity group-hover:opacity-100">
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => setActiveDrawingImage({ ...item.parentImage, coloring_page_url: item.coloringPageUrl })}
                              className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white/80 bg-white/90 text-[#1DB9B3] transition-transform hover:scale-110"
                              title="Color"
                            >
                              <Paintbrush className="h-3.5 w-3.5" />
                            </button>
                            <a
                              href={item.coloringPageUrl}
                              download={`coloring-page-${item.name}${item.isVariant ? '-variant' : ''}.png`}
                              className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white/80 bg-[#FF6F91] text-white transition-transform hover:scale-110"
                              title="Download"
                            >
                              <Download className="h-3.5 w-3.5" />
                            </a>
                            <button
                              onClick={() => toggleFavorite(item.id, item.isFavorite)}
                              className={`flex h-8 w-8 items-center justify-center rounded-full border-2 border-white/80 transition-transform hover:scale-110 ${
                                item.isFavorite
                                  ? 'bg-[#FF6F91] text-white'
                                  : 'bg-white/90 text-[#FF6F91]'
                              }`}
                              title={item.isFavorite ? 'Unfavorite' : 'Favorite'}
                            >
                              <Heart className={`h-3.5 w-3.5 ${item.isFavorite ? 'fill-current' : ''}`} />
                            </button>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => setVariantsImage(item.parentImage)}
                              className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white/80 bg-white/90 text-[#6C63FF] transition-transform hover:scale-110"
                              title="Variants"
                            >
                              <Images className="h-3.5 w-3.5" />
                            </button>
                            {!item.isVariant && (
                              <>
                                <button
                                  onClick={() => setRegenerateImage(item.parentImage)}
                                  className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white/80 bg-white/90 text-[#AA6A00] transition-transform hover:scale-110"
                                  title="Regenerate"
                                >
                                  <RotateCcw className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={() => archiveImage(item.id)}
                                  className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white/80 bg-white/90 text-[#FF6F91] transition-transform hover:scale-110"
                                  title="Archive"
                                >
                                  <Archive className="h-3.5 w-3.5" />
                                </button>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Bottom name strip */}
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#3A2E39]/80 to-transparent px-2.5 pb-2 pt-6">
                          <p className="truncate text-xs font-bold text-white drop-shadow-sm">{item.name}</p>
                        </div>

                        <button
                          onClick={(e) => { e.stopPropagation(); toggleFavorite(item.id, item.isFavorite) }}
                          className={`absolute right-1.5 top-1.5 z-10 flex h-7 w-7 items-center justify-center rounded-full border-2 transition-transform hover:scale-110 ${
                            item.isFavorite
                              ? 'border-[#FF6F91] bg-[#FF6F91] text-white shadow-sm'
                              : 'border-white/80 bg-white/70 text-[#FF6F91] opacity-0 shadow-sm backdrop-blur-sm group-hover:opacity-100'
                          }`}
                          title={item.isFavorite ? 'Unfavorite' : 'Favorite'}
                        >
                          <Heart className={`h-3.5 w-3.5 ${item.isFavorite ? 'fill-current' : ''}`} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* ── Expanded card (original) ── */
                    <div
                      key={item.displayId}
                      className={`relative overflow-hidden rounded-2xl border-2 bg-white/90 shadow-[6px_6px_0_0] transition-transform hover:-translate-y-1 ${
                        item.isVariant
                          ? 'border-[#C3B5FF] shadow-[#A599E9]'
                          : 'border-[#FFB3BA] shadow-[#FF8A80]'
                      }`}
                    >
                      <div className="aspect-[4/3] max-h-64 overflow-hidden bg-gray-100">
                        <img src={item.coloringPageUrl} alt={item.name} className="h-full w-full object-cover" />
                      </div>
                      <div className="space-y-3 p-4">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 space-y-1">
                            <h3 className="max-w-[14rem] truncate text-base font-extrabold text-[#3A2E39]">{item.name}</h3>
                            {item.isVariant && item.variantPrompt && (
                              <p className="text-sm font-medium text-[#6C63FF] line-clamp-2">{item.variantPrompt}</p>
                            )}
                            <p className="text-sm font-medium text-[#594144]/70">{formatImageDate(item.createdAt)}</p>
                          </div>
                          {item.isVariant ? (
                            <span className="rounded-full border-2 border-[#C3B5FF] bg-[#F6F3FF] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#6C63FF]">
                              Variant
                            </span>
                          ) : (
                            <span className="rounded-full border-2 border-[#A0E7E5] bg-[#E0F7FA] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#1DB9B3]">
                              Ready!
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              onClick={() => setActiveDrawingImage({ ...item.parentImage, coloring_page_url: item.coloringPageUrl })}
                              className="flex items-center gap-2 rounded-full border-2 border-[#A0E7E5] bg-white px-3 py-1.5 text-xs font-semibold text-[#1DB9B3] shadow-[3px_3px_0_0_#55C6C0] transition-transform hover:-translate-y-0.5"
                            >
                              <Paintbrush className="h-3.5 w-3.5" />
                              Color
                            </button>
                            <a
                              href={item.coloringPageUrl}
                              download={`coloring-page-${item.name}${item.isVariant ? '-variant' : ''}.png`}
                              className="flex items-center gap-2 rounded-full border-2 border-[#FFB3BA] bg-[#FF6F91] px-3 py-1.5 text-xs font-semibold text-white shadow-[3px_3px_0_0_#f2557b] transition-transform hover:-translate-y-0.5"
                            >
                              <Download className="h-4 w-4" />
                              Download
                            </a>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setVariantsImage(item.parentImage)}
                              className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#C3B5FF] bg-[#F6F3FF] text-[#6C63FF] shadow-[3px_3px_0_0_#A599E9] transition-transform hover:-translate-y-0.5"
                              title="Variants studio"
                            >
                              <Images className="h-4 w-4" />
                            </button>
                            {!item.isVariant && (
                              <>
                                <button
                                  onClick={() => toggleFavorite(item.id, item.isFavorite)}
                                  className={`flex h-8 w-8 items-center justify-center rounded-full border-2 shadow-[3px_3px_0_0] transition-transform hover:-translate-y-0.5 ${
                                    item.isFavorite
                                      ? 'border-[#FF6F91] bg-[#FF6F91] text-white shadow-[#f2557b]'
                                      : 'border-[#FFB3BA] bg-white text-[#FF6F91] shadow-[#FF8A80]'
                                  }`}
                                  title={item.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                                >
                                  <Heart className={`h-4 w-4 ${item.isFavorite ? 'fill-current' : ''}`} />
                                </button>
                                <button
                                  onClick={() => setRegenerateImage(item.parentImage)}
                                  className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#FFD166] bg-[#FFF3BF] text-[#AA6A00] shadow-[3px_3px_0_0_#FFB84C] transition-transform hover:-translate-y-0.5"
                                  title="Regenerate"
                                >
                                  <RotateCcw className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={() => archiveImage(item.id)}
                                  className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#FFB3BA] bg-[#FFE6EB] text-[#FF6F91] shadow-[3px_3px_0_0_#FF8A80] transition-transform hover:-translate-y-0.5"
                                  title="Archive"
                                >
                                  <Archive className="h-4 w-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                )}
              </div>
            )
          ) : sortedUploadsViewImages.length === 0 ? (
            <div className="mx-auto max-w-2xl">
              <div className="relative overflow-hidden rounded-2xl border-2 border-[#A0E7E5] bg-white/90 p-8 text-center shadow-[6px_6px_0_0_#55C6C0]">
                <div className="pointer-events-none absolute -top-10 right-10 h-20 w-20 rounded-full bg-[#55C6C0]/40" aria-hidden="true" />
                <div className="pointer-events-none absolute -bottom-8 left-8 h-20 w-20 rounded-full bg-[#FFB3BA]/40" aria-hidden="true" />
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border-2 border-white bg-[#55C6C0] text-white shadow-inner">
                  <Images className="h-7 w-7" />
                </div>
                <h3 className="mb-2 text-xl font-bold text-gray-800">No uploads yet</h3>
                <p className="mb-4 text-sm text-gray-600">Drop in photos to start building your variant library.</p>
                <button
                  onClick={() => setShowUploader(true)}
                  className="inline-flex items-center gap-2 rounded-full border-2 border-[#55C6C0] bg-[#55C6C0] px-5 py-2 text-sm font-semibold text-white shadow-[3px_3px_0_0_#1DB9B3] transition-transform hover:-translate-y-0.5"
                >
                  <Plus className="h-4 w-4" />
                  Upload photos
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
              {sortedUploadsViewImages.map((image) => {
                const variantSummaries = getVariantSummaries(image)
                return (
                  <div
                    key={image.id}
                    className="relative overflow-hidden rounded-2xl border-2 border-[#A0E7E5] bg-white/90 shadow-[6px_6px_0_0_#55C6C0] transition-transform hover:-translate-y-1"
                  >
                    <div className="relative aspect-[4/3] max-h-64 overflow-hidden bg-gray-100">
                      <img src={image.original_url} alt={image.name} className="h-full w-full object-cover" />
                      {image.status === 'processing' && (
                        <div className="absolute inset-0 flex items-center justify-center gap-2 bg-[#3A2E39]/40 text-sm font-semibold text-white backdrop-blur-[1px]">
                          <Loader2 className="h-5 w-5 animate-spin" />
                          Processing
                        </div>
                      )}
                    </div>
                    <div className="space-y-3 p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 space-y-1">
                          {renderImageTitleSection(image)}
                          <p className="text-sm font-medium text-[#594144]/70">{formatImageDate(image.created_at)}</p>
                        </div>
                        {image.status === 'completed' && image.coloring_page_url ? (
                          <span className="rounded-full border-2 border-[#A0E7E5] bg-[#E0F7FA] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#1DB9B3]">
                            Coloring ready
                          </span>
                        ) : (
                          <span className="rounded-full border-2 border-dashed border-[#FFD166] bg-[#FFF3BF] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#AA6A00]">
                            {image.status}
                          </span>
                        )}
                      </div>

                      {(image.variant_urls?.length || 0) > 0 && (
                        <div className="inline-flex items-center gap-1 rounded-full border-2 border-[#C3B5FF] bg-[#F6F3FF] px-3 py-1 text-[11px] font-semibold text-[#6C63FF]">
                          <Images className="h-3 w-3" />
                          {image.variant_urls!.length} stored variant{image.variant_urls!.length === 1 ? '' : 's'}
                        </div>
                      )}

                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          onClick={() => setVariantsImage(image)}
                          className="flex flex-1 items-center justify-center gap-2 rounded-full border-2 border-[#6C63FF] bg-[#6C63FF] px-3 py-1.5 text-xs font-semibold text-white shadow-[3px_3px_0_0_#5650E0] transition-transform hover:-translate-y-0.5"
                        >
                          <Images className="h-3.5 w-3.5" />
                          Variants studio
                        </button>
                        <button
                          onClick={() => setPromptRemixImage(image)}
                          className="flex flex-1 items-center justify-center gap-2 rounded-full border-2 border-[#FFD166] bg-[#FFF3BF] px-3 py-1.5 text-xs font-semibold text-[#AA6A00] shadow-[3px_3px_0_0_#FFB84C] transition-transform hover:-translate-y-0.5"
                        >
                          <Sparkles className="h-4 w-4" />
                          Scene prompts
                        </button>
                      </div>

                      {image.coloring_page_url && (
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            onClick={() => setActiveDrawingImage(image)}
                            className="flex items-center gap-2 rounded-full border-2 border-[#A0E7E5] bg-white px-3 py-1.5 text-xs font-semibold text-[#1DB9B3] shadow-[3px_3px_0_0_#55C6C0] transition-transform hover:-translate-y-0.5"
                          >
                            <Paintbrush className="h-3.5 w-3.5" />
                            Open coloring page
                          </button>
                          <button
                            onClick={() => downloadColoringPage(image.id, image.name)}
                            className="flex items-center gap-2 rounded-full border-2 border-[#FFB3BA] bg-[#FF6F91] px-3 py-1.5 text-xs font-semibold text-white shadow-[3px_3px_0_0_#f2557b] transition-transform hover:-translate-y-0.5"
                          >
                            <Download className="h-4 w-4" />
                            Download page
                          </button>
                        </div>
                      )}

                      {variantSummaries.length > 0 && (
                        <div className="space-y-3">
                          <p className="text-xs font-semibold uppercase tracking-wide text-[#6C63FF]">Saved variants</p>
                          <div className="grid grid-cols-3 gap-2">
                            {variantSummaries.slice(0, 3).map((variant) => (
                              <button
                                key={variant.url}
                                onClick={() => setVariantsImage(image)}
                                className="group relative overflow-hidden rounded-xl border-2 border-[#C3B5FF]/60 bg-[#F6F3FF]"
                                type="button"
                              >
                                <img src={variant.url} alt={variant.prompt} className="h-20 w-full object-cover" />
                                <div className="absolute inset-0 flex items-center justify-center bg-[#6C63FF]/70 text-xs font-semibold text-white opacity-0 transition group-hover:opacity-100">
                                  View
                                </div>
                              </button>
                            ))}
                          </div>
                          {variantSummaries.length > 3 && (
                            <p className="text-xs font-semibold text-[#6C63FF]">
                              +{variantSummaries.length - 3} more variant{variantSummaries.length - 3 === 1 ? '' : 's'} saved
                            </p>
                          )}
                        </div>
                      )}

                      <div className="flex items-center justify-between gap-2">
                        <p className="text-[10px] font-semibold text-[#594144]/60">Last updated {formatImageDate(image.created_at)}</p>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => toggleFavorite(image.id, image.is_favorite ?? false)}
                            className={`flex h-8 w-8 items-center justify-center rounded-full border-2 shadow-[3px_3px_0_0] transition-transform hover:-translate-y-0.5 ${
                              image.is_favorite
                                ? 'border-[#FF6F91] bg-[#FF6F91] text-white shadow-[#f2557b]'
                                : 'border-[#FFB3BA] bg-white text-[#FF6F91] shadow-[#FF8A80]'
                            }`}
                            title={image.is_favorite ? 'Remove from favorites' : 'Add to favorites'}
                          >
                            <Heart className={`h-4 w-4 ${image.is_favorite ? 'fill-current' : ''}`} />
                          </button>
                          {image.status === 'completed' && image.coloring_page_url && (
                            <button
                              onClick={() => setRegenerateImage(image)}
                              className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#FFD166] bg-[#FFF3BF] text-[#AA6A00] shadow-[3px_3px_0_0_#FFB84C] transition-transform hover:-translate-y-0.5"
                              title="Regenerate coloring page"
                            >
                              <RotateCcw className="h-3.5 w-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => archiveImage(image.id)}
                            className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#FFB3BA] bg-[#FFE6EB] text-[#FF6F91] shadow-[3px_3px_0_0_#FF8A80] transition-transform hover:-translate-y-0.5"
                            title="Archive upload"
                          >
                            <Archive className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>
      </main>

      {showUploader && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-[#3A2E39]/40 backdrop-blur-sm">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative w-full max-w-4xl">
              <div className="pointer-events-none absolute -inset-6 rounded-[3rem] bg-gradient-to-br from-[#FFB3BA]/40 via-[#FFD166]/40 to-[#9BF6FF]/40 blur-2xl" aria-hidden="true" />
              <div className="relative overflow-hidden rounded-2xl border-2 border-[#FFB3BA] bg-[#FFF5D6]/95 p-6 shadow-[8px_8px_0_0_#FF8A80]">
                <div className="max-h-[90vh] overflow-y-auto pr-2 sm:pr-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="inline-flex items-center gap-2 rounded-full border-2 border-dashed border-[#FFD166] bg-[#FFF3BF] px-3 py-1 text-xs font-semibold uppercase tracking-widest text-[#E97777]">
                        <Sparkles className="h-3 w-3" />
                        Upload station
                      </p>
                      <h2 className="mt-3 text-2xl font-extrabold text-[#3A2E39]">Upload Photos</h2>
                      <p className="text-sm font-medium text-[#594144]">Drop in your favorite snapshots and we will turn them into coloring adventures.</p>
                    </div>
                    <button
                      onClick={() => setShowUploader(false)}
                      className="rounded-full border-2 border-[#FFB3BA] bg-white px-3 py-2 text-[#FF6F91] shadow-[4px_4px_0_0_#FF8A80] transition-transform hover:-translate-y-0.5"
                      aria-label="Close uploader"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="mt-5">
                    <ImageUploader
                      onUploadComplete={() => {
                        setShowUploader(false)
                        fetchUserImages()
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showFamilyAlbumCreator && (
        <FamilyAlbumCreator
          images={images}
          onClose={() => setShowFamilyAlbumCreator(false)}
        />
      )}

      {showPhotobookCreator && (
        <PhotobookCreator
          images={images}
          onClose={() => setShowPhotobookCreator(false)}
        />
      )}

      {regenerateImage && (
        <RegenerateModal
          isOpen={true}
          onClose={() => setRegenerateImage(null)}
          imageId={regenerateImage.id}
          imageName={regenerateImage.name}
          currentColoringPageUrl={regenerateImage.coloring_page_url || ''}
          onRegenerateComplete={(regeneratedUrl) => {
            setImages(prev =>
              prev.map(img =>
                img.id === regenerateImage.id
                  ? { ...img, coloring_page_url: regeneratedUrl }
                  : img
              )
            )
            setRegenerateImage(null)
          }}
        />
      )}

      {activeDrawingImage && activeDrawingImage.coloring_page_url && (
        <ColoringCanvasModal
          imageUrl={activeDrawingImage.coloring_page_url}
          imageName={activeDrawingImage.name}
          onClose={() => setActiveDrawingImage(null)}
        />
      )}

      {variantsImage && (
        <VariantsModal
          isOpen={true}
          onClose={() => setVariantsImage(null)}
          imageId={variantsImage.id}
          imageName={variantsImage.name}
          originalUrl={variantsImage.original_url}
          variants={getVariantSummaries(variantsImage)}
          onVariantsUpdated={(updatedVariants) => {
            if (!variantsImage) {
              return
            }

            const imageId = variantsImage.id
            const urls = updatedVariants.map(variant => variant.url)
            const prompts = updatedVariants.map(variant => variant.prompt)

            setImages(prev =>
              prev.map(img =>
                img.id === imageId
                  ? { ...img, variant_urls: urls, variant_prompts: prompts }
                  : img
              )
            )

            setVariantsImage(prev =>
              prev
                ? { ...prev, variant_urls: urls, variant_prompts: prompts }
                : prev
            )
          }}
          onUseVariant={async (variantUrl) => {
            if (!variantsImage) {
              return
            }

            await applyVariantAsPrimary(variantsImage, variantUrl)
            setVariantsImage(prev =>
              prev ? { ...prev, coloring_page_url: variantUrl } : prev
            )
          }}
        />
      )}

      {promptRemixImage && (
        <PromptRemixModal
          isOpen={true}
          onClose={() => setPromptRemixImage(null)}
          imageName={promptRemixImage.name}
          imageUrl={promptRemixImage.original_url}
        />
      )}
    </div>
  )
}
