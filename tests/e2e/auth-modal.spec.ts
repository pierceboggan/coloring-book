import { test, expect } from '@playwright/test'
import { unlockPreview } from './helpers/auth'

test.describe('Authentication modal', () => {
  test.beforeEach(async ({ page }) => {
    await unlockPreview(page)
  })

  test('shows an error when credentials are invalid', async ({ page }) => {
    await page.route('**/auth/v1/token?grant_type=password', async (route) => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'invalid_grant',
          error_description: 'Invalid login credentials',
        }),
      })
    })

    await page.goto('/')

    await page.getByRole('button', { name: 'Sign In' }).click()
    await expect(page.getByRole('heading', { name: 'Sign in to keep coloring' })).toBeVisible()

    await page.getByLabel('Email').fill('parent@example.com')
    await page.getByLabel('Password').fill('wrong-password')

    await page.getByRole('button', { name: 'Sign In' }).click()

    await expect(page.getByText('Invalid login credentials')).toBeVisible()
  })

  test('successful sign up shows confirmation instructions', async ({ page }) => {
    await page.route('**/auth/v1/signup', async (route) => {
      const { email } = JSON.parse(route.request().postData() ?? '{}')

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: {
            id: 'new-user-001',
            email,
          },
          session: null,
        }),
      })
    })

    await page.goto('/')

    await page.getByRole('button', { name: 'Sign In' }).click()
    await page.getByRole('button', { name: /Sign up/ }).click()

    await expect(page.getByRole('heading', { name: 'Create your free account' })).toBeVisible()

    await page.getByLabel('Email').fill('new-parent@example.com')
    await page.getByLabel('Password').fill('SuperSecure123!')

    await page.getByRole('button', { name: 'Sign Up' }).click()

    await expect(page.getByText('Please check your email to confirm your account')).toBeVisible()

    await page.getByRole('button', { name: 'Got it!' }).click()

    await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible()
  })
})

