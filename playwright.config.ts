import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  globalSetup: './tests/e2e/global-setup',
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  reporter: [['html', { open: 'never' }], ['line']],
  use: {
    baseURL: process.env.BASE_URL ?? 'http://localhost:9000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
})
