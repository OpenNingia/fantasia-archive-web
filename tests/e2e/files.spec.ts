import { test, expect } from '@playwright/test'
import { MASTER_STATE, PLAYER_STATE, apiContextAs, MASTER_EMAIL } from './helpers/auth'
import { createProject, deleteProject } from './helpers/api'

const API_URL = process.env.API_URL ?? 'http://localhost:3000'

test.use({ storageState: MASTER_STATE })

let projectId: string

test.beforeEach(async ({ request }) => {
  projectId = await createProject(request, `E2E-Files-${Date.now()}`)
})

test.afterEach(async ({ request }) => {
  if (projectId) await deleteProject(request, projectId)
})

test('upload then GET roundtrips file bytes', async ({ request }) => {
  const bytes = Buffer.from('hello-fantasia-archive', 'utf8')
  const upload = await request.post(`${API_URL}/files/upload`, {
    multipart: {
      projectId,
      file: { name: 'hello.txt', mimeType: 'text/plain', buffer: bytes }
    }
  })
  expect(upload.status()).toBe(200)
  const { id, url } = await upload.json()
  expect(id).toBeTruthy()
  expect(url).toBe(`/files/${id}`)

  const fetched = await request.get(`${API_URL}/files/${id}`)
  expect(fetched.status()).toBe(200)
  const body = await fetched.body()
  expect(body.toString('utf8')).toBe(bytes.toString('utf8'))
})

test('upload without a file part returns 400', async ({ request }) => {
  const res = await request.post(`${API_URL}/files/upload`, {
    multipart: { projectId }
  })
  expect(res.status()).toBe(400)
})

test('GET on unknown file id returns 404', async ({ request }) => {
  const res = await request.get(`${API_URL}/files/00000000-0000-0000-0000-000000000000`)
  expect(res.status()).toBe(404)
})

test('player without project membership cannot fetch the uploaded file (403)', async ({ request }) => {
  // Master uploads
  const upload = await request.post(`${API_URL}/files/upload`, {
    multipart: {
      projectId,
      file: { name: 'secret.txt', mimeType: 'text/plain', buffer: Buffer.from('top-secret') }
    }
  })
  const { id } = await upload.json()

  // Player tries to fetch — they're not a member of this project
  const playerCtx = await apiContextAs('e2e-player@test.local')
  try {
    const res = await playerCtx.get(`${API_URL}/files/${id}`)
    expect(res.status()).toBe(403)
  } finally {
    await playerCtx.dispose()
  }
})
