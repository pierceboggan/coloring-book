'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
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
    console.log('✅ Sign out complete')
  }

  const value = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signInWithProvider,
    signOut,
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