import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { logger } from '@/lib/logger'

type MiddlewareCookieOptions = {
  domain?: string
  expires?: Date
  httpOnly?: boolean
  maxAge?: number
  path?: string
  sameSite?: boolean | 'lax' | 'strict' | 'none'
  secure?: boolean
}

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
    logger.debug('Dev auth bypass active, skipping Supabase session enforcement')
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
        set(name: string, value: string, options: MiddlewareCookieOptions) {
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
        remove(name: string, options: MiddlewareCookieOptions) {
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

  logger.debug('Middleware checking auth', { pathname: req.nextUrl.pathname })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  logger.debug('Session check result', { authenticated: Boolean(session) })

  const protectedApiPrefixes = [
    '/api/regenerate-coloring-page',
    '/api/retry-processing',
    '/api/images',
  ]

  if (protectedApiPrefixes.some(path => req.nextUrl.pathname.startsWith(path))) {
    if (!session) {
      logger.warn('Blocking unauthenticated request to protected API', {
        pathname: req.nextUrl.pathname,
      })
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    logger.debug('Allowing authenticated request to protected API', {
      pathname: req.nextUrl.pathname,
    })
  }

  if (req.nextUrl.pathname.startsWith('/dashboard')) {
    if (!session) {
      logger.debug('Redirecting unauthenticated user from dashboard')
      const redirectUrl = req.nextUrl.clone()
      redirectUrl.pathname = '/'
      return NextResponse.redirect(redirectUrl)
    }
    logger.debug('Authenticated access to dashboard')
  }

  return responses
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/api/regenerate-coloring-page',
    '/api/retry-processing',
    '/api/images/:path*',
  ],
}
