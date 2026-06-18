const isNonProduction = process.env.NODE_ENV !== 'production'

export function hasSupabasePublicConfig(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
}

export function isDevAuthBypassActive(hasBypassCookie = false): boolean {
  return (
    isNonProduction &&
    (process.env.NEXT_PUBLIC_ENABLE_DEV_AUTH_BYPASS === 'true' ||
      hasBypassCookie ||
      !hasSupabasePublicConfig())
  )
}

export function hasDevAuthBypassCookie(): boolean {
  return (
    typeof document !== 'undefined' &&
    document.cookie
      .split(';')
      .some(cookie => cookie.trim().startsWith('dev-auth-bypass=true'))
  )
}

export function setDevAuthBypassCookie(): void {
  if (typeof document === 'undefined') {
    return
  }

  document.cookie = 'dev-auth-bypass=true; Path=/; SameSite=Lax'
}
