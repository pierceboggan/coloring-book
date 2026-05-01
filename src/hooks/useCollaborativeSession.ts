'use client'

import { useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import type { CollabSession, UserImage } from '@/components/Dashboard/types'

interface UseCollaborativeSessionResult {
  collabSession: CollabSession
  startCollaborativeSession: (image: UserImage) => Promise<void>
  endCollaborativeSession: () => void
}

/**
 * Manages collaborative coloring sessions: creates a server-side session record
 * via /api/collaborative/sessions and tracks the active session on the client.
 */
export function useCollaborativeSession(): UseCollaborativeSessionResult {
  const router = useRouter()
  const [collabSession, setCollabSession] = useState<CollabSession>(null)

  const startCollaborativeSession = useCallback(async (image: UserImage) => {
    if (!image.coloring_page_url) {
      console.error('No coloring page URL found for image')
      return
    }

    try {
      const devBypassActive =
        process.env.NODE_ENV !== 'production' &&
        process.env.NEXT_PUBLIC_ENABLE_DEV_AUTH_BYPASS === 'true'

      let userId: string
      let userName: string

      if (devBypassActive) {
        userId = 'dev-user-123'
        userName = 'Demo User'
      } else {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push('/')
          return
        }
        userId = user.id
        userName = user.user_metadata?.full_name || user.email || 'Anonymous'
      }

      const res = await fetch('/api/collaborative/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${image.name} - Collaborative`,
          imageId: image.id,
          userId,
          userName,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        console.error('Failed to create session:', data.error)
        return
      }

      setCollabSession({ sessionId: data.session.id, userId })
    } catch (e) {
      console.error('Failed to start collaborative session:', e)
    }
  }, [router])

  const endCollaborativeSession = useCallback(() => {
    setCollabSession(null)
  }, [])

  return { collabSession, startCollaborativeSession, endCollaborativeSession }
}
