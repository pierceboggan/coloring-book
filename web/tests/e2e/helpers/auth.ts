import { Page } from '@playwright/test'

export interface TestUser {
  id: string
  email: string
}

const DEFAULT_TEST_USER: TestUser = {
  id: 'test-user-123',
  email: 'parent@example.com',
}

const getSupabaseProjectRef = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

  if (!supabaseUrl) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL must be defined when running Playwright tests')
  }

  const url = new URL(supabaseUrl)
  const hostname = url.hostname

  if (!hostname) {
    throw new Error(`Unable to determine Supabase project reference from URL: ${supabaseUrl}`)
  }

  // Supabase stores auth state in localStorage using the pattern sb-<project-ref>-auth-token
  const projectRef = hostname.split('.')[0]

  if (!projectRef) {
    throw new Error(`Invalid Supabase hostname: ${hostname}`)
  }

  return projectRef
}

export const unlockPreview = async (page: Page) => {
  await page.addInitScript(() => {
    window.sessionStorage.setItem('dev_authenticated', 'true')
  })
}

export const seedSupabaseAuthState = async (page: Page, user: TestUser = DEFAULT_TEST_USER) => {
  const projectRef = getSupabaseProjectRef()
  const storageKey = `sb-${projectRef}-auth-token`
  const expiresAt = Math.floor(Date.now() / 1000) + 60 * 60

  const session = {
    access_token: 'test-access-token',
    refresh_token: 'test-refresh-token',
    token_type: 'bearer',
    expires_in: 60 * 60,
    expires_at: expiresAt,
    user: {
      id: user.id,
      email: user.email,
      aud: 'authenticated',
      role: 'authenticated',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      email_confirmed_at: new Date().toISOString(),
      app_metadata: { provider: 'email', providers: ['email'] },
      user_metadata: {},
      identities: [],
      last_sign_in_at: new Date().toISOString(),
    },
  }

  const storageValue = {
    currentSession: session,
    expires_at: expiresAt,
    expires_in: session.expires_in,
    refresh_token: session.refresh_token,
    token_type: session.token_type,
    user: session.user,
  }

  await page.addInitScript(
    ({ key, value }) => {
      window.localStorage.setItem(key, JSON.stringify(value))
    },
    { key: storageKey, value: storageValue }
  )
}

export const authenticateTestUser = async (page: Page, user: TestUser = DEFAULT_TEST_USER) => {
  await seedSupabaseAuthState(page, user)
  return user
}

