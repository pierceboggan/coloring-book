'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Download, Users, Calendar, Image as ImageIcon, Loader2 } from 'lucide-react'

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

  useEffect(() => {
    if (shareCode) {
      fetchAlbum()
    }
  }, [shareCode])

  const fetchAlbum = async () => {
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
  }

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
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-purple-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading family album...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Album Not Found</h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <a
              href="/"
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Go to ColoringBook.AI
            </a>
          </div>
        </div>
      </div>
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
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Users className="w-8 h-8 text-purple-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-800">{album.title}</h1>
                {album.description && (
                  <p className="text-gray-600">{album.description}</p>
                )}
              </div>
            </div>
            <button
              onClick={downloadPDF}
              disabled={downloadingPdf || album.imageCount === 0}
              className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center space-x-2"
            >
              {downloadingPdf ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Generating PDF...</span>
                </>
              ) : (
                <>
                  <Download className="w-5 h-5" />
                  <span>Download PDF</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center space-x-6 text-sm text-gray-600">
            <div className="flex items-center space-x-2">
              <ImageIcon className="w-4 h-4" />
              <span>{album.imageCount} coloring pages</span>
            </div>
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4" />
              <span>Created {new Date(album.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        {album.imageCount === 0 ? (
          <div className="text-center py-16">
            <div className="bg-white rounded-2xl shadow-lg p-12 max-w-md mx-auto">
              <ImageIcon className="w-16 h-16 text-gray-400 mx-auto mb-6" />
              <h3 className="text-xl font-semibold text-gray-800 mb-4">No coloring pages yet</h3>
              <p className="text-gray-600">This album doesn't have any completed coloring pages to display.</p>
            </div>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {album.images.map((image) => (
              <div key={image.id} className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                <div className="aspect-square">
                  <img
                    src={image.coloring_page_url}
                    alt={image.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-800 truncate">{image.name}</h3>
                  <a
                    href={image.coloring_page_url}
                    download={`coloring-page-${image.name}`}
                    className="mt-3 w-full bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2 text-sm"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download</span>
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="mt-16 text-center py-8 border-t border-gray-200">
          <p className="text-gray-600 mb-2">Created with</p>
          <a
            href="/"
            className="text-purple-600 hover:text-purple-700 font-semibold text-lg"
          >
            ColoringBook.AI
          </a>
          <p className="text-sm text-gray-500 mt-2">
            Transform your photos into beautiful coloring pages with AI
          </p>
        </div>
      </div>
    </div>
  )
}