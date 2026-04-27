import { request } from '@playwright/test'
import fs from 'fs'
import path from 'path'

export const API_URL = process.env.API_URL ?? 'http://localhost:3000'
export const BASE_URL = process.env.BASE_URL ?? 'http://localhost:9000'
export const MASTER_EMAIL = 'e2e-master@test.local'
export const PLAYER_EMAIL = 'e2e-player@test.local'
export const TEST_PASSWORD = 'E2eTestPass123!'

export default async function globalSetup () {
  const api = await request.newContext({ baseURL: API_URL })

  for (const [email, displayName] of [
    [MASTER_EMAIL, 'E2E Master'],
    [PLAYER_EMAIL, 'E2E Player'],
  ]) {
    await api.post('/auth/local/register', {
      data: { email, password: TEST_PASSWORD, displayName }
    })
    // 409 = already registered — that's fine
  }
  await api.dispose()

  const authDir = path.join(__dirname, '.auth')
  fs.mkdirSync(authDir, { recursive: true })

  for (const [email, stateFile] of [
    [MASTER_EMAIL, 'master.json'],
    [PLAYER_EMAIL, 'player.json'],
  ]) {
    // Use the proxy (BASE_URL) so cookies are scoped to localhost:9000, matching what tests see
    const loginCtx = await request.newContext({ baseURL: BASE_URL })
    const res = await loginCtx.post('/auth/local/login', {
      data: { email, password: TEST_PASSWORD }
    })
    if (!res.ok()) throw new Error(`Login failed for ${email}: ${res.status()}`)
    await loginCtx.storageState({ path: path.join(authDir, stateFile as string) })
    await loginCtx.dispose()
  }
}
