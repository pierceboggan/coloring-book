'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Apple, Chrome, Facebook, Loader2, Sparkles, Wand2 } from 'lucide-react'

type OAuthProvider = 'google' | 'facebook' | 'apple'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [oauthLoading, setOauthLoading] = useState<OAuthProvider | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showEmailConfirmation, setShowEmailConfirmation] = useState(false)
  const { signIn, signUp, signInWithProvider } = useAuth()
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
      const { error } = isLogin ? await signIn(email, password) : await signUp(email, password)

      if (error) {
        console.error('❌ Authentication error:', error)
        setError(error.message)
      } else {
        console.log('✅ Authentication successful:', isLogin ? 'Sign In' : 'Sign Up')
        if (isLogin) {
          console.log('🚀 Redirecting to dashboard after successful login')
          onClose()
          setEmail('')
          setPassword('')
          router.push('/dashboard')
        } else {
          console.log('📧 Sign up successful, check email for confirmation')
          setShowEmailConfirmation(true)
        }
      }
    } catch (err) {
      console.error('💥 Authentication exception:', err)
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleOAuthSignIn = async (provider: OAuthProvider) => {
    setError(null)
    setOauthLoading(provider)

    try {
      const { data, error } = await signInWithProvider(provider)

      if (error) {
        console.error('❌ OAuth authentication error:', provider, error)
        setError(error.message)
      } else if (data?.url) {
        console.log('🌐 Redirecting to OAuth provider:', provider)
        if (typeof window !== 'undefined') {
          window.location.assign(data.url)
        }
      } else {
        console.warn('⚠️ OAuth provider did not return a redirect URL:', provider)
        setError('Unable to redirect to the selected provider. Please try again.')
      }
    } catch (err) {
      console.error('💥 OAuth authentication exception:', err)
      setError('An unexpected error occurred while connecting to the provider')
    } finally {
      setOauthLoading(null)
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
              className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-50 text-purple-500 transition hover:bg-purple-100 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2"
              aria-label="Close authentication dialog"
            >
              ×
            </button>
          </div>

          {showEmailConfirmation ? (
            <div className="space-y-6">
              <div className="rounded-2xl bg-gradient-to-r from-green-50 via-emerald-50 to-teal-50 p-6 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white text-green-500 shadow-sm">
                  <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 19v-8.93a2 2 0 01.89-1.664l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-1.14.76a2 2 0 01-2.22 0l-1.14-.76" />
                  </svg>
                </div>
                <h3 className="mb-2 text-lg font-bold text-gray-800">
                  Please check your email to confirm your account
                </h3>
                <p className="text-sm text-gray-600">
                  We&apos;ve sent a confirmation link to <strong>{email}</strong>. Click the link in the email to activate your account and start creating!
                </p>
              </div>
              <button
                onClick={() => {
                  setShowEmailConfirmation(false)
                  setEmail('')
                  setPassword('')
                  onClose()
                }}
                className="w-full rounded-full bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:from-purple-700 hover:via-pink-700 hover:to-orange-600 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2"
              >
                Got it!
              </button>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {[{
                  id: 'google' as const,
                  label: 'Continue with Google',
                  icon: Chrome,
                }, {
                  id: 'facebook' as const,
                  label: 'Continue with Facebook',
                  icon: Facebook,
                }, {
                  id: 'apple' as const,
                  label: 'Continue with Apple',
                  icon: Apple,
                }].map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => handleOAuthSignIn(id)}
                    disabled={oauthLoading !== null}
                    className="flex w-full items-center justify-center gap-3 rounded-full border border-gray-200 bg-white px-6 py-3 text-sm font-semibold text-gray-700 shadow-sm transition hover:border-purple-200 hover:text-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {oauthLoading === id ? (
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    ) : (
                      <Icon className="h-4 w-4" aria-hidden="true" />
                    )}
                    <span>{label}</span>
                  </button>
                ))}
              </div>

              <div className="relative my-6 text-center text-xs font-semibold uppercase tracking-wide text-gray-400">
                <span className="relative z-10 bg-white px-3">Or continue with email</span>
                <div className="absolute inset-y-1/2 left-0 right-0 z-0 h-px -translate-y-1/2 bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
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

                {error && <div className="text-red-600 text-sm">{error}</div>}

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
            </>
          )}
        </div>
      </div>
    </div>
  )
}