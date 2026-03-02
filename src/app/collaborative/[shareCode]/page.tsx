'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ColoringCanvasModal } from '@/components/ColoringCanvasModal'
import { supabase } from '@/lib/supabase'
import { Loader2, Users, Palette } from 'lucide-react'

export default function CollaborativeJoinPage() {
  const params = useParams()
  const router = useRouter()
  const shareCode = params.shareCode as string

  const [session, setSession] = useState<any>(null)
  const [image, setImage] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [joining, setJoining] = useState(false)
  const [joinedSession, setJoinedSession] = useState<any>(null)

  useEffect(() => {
    if (!shareCode) return

    async function loadSession() {
      try {
        const res = await fetch(`/api/collaborative/sessions?shareCode=${shareCode}`)
        const data = await res.json()

        if (!res.ok) {
          setError(data.error || 'Session not found')
          setLoading(false)
          return
        }

        const sess = data.session
        setSession(sess)

        // Load the image details
        const { data: imgData } = await supabase
          .from('images')
          .select('*')
          .eq('id', sess.image_id)
          .single()

        setImage(imgData)
      } catch (e) {
        console.error('Failed to load session:', e)
        setError('Failed to load session')
      } finally {
        setLoading(false)
      }
    }

    loadSession()
  }, [shareCode])

  async function handleJoin() {
    if (!session || !image) return

    setJoining(true)
    try {
      const devBypassActive =
        process.env.NODE_ENV !== 'production' &&
        process.env.NEXT_PUBLIC_ENABLE_DEV_AUTH_BYPASS === 'true'

      let userId, userName
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

      const res = await fetch(`/api/collaborative/sessions/${session.id}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, userName })
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to join session')
        return
      }

      setJoinedSession({ sessionId: session.id, userId })
    } catch (e) {
      console.error('Join error:', e)
      setError('Failed to join session')
    } finally {
      setJoining(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FFF5D6]">
        <div className="text-center">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-[#1DB9B3]" />
          <p className="mt-4 text-lg font-semibold text-[#3A2E39]">Loading collaborative session...</p>
        </div>
      </div>
    )
  }

  if (error || !session || !image) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FFF5D6]">
        <div className="text-center max-w-md">
          <div className="rounded-full border-4 border-[#FFB3BA] bg-[#FFE6EB] p-6 inline-block">
            <Users className="h-12 w-12 text-[#FF6F91]" />
          </div>
          <h1 className="mt-4 text-2xl font-extrabold text-[#3A2E39]">Session not found</h1>
          <p className="mt-2 text-[#AA6A00]">{error || 'This collaborative session does not exist or has ended.'}</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="mt-6 rounded-full border-4 border-[#A0E7E5] bg-white px-6 py-3 text-sm font-semibold text-[#1DB9B3] shadow-[6px_6px_0_0_#55C6C0] transition-transform hover:-translate-y-0.5"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  if (joinedSession) {
    return (
      <ColoringCanvasModal
        imageUrl={image.coloring_page_url}
        imageName={image.name}
        onClose={() => router.push('/dashboard')}
        collaboration={joinedSession}
      />
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FFF5D6] p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="rounded-full border-4 border-[#A0E7E5] bg-[#E0F7FA] p-6 inline-block">
            <Palette className="h-12 w-12 text-[#1DB9B3]" />
          </div>
          <h1 className="mt-4 text-2xl font-extrabold text-[#3A2E39]">Join Collaborative Session</h1>
          <p className="mt-2 text-[#AA6A00]">You've been invited to color together!</p>
        </div>

        <div className="rounded-[2rem] border-4 border-[#FFD166] bg-[#FFF3BF] p-6 shadow-[8px_8px_0_0_#FFB84C]">
          <div className="text-center">
            <h2 className="text-lg font-bold text-[#3A2E39] mb-2">{session.name}</h2>
            <div className="text-sm text-[#AA6A00] space-y-1">
              <p>Image: {image.name}</p>
              <p>Share code: <span className="font-mono font-bold">{shareCode}</span></p>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3">
            <button
              onClick={handleJoin}
              disabled={joining}
              className="flex items-center justify-center gap-2 rounded-full border-4 border-[#A0E7E5] bg-white px-4 py-3 text-sm font-semibold text-[#1DB9B3] shadow-[6px_6px_0_0_#55C6C0] transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {joining ? <Loader2 className="h-4 w-4 animate-spin" /> : <Users className="h-4 w-4" />}
              {joining ? 'Joining...' : 'Join Session'}
            </button>
            <button
              onClick={() => router.push('/dashboard')}
              className="rounded-full border-2 border-[#FFB3BA] bg-[#FFE6EB] px-4 py-2 text-xs font-semibold text-[#FF6F91] transition-transform hover:-translate-y-0.5"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
