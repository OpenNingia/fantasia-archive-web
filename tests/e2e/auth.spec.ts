import { test, expect } from '@playwright/test'
import { loginAs, MASTER_EMAIL, TEST_PASSWORD, MASTER_STATE } from './helpers/auth'

test.describe('auth — unauthenticated redirect', () => {
  test('redirects / to /login when not logged in', async ({ page }) => {
    await page.goto('/')
    await page.waitForURL('**/login**')
    await page.waitForLoadState('networkidle')
    await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: 15000 })
  })
})

test.describe('auth — login flow', () => {
  test('logs in with valid credentials and shows project list', async ({ page }) => {
    await loginAs(page, MASTER_EMAIL, TEST_PASSWORD)
    await expect(page.getByText('Your Projects')).toBeVisible()
  })

  test('shows error on invalid password', async ({ page }) => {
    await page.goto('/login')
    await page.waitForLoadState('networkidle')
    await page.locator('input[type="email"]').waitFor({ state: 'visible', timeout: 15000 })
    await page.locator('input[type="email"]').fill(MASTER_EMAIL)
    await page.locator('input[type="password"]').fill('wrong-password')
    await page.locator('input[type="password"]').press('Enter')
    await expect(page.getByText('Invalid email or password')).toBeVisible()
  })
})

test.describe('auth — logout', () => {
  test.use({ storageState: MASTER_STATE })

  test('logout redirects to /login', async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('[data-testid="logout-btn"]')
    await page.click('[data-testid="logout-btn"]')
    await page.waitForURL('**/login**')
    await page.waitForLoadState('networkidle')
    await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: 15000 })
  })
})
