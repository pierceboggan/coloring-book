'use client'

import { useCallback, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { UserImage } from '@/components/Dashboard/types'

interface UseImageActionsArgs {
  userId: string | null
  setImages: React.Dispatch<React.SetStateAction<UserImage[]>>
  refetch: () => Promise<void>
}

interface UseImageActionsResult {
  archiveImage: (imageId: string) => Promise<void>
  toggleFavorite: (imageId: string, currentFavorite: boolean) => Promise<void>
  retryStuckImages: () => Promise<void>
  retryingProcessing: boolean
  renameImage: (imageId: string, newName: string) => Promise<void>
  renamingImageId: string | null
  applyVariantAsPrimary: (image: UserImage, variantUrl: string) => Promise<void>
  downloadColoringPage: (imageId: string, imageName: string) => void
}

/**
 * Encapsulates the mutating actions a user can take on their images.
 * Each action updates local state optimistically (or after success) so the UI
 * stays in sync without waiting for the next realtime/poll tick.
 */
export function useImageActions({ userId, setImages, refetch }: UseImageActionsArgs): UseImageActionsResult {
  const [retryingProcessing, setRetryingProcessing] = useState(false)
  const [renamingImageId, setRenamingImageId] = useState<string | null>(null)

  const archiveImage = useCallback(async (imageId: string) => {
    try {
      const response = await fetch(`/api/images/${imageId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'archive' }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to archive image')
      }

      setImages(prev => prev.filter(img => img.id !== imageId))
    } catch (error) {
      console.error('❌ Failed to archive image:', error)
      alert(`Failed to archive image: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }, [setImages])

  const toggleFavorite = useCallback(async (imageId: string, currentFavorite: boolean) => {
    try {
      const action = currentFavorite ? 'unfavorite' : 'favorite'
      const response = await fetch(`/api/images/${imageId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update favorite status')
      }

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
  }, [setImages])

  const retryStuckImages = useCallback(async () => {
    setRetryingProcessing(true)

    try {
      const response = await fetch('/api/retry-processing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      })

      if (!response.ok) {
        throw new Error('Failed to retry processing')
      }

      const result = await response.json()

      await refetch()

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
  }, [userId, refetch])

  const renameImage = useCallback(async (imageId: string, newName: string) => {
    setRenamingImageId(imageId)

    try {
      const response = await fetch(`/api/images/${imageId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to rename image')
      }

      setImages(prev =>
        prev.map(img =>
          img.id === imageId
            ? { ...img, name: result.data?.name ?? newName }
            : img
        )
      )
    } catch (error) {
      console.error('❌ Failed to rename image:', error)
      alert(`Failed to rename image: ${error instanceof Error ? error.message : 'Unknown error'}`)
      throw error
    } finally {
      setRenamingImageId(null)
    }
  }, [setImages])

  const applyVariantAsPrimary = useCallback(async (image: UserImage, variantUrl: string) => {
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
  }, [setImages])

  const downloadColoringPage = useCallback((imageId: string, imageName: string) => {
    const link = document.createElement('a')
    link.href = `/api/download/${imageId}`
    link.download = `coloring-page-${imageName}`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }, [])

  return {
    archiveImage,
    toggleFavorite,
    retryStuckImages,
    retryingProcessing,
    renameImage,
    renamingImageId,
    applyVariantAsPrimary,
    downloadColoringPage,
  }
}
