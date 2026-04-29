import { test, expect } from '@playwright/test'
import { MASTER_STATE, MASTER_EMAIL, PLAYER_EMAIL } from './helpers/auth'

const API_URL = process.env.API_URL ?? 'http://localhost:3000'

test.use({ storageState: MASTER_STATE })

test.describe('/api/users/me', () => {
  test('returns current user id, email, displayName', async ({ request }) => {
    const res = await request.get(`${API_URL}/api/users/me`)
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.email).toBe(MASTER_EMAIL)
    expect(body.id).toBeTruthy()
    expect(body.displayName).toBeTruthy()
  })
})

test.describe('/api/users/me/settings', () => {
  test('GET returns an object (defaults to {})', async ({ request }) => {
    const res = await request.get(`${API_URL}/api/users/me/settings`)
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(typeof body).toBe('object')
  })

  test('PUT then GET roundtrips the same payload', async ({ request }) => {
    const payload = { theme: 'dark', sidebarWidth: 280, lastVisited: `e2e-${Date.now()}` }
    const put = await request.put(`${API_URL}/api/users/me/settings`, { data: payload })
    expect(put.status()).toBe(200)

    const get = await request.get(`${API_URL}/api/users/me/settings`)
    const body = await get.json()
    expect(body).toMatchObject(payload)
  })
})

test.describe('/api/users/search', () => {
  test('returns matches for partial email', async ({ request }) => {
    // Both seeded users have "@test.local" — searching "test.local" must include them
    const res = await request.get(`${API_URL}/api/users/search?email=test.local`)
    expect(res.status()).toBe(200)
    const body = await res.json() as Array<{ email: string }>
    const emails = body.map(u => u.email)
    expect(emails).toContain(MASTER_EMAIL)
    expect(emails).toContain(PLAYER_EMAIL)
  })

  test('rejects queries shorter than 3 chars with 400', async ({ request }) => {
    const res = await request.get(`${API_URL}/api/users/search?email=ab`)
    expect(res.status()).toBe(400)
  })

  test('rejects missing query with 400', async ({ request }) => {
    const res = await request.get(`${API_URL}/api/users/search`)
    expect(res.status()).toBe(400)
  })
})
