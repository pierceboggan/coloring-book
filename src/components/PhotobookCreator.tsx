'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { Book, Download, Plus, X, ArrowLeft, ArrowRight, Loader2 } from 'lucide-react'

interface UserImage {
  id: string
  name: string
  original_url: string
  coloring_page_url?: string
  status: 'processing' | 'completed' | 'error'
  created_at: string
  selected?: boolean
}

interface PhotobookCreatorProps {
  images: UserImage[]
  onClose: () => void
}

export function PhotobookCreator({ images, onClose }: PhotobookCreatorProps) {
  const [selectedImages, setSelectedImages] = useState<UserImage[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [photobookTitle, setPhotobookTitle] = useState('My Coloring Book')
  const { user } = useAuth()

  // Filter only completed images with coloring pages
  const availableImages = images.filter(img => 
    img.status === 'completed' && img.coloring_page_url && img.coloring_page_url.trim() !== ''
  )
  
  // Debug logging
  console.log('📸 PhotobookCreator availableImages:', availableImages.map(img => ({
    id: img.id,
    name: img.name,
    status: img.status,
    coloring_page_url: img.coloring_page_url
  })))

  const toggleImageSelection = (image: UserImage) => {
    setSelectedImages(prev => {
      const isSelected = prev.some(img => img.id === image.id)
      if (isSelected) {
        return prev.filter(img => img.id !== image.id)
      } else {
        // Limit based on user plan (will implement subscription check later)
        const maxPages = 20 // Default for Family plan
        if (prev.length >= maxPages) {
          alert(`Maximum ${maxPages} pages allowed for your plan`)
          return prev
        }
        return [...prev, image]
      }
    })
  }

  const generatePhotobook = async () => {
    if (selectedImages.length === 0) {
      alert('Please select at least one coloring page')
      return
    }

    setIsGenerating(true)
    console.log('📖 Generating photobook with', selectedImages.length, 'pages')

    try {
      const response = await fetch('/api/generate-photobook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          images: selectedImages.map(img => ({
            id: img.id,
            name: img.name,
            coloring_page_url: img.coloring_page_url
          })),
          title: photobookTitle,
          userId: user?.id
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate photobook')
      }

      const result = await response.json()
      
      // Trigger download
      const link = document.createElement('a')
      link.href = result.downloadUrl
      link.download = `${photobookTitle}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      console.log('✅ Photobook generated and downloaded successfully')
      onClose()
      
    } catch (error) {
      console.error('❌ Error generating photobook:', error)
      alert('Failed to generate photobook. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Book className="w-6 h-6 text-purple-600" />
            <h2 className="text-2xl font-bold text-gray-800">Create Photobook</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 p-2"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Title Input */}
        <div className="p-6 border-b border-gray-200">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Photobook Title
          </label>
          <input
            type="text"
            value={photobookTitle}
            onChange={(e) => setPhotobookTitle(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="Enter photobook title..."
          />
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
                    onError={(e) => {
                      console.error('🖼️ Failed to load image:', image.name, image.coloring_page_url)
                      // Fallback to original image if coloring page fails
                      e.currentTarget.src = image.original_url
                    }}
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
                <Book className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>Select coloring pages to add to your photobook</p>
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
              onClick={generatePhotobook}
              disabled={selectedImages.length === 0 || isGenerating}
              className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Generate PDF</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}