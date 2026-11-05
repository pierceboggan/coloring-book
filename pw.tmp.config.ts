import base from './playwright.config'
import { defineConfig } from '@playwright/test'

export default defineConfig({
  ...base,
  testDir: '/workspaces/coloring-book/pierceboggan/coloring-book/tests/e2e',
  projects: [{ name: 'chromium', use: { channel: 'chrome', video: 'off' } }],
})
