'use client'

import { useState, useRef } from 'react'
import { Upload, Image as ImageIcon, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import * as Sentry from '@sentry/nextjs'

type UploadStatus = 'idle' | 'uploading' | 'processing' | 'completed' | 'error'

interface UploadedImage {
  id: string
  name: string
  originalUrl: string
  coloringPageUrl?: string
}

interface ImageUploaderProps {
  onUploadComplete?: () => void
}

export default function ImageUploader({ onUploadComplete }: ImageUploaderProps) {
  const [status, setStatus] = useState<UploadStatus>('idle')
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([])
  const [error, setError] = useState<string>('')
  const [processingCount, setProcessingCount] = useState(0)
  const [completedCount, setCompletedCount] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { user } = useAuth()

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    return Sentry.startSpan(
      {
        op: "ui.upload",
        name: "Image Upload Process",
      },
      async (span) => {
        const files = event.target.files
        if (!files || files.length === 0) return

        span.setAttribute("fileCount", files.length);

        if (!user) {
          setError('Please sign in to upload images')
          return
        }

    // Validate all files first
    const validFiles: File[] = []
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      
      if (!file.type.startsWith('image/')) {
        setError(`${file.name} is not an image file`)
        return
      }

      if (file.size > 10 * 1024 * 1024) {
        setError(`${file.name} is too large (max 10MB)`)
        return
      }

      validFiles.push(file)
    }

    console.log(`📸 Uploading ${validFiles.length} images...`)
    setError('')
    await uploadMultipleImages(validFiles)
      }
    );
  }

  const uploadMultipleImages = async (files: File[]) => {
    setStatus('uploading')
    setProcessingCount(files.length)
    setCompletedCount(0)
    
    const uploadPromises = files.map(file => uploadSingleImage(file))
    
    try {
      await Promise.all(uploadPromises)
      setStatus('completed')
      
      // Call completion callback after a short delay
      setTimeout(() => {
        onUploadComplete?.()
      }, 2000)
      
    } catch (error) {
      console.error('Multi-upload error:', error)
      Sentry.captureException(error)
      setStatus('error')
      setError('Some uploads failed. Please try again.')
    }
  }

  const uploadSingleImage = async (file: File): Promise<void> => {
    try {
      console.log(`📤 Uploading ${file.name}...`)

      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`
      const filePath = `uploads/${fileName}`

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('images')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('images')
        .getPublicUrl(filePath)

      const imageData = {
        name: file.name,
        original_url: publicUrl,
        user_id: user?.id || 'anonymous',
        status: 'processing' as const
      }

      const { data: dbData, error: dbError } = await supabase
        .from('images')
        .insert(imageData)
        .select()
        .single()

      if (dbError) throw dbError

      const uploadedImage: UploadedImage = {
        id: dbData.id,
        name: dbData.name,
        originalUrl: dbData.original_url
      }

      setUploadedImages(prev => [...prev, uploadedImage])

      // Generate coloring page in background
      generateColoringPage(dbData.id, publicUrl).then(() => {
        setCompletedCount(prev => prev + 1)
        console.log(`✅ Completed processing ${file.name}`)
      }).catch(err => {
        console.error(`❌ Failed to process ${file.name}:`, err)
      })

    } catch (err) {
      console.error(`Upload error for ${file.name}:`, err)
      throw err
    }
  }

  const generateColoringPage = async (imageId: string, imageUrl: string) => {
    try {
      const response = await fetch('/api/generate-coloring-page', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ imageId, imageUrl }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate coloring page')
      }

      const result = await response.json()
      
      // Update the specific image in the array
      setUploadedImages(prev => 
        prev.map(img => 
          img.id === imageId 
            ? { ...img, coloringPageUrl: result.coloringPageUrl }
            : img
        )
      )
      
    } catch (err) {
      console.error('Generation error:', err)
      throw err
    }
  }

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    const files = event.dataTransfer.files
    if (files && files.length > 0) {
      const mockEvent = { target: { files } } as React.ChangeEvent<HTMLInputElement>
      handleFileSelect(mockEvent)
    }
  }

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
  }

  const resetUploader = () => {
    setStatus('idle')
    setUploadedImages([])
    setProcessingCount(0)
    setCompletedCount(0)
    setError('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }


  return (
    <div className="w-full">
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      <div
        className={`
          relative border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300 cursor-pointer
          ${status === 'idle' ? 'border-gray-300 hover:border-purple-400 hover:bg-purple-50 hover:shadow-lg' : 'border-gray-200'}
          ${status === 'uploading' || status === 'processing' ? 'bg-gray-50 border-gray-300' : ''}
        `}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={() => status === 'idle' && user && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileSelect}
          className="hidden"
          disabled={status !== 'idle'}
        />

        {status === 'idle' && (
          <>
            <div className="bg-purple-100 rounded-full p-4 w-20 h-20 mx-auto mb-6 flex items-center justify-center">
              <Upload className="w-10 h-10 text-purple-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-700 mb-3">
              {user ? 'Drop your images here or click to browse' : 'Sign in to upload images'}
            </h3>
            <p className="text-gray-500 text-base">
              {user ? 'Supports JPEG, PNG, WebP • Max 10MB each • Select multiple files' : 'Create an account to transform your photos into coloring pages'}
            </p>
          </>
        )}

        {(status === 'uploading' || status === 'processing') && (
          <>
            <div className="bg-purple-100 rounded-full p-4 w-20 h-20 mx-auto mb-6 flex items-center justify-center">
              <Loader2 className="w-10 h-10 text-purple-600 animate-spin" />
            </div>
            <h3 className="text-xl font-semibold text-gray-700 mb-3">
              {status === 'uploading' ? 'Uploading your images...' : 'Creating your coloring pages...'}
            </h3>
            <p className="text-gray-500 text-base mb-4">
              {status === 'uploading' 
                ? `Processing ${processingCount} images` 
                : `Completed ${completedCount} of ${processingCount} images`
              }
            </p>
            {processingCount > 1 && (
              <div className="w-full bg-gray-200 rounded-full h-2 max-w-xs mx-auto">
                <div 
                  className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(completedCount / processingCount) * 100}%` }}
                />
              </div>
            )}
          </>
        )}

        {status === 'completed' && (
          <>
            <div className="bg-green-100 rounded-full p-4 w-20 h-20 mx-auto mb-6 flex items-center justify-center">
              <ImageIcon className="w-10 h-10 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-700 mb-3">
              {processingCount === 1 ? 'Coloring page created!' : `${processingCount} coloring pages created!`}
            </h3>
            <p className="text-gray-500 text-base mb-6">
              Your images have been processed and are now available in your dashboard
            </p>
            <button
              onClick={resetUploader}
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl font-medium transition-colors"
            >
              Upload More Images
            </button>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="bg-red-100 rounded-full p-4 w-20 h-20 mx-auto mb-6 flex items-center justify-center">
              <Upload className="w-10 h-10 text-red-600" />
            </div>
            <h3 className="text-xl font-semibold text-red-600 mb-3">
              Something went wrong
            </h3>
            <button
              onClick={resetUploader}
              className="text-purple-600 hover:text-purple-700 font-medium text-lg"
            >
              Try again
            </button>
          </>
        )}
      </div>
    </div>
  )
}