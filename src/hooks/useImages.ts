'use client'

import { useCallback, useEffect, useState } from 'react'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import type { UserImage } from '@/components/Dashboard/types'

interface UseImagesResult {
  images: UserImage[]
  loading: boolean
  setImages: React.Dispatch<React.SetStateAction<UserImage[]>>
  refetch: () => Promise<void>
}

/**
 * Manages the list of a user's images, including:
 * - initial fetch from Supabase
 * - realtime subscription for live updates
 * - polling fallback when realtime isn't available or images are processing
 *
 * Filters out archived images on the client side.
 */
export function useImages(userId: string | null): UseImagesResult {
  const [images, setImages] = useState<UserImage[]>([])
  const [loading, setLoading] = useState(true)

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

  useEffect(() => {
    if (!userId) {
      return
    }

    fetchUserImages()

    let subscription: RealtimeChannel | null = null
    let isRealTimeWorking = false

    try {
      subscription = supabase
        .channel('images_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'images',
            filter: `user_id=eq.${userId}`,
          },
          () => {
            fetchUserImages()
          }
        )
        .subscribe((status: string) => {
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

    let pollInterval: ReturnType<typeof setTimeout>

    const startPolling = () => {
      const poll = async () => {
        try {
          const { data } = await supabase
            .from('images')
            .select('status')
            .eq('user_id', userId)

          const hasProcessingImages = data?.some((img: { status: string }) => img.status === 'processing')

          if (!isRealTimeWorking || hasProcessingImages) {
            await fetchUserImages()
          }

          const nextInterval = hasProcessingImages ? 3000 : (isRealTimeWorking ? 15000 : 5000)
          pollInterval = setTimeout(poll, nextInterval)
        } catch (error) {
          console.error('❌ Polling error:', error)
          pollInterval = setTimeout(poll, 5000)
        }
      }

      poll()
    }

    startPolling()

    return () => {
      subscription?.unsubscribe()
      clearTimeout(pollInterval)
    }
  }, [fetchUserImages, userId])

  return { images, loading, setImages, refetch: fetchUserImages }
}
