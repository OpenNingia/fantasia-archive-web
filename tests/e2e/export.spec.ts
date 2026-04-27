import { test, expect } from '@playwright/test'
import { MASTER_STATE } from './helpers/auth'
import { createProject, deleteProject, createDocument, getBlueprints } from './helpers/api'

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
