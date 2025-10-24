import { test, expect } from '@playwright/test'

test.describe('Password protection', () => {
  test('requires the preview password before showing the app', async ({ page }) => {
    await page.goto('/')

    await expect(page.getByRole('heading', { name: 'ColoringBook.ai' })).toBeVisible()

    await page.getByLabel('Enter Password').fill('wrong-password')
    await page.getByRole('button', { name: 'Access Site' }).click()
    await expect(page.getByText('Incorrect password')).toBeVisible()

    await page.getByLabel('Enter Password').fill('parkcityutah')
    await page.getByRole('button', { name: 'Access Site' }).click()

    await expect(page.getByRole('heading', { name: /Turn Photos into/ })).toBeVisible()
  })
})
