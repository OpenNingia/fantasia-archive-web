import { test, expect } from '@playwright/test'
import { MASTER_STATE } from './helpers/auth'
import {
  createProject, deleteProject, getBlueprints, createDocument,
  listDocuments, getDocument, updateDocument, deleteDocument
} from './helpers/api'

test.use({ storageState: MASTER_STATE })

let projectId: string
let projectName: string
let firstBlueprintSlug: string

test.beforeEach(async ({ request }) => {
  projectName = `E2E-Docs-${Date.now()}`
  projectId = await createProject(request, projectName)
  const blueprints = await getBlueprints(request, projectId)
  firstBlueprintSlug = blueprints[0].slug
})

test.afterEach(async ({ request }) => {
  if (projectId) await deleteProject(request, projectId)
})

async function openProject (page: import('@playwright/test').Page, name: string) {
  await page.goto('/')
  await page.waitForLoadState('networkidle')
  // Select the project by its exact name to avoid picking a stale project from a previous run
  await page.getByText(name, { exact: true }).click()
  await page.getByRole('button', { name: 'Open Project' }).click()
  await page.waitForURL('/project')
}

test('document created via API appears in the tree after page load', async ({ page, request }) => {
  await createDocument(request, projectId, firstBlueprintSlug)
  await openProject(page, projectName)
  // The ObjectTree renders document nodes — at least one node should be visible
  await expect(page.locator('.q-tree').first()).toBeVisible()
  await expect(page.locator('.q-tree__node').first()).toBeVisible()
})

test('"Loading your project..." disappears after the project tree loads', async ({ page, request }) => {
  await createDocument(request, projectId, firstBlueprintSlug)
  await openProject(page, projectName)
  await expect(page.getByText('Loading your project...')).not.toBeVisible()
})

test.describe('documents — API CRUD', () => {
  test('GET /documents lists docs created via API', async ({ request }) => {
    await createDocument(request, projectId, firstBlueprintSlug)
    await createDocument(request, projectId, firstBlueprintSlug)
    const docs = await listDocuments(request, projectId)
    expect(docs.length).toBe(2)
    expect(docs.every(d => d.type === firstBlueprintSlug)).toBe(true)
  })

  test('GET /documents/:type/:id returns a single doc', async ({ request }) => {
    const created = await createDocument(request, projectId, firstBlueprintSlug)
    const { status, body } = await getDocument(request, projectId, firstBlueprintSlug, created.id)
    expect(status).toBe(200)
    expect(body.id).toBe(created.id)
    expect(body.type).toBe(firstBlueprintSlug)
  })

  test('GET on non-existent docId returns 404', async ({ request }) => {
    const { status } = await getDocument(
      request,
      projectId,
      firstBlueprintSlug,
      '00000000-0000-0000-0000-000000000000'
    )
    expect(status).toBe(404)
  })

  test('PUT updates a document field and persists', async ({ request }) => {
    const created = await createDocument(request, projectId, firstBlueprintSlug)
    const newFields = [{ id: 'name', value: 'Updated Title' }]
    const { status, body } = await updateDocument(
      request, projectId, firstBlueprintSlug, created.id, { extraFields: newFields }
    )
    expect(status).toBe(200)
    expect(body.doc).toBeDefined()

    const reread = await getDocument(request, projectId, firstBlueprintSlug, created.id)
    const nameField = (reread.body.extraFields as Array<{ id: string; value: unknown }>)
      .find(f => f.id === 'name')
    expect(nameField?.value).toBe('Updated Title')
  })

  test('DELETE removes the document; subsequent GET returns 404', async ({ request }) => {
    const created = await createDocument(request, projectId, firstBlueprintSlug)
    const status = await deleteDocument(request, projectId, firstBlueprintSlug, created.id)
    expect(status).toBe(200)

    const after = await getDocument(request, projectId, firstBlueprintSlug, created.id)
    expect(after.status).toBe(404)
  })

  test('parent/child hierarchy: child carries parentDocId', async ({ request }) => {
    const parent = await createDocument(request, projectId, firstBlueprintSlug)
    // createDocument helper doesn't accept parentDocId; call API directly via updateDocument is wrong for create
    const API_URL = process.env.API_URL ?? 'http://localhost:3000'
    const res = await request.post(`${API_URL}/api/projects/${projectId}/documents/${firstBlueprintSlug}`, {
      data: { extraFields: [], parentDocId: parent.id }
    })
    expect(res.status()).toBe(201)
    const child = await res.json()
    expect(child.parentDocId).toBe(parent.id)
  })
})

test('clicking a document in the tree navigates to its display page', async ({ page, request }) => {
  await createDocument(request, projectId, firstBlueprintSlug)
  await openProject(page, projectName)

  // Wait for the document to load: its blueprint root node has a .docCount span showing "1"
  // (the count badge uses &nbsp; so text matching with spaces is unreliable — target the span directly)
  const rootWithDoc = page.locator('.q-tree__node-header').filter({
    has: page.locator('.docCount', { hasText: /^[1-9]/ })
  }).first()
  await expect(rootWithDoc).toBeVisible({ timeout: 15000 })

  // Expand the blueprint root node so its child document leaves become visible
  await rootWithDoc.click()

  // Document leaf nodes (non-root, non-module) have edit buttons — wait for one to be visible
  const leafHeader = page.locator('.q-tree__node-header').filter({ has: page.locator('.treeButton--edit') }).first()
  await expect(leafHeader).toBeVisible({ timeout: 5000 })
  await leafHeader.click()
  await page.waitForURL(/\/project\/display-content\//)
})
