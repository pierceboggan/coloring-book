'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, Session, AuthError } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

type OAuthProvider = 'google' | 'facebook' | 'apple'

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
  ) => Promise<{ error: AuthError | null }>
  signOut: () => Promise<void>
  deleteAccount: () => Promise<{ error: string | null }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
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
    if (error) {
      console.error('❌ Sign up failed:', error)
    } else {
      console.log('✅ Sign up successful')
    }
    return { error }
  }

  const signInWithProvider = async (provider: OAuthProvider) => {
    console.log('🔑 Attempting OAuth sign in with provider:', provider)

    const redirectTo =
      typeof window !== 'undefined'
        ? `${window.location.origin}/dashboard`
        : undefined

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo },
    })

    if (error) {
      console.error('❌ OAuth sign in failed:', provider, error)
    } else if (data?.url) {
      console.log('🌍 Redirecting to OAuth provider:', provider)
      if (typeof window !== 'undefined') {
        window.location.href = data.url
      }
    }

    return { error }
  }

  const signOut = async () => {
    console.log('🚪 Signing out user')
    await supabase.auth.signOut()
    console.log('✅ Sign out complete')
  }

  const deleteAccount = async () => {
    console.log('🗑️ Initiating account deletion flow')

    try {
      const currentSession =
        session ??
        (await supabase.auth.getSession()).data.session ??
        null

      const accessToken = currentSession?.access_token

      if (!accessToken) {
        console.error('❌ Account deletion failed: no active session token found')
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
        return { error: errorMessage }
      }

      await supabase.auth.signOut()
      setUser(null)
      setSession(null)

      console.log('✅ Account deleted and user signed out locally')
      return { error: null }
    } catch (error) {
      console.error('💥 Unexpected error during account deletion:', error)
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