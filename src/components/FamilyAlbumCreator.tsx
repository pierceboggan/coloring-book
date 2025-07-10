'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Users, Download, Plus, X, ArrowLeft, Link, Copy, Check } from 'lucide-react'

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

  // Filter only completed images with coloring pages
  const availableImages = images.filter(img => 
    img.status === 'completed' && img.coloring_page_url
  )

  const toggleImageSelection = (image: UserImage) => {
    setSelectedImages(prev => {
      const isSelected = prev.some(img => img.id === image.id)
      if (isSelected) {
        return prev.filter(img => img.id !== image.id)
      } else {
        return [...prev, image]
      }
    })
  }

  const createAlbum = async () => {
    if (!albumTitle.trim() || selectedImages.length === 0) {
      alert('Please provide a title and select at least one coloring page')
      return
    }

    setIsCreating(true)
    console.log('📁 Creating family album:', albumTitle)

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
      
      console.log('✅ Family album created successfully')
      
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
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
          <div className="p-6 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Users className="w-6 h-6 text-green-600" />
              <h2 className="text-2xl font-bold text-gray-800">Album Created!</h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 p-2"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="p-6 text-center">
            <div className="bg-green-50 rounded-xl p-6 mb-6">
              <h3 className="text-xl font-bold text-gray-800 mb-2">{createdAlbum.title}</h3>
              {createdAlbum.description && (
                <p className="text-gray-600 mb-4">{createdAlbum.description}</p>
              )}
              <p className="text-sm text-gray-500">{selectedImages.length} coloring pages</p>
            </div>

            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Share this link with family & friends:
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={createdAlbum.shareUrl}
                    readOnly
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm"
                  />
                  <button
                    onClick={copyShareLink}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 text-sm"
                  >
                    {linkCopied ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={downloadPDF}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
                >
                  <Download className="w-5 h-5" />
                  <span>Download PDF</span>
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  Done
                </button>
              </div>

              <p className="text-xs text-gray-500 mt-4">
                Anyone with this link can view and download the coloring book PDF
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Users className="w-6 h-6 text-purple-600" />
            <h2 className="text-2xl font-bold text-gray-800">Create Family Album</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 p-2"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Album Details */}
        <div className="p-6 border-b border-gray-200 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Album Title *
            </label>
            <input
              type="text"
              value={albumTitle}
              onChange={(e) => setAlbumTitle(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="e.g., Summer Vacation 2024"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description (Optional)
            </label>
            <textarea
              value={albumDescription}
              onChange={(e) => setAlbumDescription(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Add a description for your family album..."
              rows={2}
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex">
          {/* Available Images */}
          <div className="w-1/2 p-6 border-r border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Available Coloring Pages ({availableImages.length})
            </h3>
            <div className="grid grid-cols-2 gap-4 max-h-96 overflow-y-auto">
              {availableImages.map((image) => (
                <div
                  key={image.id}
                  className={`relative border-2 rounded-lg overflow-hidden cursor-pointer transition-all ${
                    selectedImages.some(img => img.id === image.id)
                      ? 'border-purple-500 ring-2 ring-purple-200'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => toggleImageSelection(image)}
                >
                  <img
                    src={image.coloring_page_url}
                    alt={image.name}
                    className="w-full h-24 object-cover"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-10 transition-all flex items-center justify-center">
                    {selectedImages.some(img => img.id === image.id) ? (
                      <div className="bg-purple-500 text-white rounded-full p-1">
                        <Plus className="w-4 h-4 rotate-45" />
                      </div>
                    ) : (
                      <div className="bg-white text-gray-600 rounded-full p-1 opacity-0 hover:opacity-100 transition-opacity">
                        <Plus className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                  <div className="p-2">
                    <p className="text-xs text-gray-600 truncate">{image.name}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Selected Images */}
          <div className="w-1/2 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Selected Pages ({selectedImages.length})
            </h3>
            {selectedImages.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>Select coloring pages to add to your family album</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {selectedImages.map((image, index) => (
                  <div key={image.id} className="flex items-center space-x-3 bg-gray-50 rounded-lg p-3">
                    <span className="text-sm font-medium text-gray-500 w-6">
                      {index + 1}
                    </span>
                    <img
                      src={image.coloring_page_url}
                      alt={image.name}
                      className="w-12 h-12 object-cover rounded"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-800 truncate">
                        {image.name}
                      </p>
                    </div>
                    <button
                      onClick={() => toggleImageSelection(image)}
                      className="text-red-500 hover:text-red-700 p-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 flex items-center justify-between">
          <div className="text-sm text-gray-500">
            {selectedImages.length > 0 && (
              <span>{selectedImages.length} pages selected</span>
            )}
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="px-6 py-2 text-gray-600 hover:text-gray-800 font-medium"
            >
              Cancel
            </button>
            <button
              onClick={createAlbum}
              disabled={!albumTitle.trim() || selectedImages.length === 0 || isCreating}
              className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
            >
              {isCreating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <Users className="w-4 h-4" />
                  <span>Create Album</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}