import { test, expect, request as baseRequest } from '@playwright/test'
import { loginAs, MASTER_EMAIL, TEST_PASSWORD, MASTER_STATE } from './helpers/auth'

const API_URL = process.env.API_URL ?? 'http://localhost:3000'

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

test.describe('auth — registration validation', () => {
  test('rejects invalid email format with 400', async () => {
    const ctx = await baseRequest.newContext({ baseURL: API_URL })
    const res = await ctx.post('/auth/local/register', {
      data: { email: 'not-an-email', password: 'ValidPass123', displayName: 'Bad Email' }
    })
    expect(res.status()).toBe(400)
    await ctx.dispose()
  })

  test('rejects passwords shorter than 8 chars with 400', async () => {
    const ctx = await baseRequest.newContext({ baseURL: API_URL })
    const res = await ctx.post('/auth/local/register', {
      data: { email: `short-${Date.now()}@test.local`, password: 'short', displayName: 'Short' }
    })
    expect(res.status()).toBe(400)
    await ctx.dispose()
  })

  test('returns 409 on duplicate registration', async () => {
    const ctx = await baseRequest.newContext({ baseURL: API_URL })
    const res = await ctx.post('/auth/local/register', {
      data: { email: MASTER_EMAIL, password: TEST_PASSWORD, displayName: 'E2E Master' }
    })
    expect(res.status()).toBe(409)
    await ctx.dispose()
  })
})

test.describe('auth — /auth/me', () => {
  test('returns 401 without session', async () => {
    const ctx = await baseRequest.newContext({ baseURL: API_URL })
    const res = await ctx.get('/auth/me')
    expect(res.status()).toBe(401)
    await ctx.dispose()
  })

  test('returns user data when authenticated', async () => {
    const ctx = await baseRequest.newContext({ baseURL: API_URL })
    await ctx.post('/auth/local/login', { data: { email: MASTER_EMAIL, password: TEST_PASSWORD } })
    const res = await ctx.get('/auth/me')
    expect(res.status()).toBe(200)
    const json = await res.json()
    expect(json.email).toBe(MASTER_EMAIL)
    expect(json.id).toBeTruthy()
    await ctx.dispose()
  })
})

test.describe('auth — protected endpoints', () => {
  test('GET /api/projects without session returns 401', async () => {
    const ctx = await baseRequest.newContext({ baseURL: API_URL })
    const res = await ctx.get('/api/projects')
    expect(res.status()).toBe(401)
    await ctx.dispose()
  })
})

test.describe('auth — refresh', () => {
  test('refresh issues new access cookies', async () => {
    const ctx = await baseRequest.newContext({ baseURL: API_URL })
    await ctx.post('/auth/local/login', { data: { email: MASTER_EMAIL, password: TEST_PASSWORD } })
    const res = await ctx.post('/auth/refresh')
    expect(res.status()).toBe(200)
    // After refresh, /auth/me should still work with the new cookies
    const me = await ctx.get('/auth/me')
    expect(me.status()).toBe(200)
    await ctx.dispose()
  })

  test('refresh without cookie returns 401', async () => {
    const ctx = await baseRequest.newContext({ baseURL: API_URL })
    const res = await ctx.post('/auth/refresh')
    expect(res.status()).toBe(401)
    await ctx.dispose()
  })
})
