'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { PhotobookCreator } from '@/components/PhotobookCreator'
import { FamilyAlbumCreator } from '@/components/FamilyAlbumCreator'
import { RegenerateModal } from '@/components/RegenerateModal'
import ImageUploader from '@/components/ImageUploader'
import { FunBackground } from '@/components/FunBackground'
import {
  Palette,
  Plus,
  Download,
  Trash2,
  ArrowLeft,
  Loader2,
  RefreshCw,
  Book,
  Users,
  RotateCcw,
  Paintbrush,
  Sparkles,
  Star,
} from 'lucide-react'
import { ColoringCanvasModal } from '@/components/ColoringCanvasModal'
import { PromptRemixModal } from '@/components/PromptRemixModal'

interface UserImage {
  id: string
  name: string
  original_url: string
  coloring_page_url?: string
  status: 'processing' | 'completed' | 'error'
  created_at: string
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

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [images, setImages] = useState<UserImage[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [showPhotobookCreator, setShowPhotobookCreator] = useState(false)
  const [showFamilyAlbumCreator, setShowFamilyAlbumCreator] = useState(false)
  const [showUploader, setShowUploader] = useState(false)
  const [regenerateImage, setRegenerateImage] = useState<UserImage | null>(null)
  const [retryingProcessing, setRetryingProcessing] = useState(false)
  const [activeDrawingImage, setActiveDrawingImage] = useState<UserImage | null>(null)
  const [promptRemixImage, setPromptRemixImage] = useState<UserImage | null>(null)

  const totalImages = images.length
  const completedCount = images.filter(img => img.status === 'completed' && img.coloring_page_url).length
  const processingCount = images.filter(img => img.status === 'processing').length
  const hasCompletedImages = completedCount > 0
  const isProcessing = processingCount > 0

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/')
      return
    }

    if (user) {
      fetchUserImages()
      
      // Set up real-time subscription for image updates (with fallback handling)
      let subscription: any = null
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
              filter: `user_id=eq.${user.id}`,
            },
            (payload) => {
              console.log('🔄 Real-time image update received:', payload)
              console.log('📊 Updated record:', payload.new)
              fetchUserImages()
            }
          )
          .subscribe((status) => {
            console.log('📡 Real-time subscription status:', status)
            if (status === 'SUBSCRIBED') {
              console.log('✅ Successfully subscribed to real-time updates')
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
              .eq('user_id', user.id)
            
            const hasProcessingImages = data?.some(img => img.status === 'processing')
            
            // Poll more frequently if real-time isn't working or there are processing images
            if (!isRealTimeWorking || hasProcessingImages) {
              console.log('🔄 Polling for updates', hasProcessingImages ? '(processing images)' : '(no real-time)')
              fetchUserImages()
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
        if (subscription) {
          subscription.unsubscribe()
        }
        clearTimeout(pollInterval)
      }
    }
  }, [user, authLoading, router])

  const fetchUserImages = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true)
      }
      console.log('📸 Fetching images for user:', user?.id)
      
      if (!user?.id) {
        console.error('❌ No user ID available for fetching images')
        return
      }

      const { data, error } = await supabase
        .from('images')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('❌ Error fetching images:', error)
        throw error
      }

      console.log('✅ Fetched images:', data?.length || 0)
      console.log('🔍 Raw image data:', data)
      console.log('🔍 Image statuses:', data?.map(img => ({ 
        id: img.id.substring(0, 8), 
        name: img.name, 
        status: img.status, 
        hasColoringPage: !!img.coloring_page_url,
        original_url: img.original_url,
        coloring_page_url: img.coloring_page_url
      })))
      
      setImages(data || [])
    } catch (error) {
      console.error('💥 Failed to fetch images:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const deleteImage = async (imageId: string) => {
    try {
      console.log('🗑️ Deleting image:', imageId)
      
      const response = await fetch(`/api/images/${imageId}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete image')
      }
      
      console.log('✅ Image deleted successfully via API')
      
      // Update local state
      setImages(prev => prev.filter(img => img.id !== imageId))
      
    } catch (error) {
      console.error('❌ Failed to delete image:', error)
      // Show user-friendly error
      alert(`Failed to delete image: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const retryStuckImages = async () => {
    setRetryingProcessing(true)
    console.log('🔄 Retrying stuck processing images...')

    try {
      const response = await fetch('/api/retry-processing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user?.id
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to retry processing')
      }

      const result = await response.json()
      console.log('✅ Retry processing result:', result)
      
      // Refresh the images after retry
      await fetchUserImages(true)
      
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

  if (authLoading || loading) {
    console.log('🔄 Dashboard loading state:', { authLoading, loading, user: !!user })
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
      <nav className="container mx-auto px-4 py-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-3 text-center lg:flex-row lg:items-center lg:gap-4 lg:text-left">
            <button
              onClick={() => router.push('/')}
              className="text-gray-600 hover:text-gray-800 flex items-center justify-center lg:justify-start"
            >
              <ArrowLeft className="h-5 w-5" />
              Back to playground
            </button>
            <div className="flex items-center justify-center gap-2">
              <Palette className="w-8 h-8 text-purple-600" />
              <span className="text-2xl font-bold text-gray-800">Dashboard</span>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 lg:justify-end">
            <span className="text-sm text-gray-600 text-center lg:text-left">{user?.email}</span>
            <button
              onClick={() => fetchUserImages(true)}
              disabled={refreshing}
              className="text-gray-600 hover:text-gray-800 p-2 rounded-full transition-colors flex items-center justify-center"
              title="Refresh"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={() => setShowFamilyAlbumCreator(true)}
              disabled={images.filter(img => img.status === 'completed').length === 0}
              className="w-full sm:w-auto text-green-600 hover:text-green-700 px-4 py-2 rounded-full font-medium transition-colors flex items-center justify-center gap-2 disabled:text-gray-400"
            >
              <Users className="w-4 h-4" />
              <span>Family Album</span>
            </button>
            <button
              onClick={() => setShowPhotobookCreator(true)}
              disabled={images.filter(img => img.status === 'completed').length === 0}
              className="w-full sm:w-auto text-purple-600 hover:text-purple-700 px-4 py-2 rounded-full font-medium transition-colors flex items-center justify-center gap-2 disabled:text-gray-400"
            >
              <Book className="w-4 h-4" />
              <span>Create Photobook</span>
            </button>
            <button
              onClick={() => setShowUploader(true)}
              className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-full font-medium transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Upload Photos</span>
            </button>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 pb-24 pt-12">
        <div className="relative overflow-hidden rounded-[3rem] border-4 border-[#A0E7E5] bg-white/90 px-8 py-10 shadow-[18px_18px_0_0_#55C6C0]">
          <div className="pointer-events-none absolute -top-10 right-10 h-24 w-24 rounded-full bg-[#FF8A80]/70" aria-hidden="true" />
          <div className="pointer-events-none absolute -bottom-8 left-6 h-20 w-20 rounded-full bg-[#B4F8C8]/70" aria-hidden="true" />
          <div className="flex flex-col gap-10 md:flex-row md:items-center md:justify-between">
            <div className="max-w-2xl space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border-4 border-dashed border-[#FFD166] bg-[#FFF3BF] px-6 py-3 text-sm font-bold uppercase tracking-widest text-[#E97777]">
                <Sparkles className="h-4 w-4" />
                Studio status
              </div>
              <h1 className="text-4xl font-extrabold text-[#3A2E39] md:text-5xl">
                Your Coloring Pages Playground
              </h1>
              <p className="text-lg font-medium text-[#594144]">
                Keep track of every doodle-ready download, peek at works-in-progress, and build magical books for your crew.
              </p>
              <div className="flex flex-wrap gap-3">
                <div className="flex items-center gap-2 rounded-full border-4 border-dashed border-[#FFB3BA] bg-[#FFE6EB] px-4 py-2 text-sm font-semibold text-[#FF6F91] shadow-[6px_6px_0_0_#FF8A80]">
                  <Star className="h-4 w-4" />
                  {totalImages} creations
                </div>
                <div className="flex items-center gap-2 rounded-full border-4 border-dashed border-[#A0E7E5] bg-[#E0F7FA] px-4 py-2 text-sm font-semibold text-[#1DB9B3] shadow-[6px_6px_0_0_#55C6C0]">
                  <Paintbrush className="h-4 w-4" />
                  {completedCount} ready to color
                </div>
                {isProcessing && (
                  <div className="flex items-center gap-2 rounded-full border-4 border-dashed border-[#FFD166] bg-[#FFF3BF] px-4 py-2 text-sm font-semibold text-[#AA6A00] shadow-[6px_6px_0_0_#FFB84C]">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {processingCount} brewing
                  </div>
                )}
              </div>
            </div>
            <div className="flex w-full flex-col gap-3 rounded-[2rem] border-4 border-[#FFB3BA] bg-[#FFE6EB]/80 p-6 shadow-[12px_12px_0_0_#FF8A80] md:max-w-xs">
              <p className="text-center text-sm font-semibold uppercase tracking-widest text-[#FF6F91]">Quick actions</p>
              <button
                onClick={() => setShowUploader(true)}
                className="flex items-center justify-center gap-2 rounded-full border-4 border-[#FFB3BA] bg-[#FF6F91] px-4 py-3 text-sm font-semibold text-white shadow-[6px_6px_0_0_#f2557b] transition-transform hover:-translate-y-0.5"
              >
                <Plus className="h-4 w-4" />
                Upload new memories
              </button>
              <button
                onClick={() => fetchUserImages(true)}
                disabled={refreshing}
                className="flex items-center justify-center gap-2 rounded-full border-4 border-[#A0E7E5] bg-[#E0F7FA] px-4 py-3 text-sm font-semibold text-[#1DB9B3] shadow-[6px_6px_0_0_#55C6C0] transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh gallery
              </button>
              <button
                onClick={retryStuckImages}
                disabled={!isProcessing || retryingProcessing}
                className="flex items-center justify-center gap-2 rounded-full border-4 border-[#FFD166] bg-[#FFF3BF] px-4 py-3 text-sm font-semibold text-[#AA6A00] shadow-[6px_6px_0_0_#FFB84C] transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none"
              >
                <Loader2 className={`h-4 w-4 ${retryingProcessing ? 'animate-spin' : ''}`} />
                Fix stuck pages
              </button>
              <button
                onClick={() => setShowFamilyAlbumCreator(true)}
                disabled={!hasCompletedImages}
                className="flex items-center justify-center gap-2 rounded-full border-4 border-[#FFB3BA] bg-white px-4 py-3 text-sm font-semibold text-[#FF6F91] shadow-[6px_6px_0_0_#FF8A80] transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none"
              >
                <Users className="h-4 w-4" />
                Build family album
              </button>
              <button
                onClick={() => setShowPhotobookCreator(true)}
                disabled={!hasCompletedImages}
                className="flex items-center justify-center gap-2 rounded-full border-4 border-[#A0E7E5] bg-[#55C6C0] px-4 py-3 text-sm font-semibold text-white shadow-[6px_6px_0_0_#1DB9B3] transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none"
              >
                <Book className="h-4 w-4" />
                Create photobook
              </button>
            </div>
          </div>
        </div>

        <section className="mt-16 space-y-8">
          {images.length === 0 ? (
            <div className="mx-auto max-w-2xl">
              <div className="relative overflow-hidden rounded-[3rem] border-4 border-[#FFB3BA] bg-white/90 p-12 text-center shadow-[18px_18px_0_0_#FF8A80]">
                <div className="pointer-events-none absolute -top-10 right-10 h-24 w-24 rounded-full bg-[#FF8A80]/40" aria-hidden="true" />
                <div className="pointer-events-none absolute -bottom-8 left-8 h-24 w-24 rounded-full bg-[#A0E7E5]/40" aria-hidden="true" />
                <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full border-4 border-white bg-[#FF6F91] text-white shadow-inner">
                  <Palette className="h-10 w-10" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-3">No coloring pages yet</h3>
                <p className="text-gray-600 mb-6">Upload some photos to get started!</p>
                <button
                  onClick={() => setShowUploader(true)}
                  className="inline-flex items-center gap-2 rounded-full border-4 border-[#FFB3BA] bg-[#FF6F91] px-6 py-3 text-sm font-semibold text-white shadow-[6px_6px_0_0_#f2557b] transition-transform hover:-translate-y-0.5"
                >
                  <Plus className="h-4 w-4" />
                  Upload Photos
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {images.map((image) => (
                <div
                  key={image.id}
                  className="relative overflow-hidden rounded-[2.5rem] border-4 border-[#FFB3BA] bg-white/90 shadow-[12px_12px_0_0_#FF8A80] transition-transform hover:-translate-y-1"
                >
                  {image.coloring_page_url && (
                    <div className="aspect-square overflow-hidden bg-gray-100">
                      <img
                        src={image.coloring_page_url}
                        alt={image.name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  )}
                  <div className="p-6 space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="max-w-[14rem] truncate text-lg font-extrabold text-[#3A2E39]">{image.name}</h3>
                        <p className="text-sm font-medium text-[#594144]/70">
                          {formatImageDate(image.created_at)}
                        </p>
                      </div>
                      {image.status === 'completed' && image.coloring_page_url ? (
                        <span className="rounded-full border-4 border-[#A0E7E5] bg-[#E0F7FA] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#1DB9B3]">
                          Ready!
                        </span>
                      ) : (
                        <span className="rounded-full border-4 border-dashed border-[#FFD166] bg-[#FFF3BF] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#AA6A00]">
                          {image.status}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3">
                      {image.status === 'completed' && image.coloring_page_url ? (
                        <div className="flex flex-wrap items-center gap-3">
                          <button
                            onClick={() => setActiveDrawingImage(image)}
                            className="flex items-center gap-2 rounded-full border-4 border-[#A0E7E5] bg-white px-4 py-2 text-sm font-semibold text-[#1DB9B3] shadow-[6px_6px_0_0_#55C6C0] transition-transform hover:-translate-y-0.5"
                          >
                            <Paintbrush className="h-4 w-4" />
                            Color
                          </button>
                          <button
                            onClick={() => setPromptRemixImage(image)}
                            className="flex items-center gap-2 rounded-full border-4 border-[#FFD166] bg-[#FFF3BF] px-4 py-2 text-sm font-semibold text-[#AA6A00] shadow-[6px_6px_0_0_#FFB84C] transition-transform hover:-translate-y-0.5"
                          >
                            <Sparkles className="h-4 w-4" />
                            Remix
                          </button>
                          <button
                            onClick={() => {
                              const link = document.createElement('a')
                              link.href = `/api/download/${image.id}`
                              link.download = `coloring-page-${image.name}`
                              document.body.appendChild(link)
                              link.click()
                              document.body.removeChild(link)
                            }}
                            className="flex items-center gap-2 rounded-full border-4 border-[#FFB3BA] bg-[#FF6F91] px-4 py-2 text-sm font-semibold text-white shadow-[6px_6px_0_0_#f2557b] transition-transform hover:-translate-y-0.5"
                          >
                            <Download className="h-4 w-4" />
                            Download
                          </button>
                        </div>
                      ) : (
                        <span className="rounded-full border-4 border-dashed border-[#FFD166] bg-[#FFF3BF] px-4 py-2 text-xs font-semibold capitalize text-[#AA6A00] shadow-[6px_6px_0_0_#FFB84C]">
                          {image.status}
                        </span>
                      )}

                      <div className="flex items-center gap-2">
                        {image.status === 'completed' && image.coloring_page_url && (
                          <button
                            onClick={() => setRegenerateImage(image)}
                            className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-[#FFD166] bg-[#FFF3BF] text-[#AA6A00] shadow-[4px_4px_0_0_#FFB84C] transition-transform hover:-translate-y-0.5"
                            title="Regenerate"
                          >
                            <RotateCcw className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() => deleteImage(image.id)}
                          className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-[#FFB3BA] bg-[#FFE6EB] text-[#FF6F91] shadow-[4px_4px_0_0_#FF8A80] transition-transform hover:-translate-y-0.5"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {showUploader && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#3A2E39]/40 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-4xl">
            <div className="pointer-events-none absolute -inset-6 rounded-[3rem] bg-gradient-to-br from-[#FFB3BA]/40 via-[#FFD166]/40 to-[#9BF6FF]/40 blur-2xl" aria-hidden="true" />
            <div className="relative overflow-hidden rounded-[2.5rem] border-4 border-[#FFB3BA] bg-[#FFF5D6]/95 p-8 shadow-[18px_18px_0_0_#FF8A80]">
              <div className="flex items-start justify-between">
                <div>
                  <p className="inline-flex items-center gap-2 rounded-full border-2 border-dashed border-[#FFD166] bg-[#FFF3BF] px-3 py-1 text-xs font-semibold uppercase tracking-widest text-[#E97777]">
                    <Sparkles className="h-3 w-3" />
                    Upload station
                  </p>
                  <h2 className="mt-4 text-3xl font-extrabold text-[#3A2E39]">Upload Photos</h2>
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
              <div className="mt-8">
                <ImageUploader
                  onUploadComplete={() => {
                    setShowUploader(false)
                    fetchUserImages(true)
                  }}
                />
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

