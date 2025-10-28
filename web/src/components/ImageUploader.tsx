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
        op: 'ui.upload',
        name: 'Image Upload Process',
      },
      async (span) => {
        const files = event.target.files

        if (!files || files.length === 0) {
          return
        }

        span.setAttribute('fileCount', files.length)

        if (!user) {
          setError('Please sign in to upload images')
          return
        }

        const validFiles: File[] = []

        for (const file of Array.from(files)) {
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
    )
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
          relative cursor-pointer rounded-[2.5rem] border-4 border-dashed p-12 text-center transition-all duration-300
          ${status === 'idle' ? 'border-[#FFB3BA] bg-white/90 hover:border-[#FF6F91] hover:bg-[#FFE6EB] hover:shadow-[12px_12px_0_0_#FFB3BA]' : ''}
          ${status === 'uploading' || status === 'processing' ? 'border-[#FFD166] bg-[#FFF3BF] shadow-[10px_10px_0_0_#FFB84C]' : ''}
          ${status === 'completed' ? 'border-[#A0E7E5] bg-[#E0F7FA] shadow-[10px_10px_0_0_#55C6C0]' : ''}
          ${status === 'error' ? 'border-red-300 bg-red-50 shadow-[10px_10px_0_0_rgba(239,68,68,0.35)]' : ''}
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
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full border-4 border-white bg-[#FF6F91] text-white shadow-inner">
              <Upload className="h-10 w-10" />
            </div>
            <h3 className="mb-3 text-2xl font-extrabold text-[#3A2E39]">
              {user ? 'Drop your images here or click to browse' : 'Sign in to upload images'}
            </h3>
            <p className="text-base font-semibold text-[#594144]">
              {user ? 'Supports JPEG, PNG, WebP • Max 10MB each • Select multiple files' : 'Create an account to transform your photos into coloring pages'}
            </p>
          </>
        )}

        {(status === 'uploading' || status === 'processing') && (
          <>
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full border-4 border-white bg-[#FFD166] text-white shadow-inner">
              <Loader2 className="h-10 w-10 animate-spin" />
            </div>
            <h3 className="mb-3 text-2xl font-extrabold text-[#3A2E39]">
              {status === 'uploading' ? 'Uploading your images...' : 'Creating your coloring pages...'}
            </h3>
            <p className="mb-4 text-base font-semibold text-[#594144]">
              {status === 'uploading'
                ? `Processing ${processingCount} images`
                : `Completed ${completedCount} of ${processingCount} images`
              }
            </p>
            {processingCount > 1 && (
              <div className="mx-auto h-2 w-full max-w-xs rounded-full bg-white/60">
                <div
                  className="h-2 rounded-full bg-[#FF6F91] transition-all duration-300"
                  style={{ width: `${(completedCount / processingCount) * 100}%` }}
                />
              </div>
            )}
          </>
        )}

        {status === 'completed' && (
          <>
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full border-4 border-white bg-[#55C6C0] text-white shadow-inner">
              <ImageIcon className="h-10 w-10" />
            </div>
            <h3 className="mb-3 text-2xl font-extrabold text-[#3A2E39]">
              {processingCount === 1 ? 'Coloring page created!' : `${processingCount} coloring pages created!`}
            </h3>
            <p className="mb-6 text-base font-semibold text-[#594144]">
              Your images have been processed and are now available in your dashboard
            </p>
            <button
              onClick={resetUploader}
              className="rounded-full border-4 border-[#FFB3BA] bg-[#FF6F91] px-6 py-3 font-semibold text-white shadow-[8px_8px_0_0_#f2557b] transition-transform hover:translate-y-[-2px]"
            >
              Upload More Images
            </button>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full border-4 border-white bg-red-400 text-white shadow-inner">
              <Upload className="h-10 w-10" />
            </div>
            <h3 className="mb-3 text-2xl font-extrabold text-red-600">
              Something went wrong
            </h3>
            <button
              onClick={resetUploader}
              className="text-lg font-semibold text-[#FF6F91] underline-offset-4 hover:underline"
            >
              Try again
            </button>
          </>
        )}
      </div>
    </div>
  )
}
