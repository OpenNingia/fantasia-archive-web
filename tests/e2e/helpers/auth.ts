import { Page } from '@playwright/test'

export const MASTER_EMAIL = 'e2e-master@test.local'
export const PLAYER_EMAIL = 'e2e-player@test.local'
export const TEST_PASSWORD = 'E2eTestPass123!'

export const MASTER_STATE = 'tests/e2e/.auth/master.json'
export const PLAYER_STATE = 'tests/e2e/.auth/player.json'

export async function loginAs (page: Page, email: string, password: string) {
  await page.goto('/login')
  await page.waitForLoadState('networkidle')
  await page.locator('input[type="email"]').waitFor({ state: 'visible', timeout: 15000 })
  await page.locator('input[type="email"]').fill(email)
  await page.locator('input[type="password"]').fill(password)
  // Press Enter to submit — more reliable than clicking Quasar's q-btn in headless mode
  await page.locator('input[type="password"]').press('Enter')
  await page.waitForURL('/')
}
