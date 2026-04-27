import { test, expect } from '@playwright/test'
import { MASTER_STATE } from './helpers/auth'
import { createProject, deleteProject, getBlueprints, createDocument } from './helpers/api'

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
