import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  let responses = NextResponse.next({
    request: {
      headers: req.headers,
    },
  })

  const devBypassEnabled =
    process.env.NODE_ENV !== 'production' &&
    (process.env.NEXT_PUBLIC_ENABLE_DEV_AUTH_BYPASS === 'true' ||
      req.cookies.get('dev-auth-bypass')?.value === 'true')

  if (devBypassEnabled) {
    console.log('🛠️ Dev auth bypass active, skipping Supabase session enforcement')
    return responses
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions = {}) {
          req.cookies.set({
            name,
            value,
            ...options,
          })
          responses = NextResponse.next({
            request: {
              headers: req.headers,
            },
          })
          responses.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions = {}) {
          req.cookies.set({
            name,
            value: '',
            ...options,
          })
          responses = NextResponse.next({
            request: {
              headers: req.headers,
            },
          })
          responses.cookies.set({
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

  const protectedApiPrefixes = [
    '/api/generate-coloring-page',
    '/api/regenerate-coloring-page',
    '/api/retry-processing',
    '/api/images',
  ]

  if (protectedApiPrefixes.some(path => req.nextUrl.pathname.startsWith(path))) {
    if (!session) {
      console.log('❌ Blocking unauthenticated request to protected API')
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    console.log('✅ Allowing authenticated request to protected API')
  }

  if (req.nextUrl.pathname.startsWith('/dashboard')) {
    if (!session) {
      console.log('❌ Redirecting unauthenticated user from dashboard')
      const redirectUrl = req.nextUrl.clone()
      redirectUrl.pathname = '/'
      return NextResponse.redirect(redirectUrl)
    }
    console.log('✅ Authenticated access to dashboard')
  }

  return responses
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/api/generate-coloring-page',
    '/api/regenerate-coloring-page',
    '/api/retry-processing',
    '/api/images/:path*',
  ],
}
