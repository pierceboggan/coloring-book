import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: req.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          req.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: req.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: any) {
          req.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: req.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  console.log('🔒 Middleware checking auth for:', req.nextUrl.pathname)

  const {
    data: { session },
  } = await supabase.auth.getSession()

  console.log('🔍 Session check result:', session ? 'Authenticated' : 'Not authenticated')

  // Protected API routes
  if (req.nextUrl.pathname.startsWith('/api/generate-coloring-page')) {
    if (!session) {
      console.log('❌ Blocking unauthenticated request to protected API')
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    console.log('✅ Allowing authenticated request to protected API')
  }

  return response
}

export const config = {
  matcher: []
}