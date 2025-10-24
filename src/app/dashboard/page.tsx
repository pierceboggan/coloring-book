'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { PhotobookCreator } from '@/components/PhotobookCreator'
import { FamilyAlbumCreator } from '@/components/FamilyAlbumCreator'
import { RegenerateModal } from '@/components/RegenerateModal'
import ImageUploader from '@/components/ImageUploader'
import { Palette, Plus, Download, Trash2, ArrowLeft, Loader2, RefreshCw, Book, Users, RotateCcw, Paintbrush } from 'lucide-react'
import { ColoringCanvasModal } from '@/components/ColoringCanvasModal'

interface UserImage {
  id: string
  name: string
  original_url: string
  coloring_page_url?: string
  status: 'processing' | 'completed' | 'error'
  created_at: string
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
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-purple-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading your dashboard...</p>
          <p className="text-xs text-gray-400 mt-2">Auth: {authLoading ? 'loading' : 'ready'} | Data: {loading ? 'loading' : 'ready'}</p>
        </div>
      </div>
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
              <ArrowLeft className="w-5 h-5 mr-1" />
              Back
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
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
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

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-800 mb-2">Your Coloring Pages</h1>
              <p className="text-gray-600">Manage and download all your AI-generated coloring pages</p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => fetchUserImages(true)}
                disabled={refreshing}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                <span>Refresh Status</span>
              </button>
              
              {images.some(img => img.status === 'processing') && (
                <button
                  onClick={retryStuckImages}
                  disabled={retryingProcessing}
                  className="bg-orange-600 hover:bg-orange-700 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
                >
                  <Loader2 className={`w-4 h-4 ${retryingProcessing ? 'animate-spin' : ''}`} />
                  <span>Fix Stuck Images</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {images.length === 0 ? (
          <div className="text-center py-16">
            <div className="bg-white rounded-2xl shadow-lg p-12 max-w-md mx-auto">
              <Palette className="w-16 h-16 text-purple-600 mx-auto mb-6" />
              <h3 className="text-xl font-semibold text-gray-800 mb-4">No coloring pages yet</h3>
              <p className="text-gray-600 mb-6">Upload your first photo to create a beautiful coloring page!</p>
              <button
                onClick={() => setShowUploader(true)}
                className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-full font-medium transition-colors"
              >
                Upload Your First Photo
              </button>
            </div>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {images.map((image) => (
              <div key={image.id} className="bg-white rounded-2xl shadow-lg overflow-hidden">
                <div className="aspect-square bg-gray-100 relative">
                  <img
                    src={image.status === 'completed' && image.coloring_page_url ? image.coloring_page_url : image.original_url}
                    alt={image.name}
                    className="w-full h-full object-cover"
                  />
                  {image.status === 'processing' && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                      <div className="text-white text-center">
                        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                        <p className="text-sm">Processing...</p>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="p-4">
                  <h3 className="font-semibold text-gray-800 mb-2 truncate">{image.name}</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    {new Date(image.created_at).toLocaleDateString()}
                  </p>
                  
                  <div className="flex items-center justify-between gap-2">
                    {image.status === 'completed' && image.coloring_page_url ? (
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          onClick={() => setActiveDrawingImage(image)}
                          className="flex items-center rounded-lg border border-purple-100 bg-purple-50 px-3 py-2 text-sm font-medium text-purple-700 transition hover:border-purple-200 hover:bg-purple-100"
                        >
                          <Paintbrush className="mr-1 h-4 w-4" />
                          Color online
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
                          className="flex items-center rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-purple-700"
                        >
                          <Download className="mr-1 h-4 w-4" />
                          Download
                        </button>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-500 capitalize">{image.status}</span>
                    )}

                    <div className="flex items-center space-x-1">
                      {image.status === 'completed' && image.coloring_page_url && (
                        <button
                          onClick={() => setRegenerateImage(image)}
                          className="text-orange-500 hover:text-orange-700 p-2 transition-colors"
                          title="Regenerate"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => deleteImage(image.id)}
                        className="text-red-500 hover:text-red-700 p-2 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {showUploader && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-800">Upload Photos</h2>
              <button
                onClick={() => setShowUploader(false)}
                className="text-gray-500 hover:text-gray-700 p-2"
              >
                ✕
              </button>
            </div>
            <div className="p-6">
              <ImageUploader 
                onUploadComplete={() => {
                  setShowUploader(false)
                  fetchUserImages(true)
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Family Album Creator Modal */}
      {showFamilyAlbumCreator && (
        <FamilyAlbumCreator
          images={images}
          onClose={() => setShowFamilyAlbumCreator(false)}
        />
      )}

      {/* Photobook Creator Modal */}
      {showPhotobookCreator && (
        <PhotobookCreator
          images={images}
          onClose={() => setShowPhotobookCreator(false)}
        />
      )}

      {/* Regenerate Modal */}
      {regenerateImage && (
        <RegenerateModal
          isOpen={true}
          onClose={() => setRegenerateImage(null)}
          imageId={regenerateImage.id}
          imageName={regenerateImage.name}
          originalUrl={regenerateImage.original_url}
          currentColoringPageUrl={regenerateImage.coloring_page_url || ''}
          onRegenerateComplete={(regeneratedUrl) => {
            // Update the image with the new coloring page URL
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
    </div>
  )
}

