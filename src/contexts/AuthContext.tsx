'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import * as amplitude from '@amplitude/analytics-browser'
import { User, Session, AuthError } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

type OAuthProvider = 'google' | 'facebook' | 'apple'
type SignInWithOAuthResult = Awaited<
  ReturnType<typeof supabase.auth.signInWithOAuth>
>

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signIn: (
    email: string,
    password: string
  ) => Promise<{ error: AuthError | null }>
  signUp: (
    email: string,
    password: string
  ) => Promise<{ error: AuthError | null }>
  signInWithProvider: (
    provider: OAuthProvider
  ) => Promise<SignInWithOAuthResult>
  signOut: () => Promise<void>
  deleteAccount: () => Promise<{ error: string | null }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user?.id) {
      amplitude.setUserId(user.id)
    }
  }, [user?.id])

  useEffect(() => {
    const allowDevBypassFlag = process.env.NEXT_PUBLIC_ENABLE_DEV_AUTH_BYPASS === 'true'
    const hasDevBypass =
      typeof window !== 'undefined' &&
      process.env.NODE_ENV !== 'production' &&
      (document.cookie.split(';').some(cookie => cookie.trim().startsWith('dev-auth-bypass=true')) || allowDevBypassFlag)

    if (hasDevBypass) {
      const devUser: User = {
        id: 'dev-user',
        email: 'dev@coloringbook.ai',
        aud: 'authenticated',
        role: 'authenticated',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        email_confirmed_at: new Date().toISOString(),
        phone: '',
        phone_confirmed_at: null,
        app_metadata: { provider: 'email', providers: ['email'] },
        user_metadata: {},
        identities: [],
        last_sign_in_at: new Date().toISOString(),
        factors: [],
        is_anonymous: false,
      }

      const devSession: Session = {
        access_token: 'dev-access-token',
        refresh_token: 'dev-refresh-token',
        token_type: 'bearer',
        expires_in: 3600,
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        provider_token: null,
        provider_refresh_token: null,
        user: devUser,
      }

      console.log('🛠️ Dev auth bypass session applied')
      setSession(devSession)
      setUser(devUser)
      setLoading(false)
      return
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('🔍 Initial session check:', session ? 'User logged in' : 'No user')
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('🔄 Auth state changed:', event, session ? 'User logged in' : 'No user')
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    console.log('🔐 Attempting sign in for:', email)
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    amplitude.track('auth_sign_in_completed', {
      method: 'password',
      result: error ? 'error' : 'success',
    })
    if (error) {
      console.error('❌ Sign in failed:', error)
    } else {
      console.log('✅ Sign in successful')
    }
    return { error }
  }

  const signUp = async (email: string, password: string) => {
    console.log('📝 Attempting sign up for:', email)
    const { error } = await supabase.auth.signUp({
      email,
      password,
    })
    amplitude.track('auth_sign_up_completed', {
      method: 'password',
      result: error ? 'error' : 'success',
    })
    if (error) {
      console.error('❌ Sign up failed:', error)
    } else {
      console.log('✅ Sign up successful')
    }
    return { error }
  }

  const signInWithProvider = async (
    provider: OAuthProvider
  ): Promise<SignInWithOAuthResult> => {
    console.log('🔑 Attempting OAuth sign in with provider:', provider)

    const redirectTo =
      typeof window !== 'undefined'
        ? `${window.location.origin}/dashboard`
        : undefined

    const result = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo },
    })

    amplitude.track('auth_oauth_sign_in_completed', {
      provider,
      result: result.error ? 'error' : 'success',
    })

    if (result.error) {
      console.error('❌ OAuth sign in failed:', provider, result.error)
    } else if (result.data?.url) {
      console.log('🌍 OAuth provider returned redirect URL:', provider)
    }

    return result
  }

  const signOut = async () => {
    console.log('🚪 Signing out user')
    await supabase.auth.signOut()
    amplitude.track('auth_sign_out_completed')
    amplitude.reset()
    console.log('✅ Sign out complete')
  }

  const deleteAccount = async () => {
    console.log('🗑️ Initiating account deletion flow')

    amplitude.track('account_deletion_started')

    try {
      const currentSession =
        session ??
        (await supabase.auth.getSession()).data.session ??
        null

      const accessToken = currentSession?.access_token

      if (!accessToken) {
        console.error('❌ Account deletion failed: no active session token found')
        amplitude.track('account_deletion_completed', {
          result: 'error',
          reason: 'missing_session',
        })
        return { error: 'No active session found' }
      }

      const response = await fetch('/api/delete-account', {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      let responseBody: unknown
      try {
        responseBody = await response.json()
      } catch (parseError) {
        console.warn('⚠️ No JSON response body received after account deletion request', parseError)
        responseBody = null
      }

      if (!response.ok) {
        const hasErrorMessage =
          typeof responseBody === 'object' &&
          responseBody !== null &&
          Object.prototype.hasOwnProperty.call(responseBody, 'error')

        const errorMessage = hasErrorMessage
          ? String((responseBody as { error?: unknown }).error ?? 'Failed to delete account')
          : 'Failed to delete account'
        console.error('❌ Account deletion request failed:', errorMessage)
        amplitude.track('account_deletion_completed', {
          result: 'error',
          reason: 'request_failed',
        })
        return { error: errorMessage }
      }

      await supabase.auth.signOut()
      setUser(null)
      setSession(null)

      console.log('✅ Account deleted and user signed out locally')
      amplitude.track('account_deletion_completed', {
        result: 'success',
      })
      return { error: null }
    } catch (error) {
      console.error('💥 Unexpected error during account deletion:', error)
      amplitude.track('account_deletion_completed', {
        result: 'error',
        reason: 'unexpected_error',
      })
      return {
        error: error instanceof Error ? error.message : 'Failed to delete account',
      }
    }
  }

  const value = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signInWithProvider,
    signOut,
    deleteAccount,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
