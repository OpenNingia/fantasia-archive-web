import { test, expect } from '@playwright/test'
import { MASTER_STATE, PLAYER_EMAIL, apiContextAs } from './helpers/auth'
import {
  createProject, deleteProject, createDocument, getBlueprints,
  addProjectMember, getUserId, listDocuments
} from './helpers/api'

test.use({ storageState: MASTER_STATE })

const API_URL = process.env.API_URL ?? 'http://localhost:3000'

let projectId: string

test.beforeEach(async ({ request }) => {
  projectId = await createProject(request, `E2E-Export-${Date.now()}`)
  const blueprints = await getBlueprints(request, projectId)
  await createDocument(request, projectId, blueprints[0].slug)
})

test.afterEach(async ({ request }) => {
  if (projectId) await deleteProject(request, projectId)
})

test('export endpoint returns a ZIP blob', async ({ request }) => {
  const res = await request.get(`${API_URL}/api/projects/${projectId}/export`)
  expect(res.status()).toBe(200)
  expect(res.headers()['content-type']).toContain('zip')
  const body = await res.body()
  // ZIP magic bytes: PK (0x50 0x4B)
  expect(body[0]).toBe(0x50)
  expect(body[1]).toBe(0x4B)
})

test('import restores documents from a ZIP', async ({ request }) => {
  // Export
  const exportRes = await request.get(`${API_URL}/api/projects/${projectId}/export`)
  const zipBuffer = await exportRes.body()

  // Create fresh project to import into
  const targetId = await createProject(request, `E2E-Import-${Date.now()}`)

  try {
    const importRes = await request.post(`${API_URL}/api/projects/${targetId}/import`, {
      multipart: {
        file: {
          name: 'backup.zip',
          mimeType: 'application/zip',
          buffer: zipBuffer
        }
      }
    })
    const importBody = await importRes.json().catch(() => ({}))
    expect(importRes.status(), `import failed: ${JSON.stringify(importBody)}`).toBe(200)

    // Verify documents exist in target project
    const docsRes = await request.get(`${API_URL}/api/projects/${targetId}/documents`)
    const docs = await docsRes.json()
    expect(Array.isArray(docs)).toBe(true)
    expect(docs.length).toBeGreaterThan(0)
  } finally {
    await deleteProject(request, targetId)
  }
})

test('export of a project with no documents still returns a valid ZIP', async ({ request }) => {
  // Empty project — no documents, but seeded blueprints
  const emptyId = await createProject(request, `E2E-Export-Empty-${Date.now()}`)
  try {
    const res = await request.get(`${API_URL}/api/projects/${emptyId}/export`)
    expect(res.status()).toBe(200)
    const body = await res.body()
    expect(body[0]).toBe(0x50)
    expect(body[1]).toBe(0x4B)
    expect(body.length).toBeGreaterThan(22) // EOCD record alone is 22 bytes
  } finally {
    await deleteProject(request, emptyId)
  }
})

test('player cannot import (403 — requireMaster)', async ({ request }) => {
  // Add player as member of the current project, then try to POST /import as player
  const playerCtx = await apiContextAs(PLAYER_EMAIL)
  try {
    const playerId = await getUserId(playerCtx)
    await addProjectMember(request, projectId, playerId, 'player')

    // Build a minimal valid ZIP-ish buffer (server will reject before parsing on permissions)
    const dummy = Buffer.from('dummy')
    const res = await playerCtx.post(`${API_URL}/api/projects/${projectId}/import`, {
      multipart: {
        file: { name: 'x.zip', mimeType: 'application/zip', buffer: dummy }
      }
    })
    expect(res.status()).toBe(403)
  } finally {
    await playerCtx.dispose()
  }
})

test('import preserves the document count after roundtrip', async ({ request }) => {
  // Add two more documents so total is 3 (one was created in beforeEach)
  const blueprints = await getBlueprints(request, projectId)
  await createDocument(request, projectId, blueprints[0].slug)
  await createDocument(request, projectId, blueprints[0].slug)

  const before = await listDocuments(request, projectId)
  expect(before.length).toBe(3)

  const exportRes = await request.get(`${API_URL}/api/projects/${projectId}/export`)
  const zipBuffer = await exportRes.body()

  const targetId = await createProject(request, `E2E-Roundtrip-${Date.now()}`)
  try {
    const importRes = await request.post(`${API_URL}/api/projects/${targetId}/import`, {
      multipart: {
        file: { name: 'backup.zip', mimeType: 'application/zip', buffer: zipBuffer }
      }
    })
    expect(importRes.status()).toBe(200)

    const after = await listDocuments(request, targetId)
    expect(after.length).toBe(before.length)
  } finally {
    await deleteProject(request, targetId)
  }
})
