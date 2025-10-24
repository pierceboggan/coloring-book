'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Sparkles, Wand2 } from 'lucide-react'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { signIn, signUp } = useAuth()
  const router = useRouter()
  const funMessage = useMemo(() => {
    const messages = [
      '✨ Ready to color outside the lines?',
      '🖍️ Adventure awaits—log in to unlock more magic!',
      '🌈 Your next masterpiece is just a sign-in away!',
      "🎨 Let's make something colorful together!",
    ]

    return messages[Math.floor(Math.random() * messages.length)]
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    console.log('🔐 Authentication attempt:', { isLogin, email })

    try {
      const { error } = isLogin
        ? await signIn(email, password)
        : await signUp(email, password)

      if (error) {
        console.error('❌ Authentication error:', error)
        setError(error.message)
      } else {
        console.log('✅ Authentication successful:', isLogin ? 'Sign In' : 'Sign Up')
        onClose()
        setEmail('')
        setPassword('')
        if (isLogin) {
          console.log('🚀 Redirecting to dashboard after successful login')
          router.push('/dashboard')
        } else {
          console.log('📧 Sign up successful, check email for confirmation')
          setError('Please check your email to confirm your account')
        }
      }
    } catch (err) {
      console.error('💥 Authentication exception:', err)
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 px-4">
      <div className="relative w-full max-w-md">
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-purple-500/50 via-pink-400/40 to-orange-300/40 blur-3xl" />
        <div className="relative bg-white/90 backdrop-blur rounded-3xl p-8 shadow-2xl border border-white/60">
          <div className="flex items-start justify-between mb-6">
            <div>
              <p className="inline-flex items-center text-sm font-semibold uppercase tracking-wide text-purple-600">
                <Sparkles className="mr-2 h-4 w-4" />
                {isLogin ? 'Welcome Back' : 'Join the Fun'}
              </p>
              <h2 className="mt-2 text-2xl font-bold text-gray-800">
                {isLogin ? 'Sign in to keep coloring' : 'Create your free account'}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-50 text-purple-500 transition hover:bg-purple-100"
              aria-label="Close authentication dialog"
            >
              ×
            </button>
          </div>

          <div className="mb-6 rounded-2xl bg-gradient-to-r from-purple-50 via-pink-50 to-orange-50 p-4 text-sm text-purple-700">
            <div className="flex items-start gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-purple-500 shadow-sm">
                <Wand2 className="h-4 w-4" />
              </span>
              <p className="leading-relaxed">{funMessage}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                required
              />
            </div>

            {error && (
              <div className="text-red-600 text-sm">{error}</div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:from-purple-700 hover:via-pink-700 hover:to-orange-600 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Mixing colors...' : isLogin ? 'Sign In' : 'Sign Up'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="font-semibold text-purple-600 transition hover:text-purple-700"
            >
              {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}