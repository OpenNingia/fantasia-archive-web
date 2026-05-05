import { test, expect } from '@playwright/test'
import { MASTER_STATE } from './helpers/auth'
import { createProject, deleteProject, createDocument } from './helpers/api'

test.use({ storageState: MASTER_STATE, viewport: { width: 390, height: 844 } })

async function openProjectMobile (page: import('@playwright/test').Page, projectName: string) {
  await page.goto('/')
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(1500)

  await page.locator('.q-item').filter({ hasText: projectName }).first().click()
  await page.waitForTimeout(300)
  await page.locator('button').filter({ hasText: /Open Project/i }).click()
  await page.waitForURL(/\/project\/[^/]+/)
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(2500)
}

test('mobile shell: hamburger toggles ObjectTree drawer; TopTabs hidden', async ({ page, request }) => {
  // Phase 12.1 smoke: in a phone-sized viewport the desktop splitter+drawer is
  // replaced by an off-canvas drawer toggled by a hamburger button. The TopTabs
  // multi-doc bar is hidden — navigation is single-doc-per-route.
  const projectName = `Mobile-${Date.now()}`
  const projectId = await createProject(request, projectName)
  await createDocument(request, projectId, 'characters', [{ id: 'name', value: 'Aragorn' }])

  await openProjectMobile(page, projectName)

  const hamburger = page.getByTestId('mobile-drawer-toggle')
  await expect(hamburger).toBeVisible()

  // TopTabs (the multi-doc tab bar) should not be rendered on mobile.
  await expect(page.locator('.tabsWrapper')).toHaveCount(0)

  // Drawer starts closed: q-drawer renders but is translated off-screen.
  const drawer = page.locator('.q-drawer').first()
  const initialX = (await drawer.boundingBox())?.x ?? 0
  expect(initialX).toBeLessThan(0)

  // Tap the hamburger → drawer slides in to x=0.
  await hamburger.click()
  await page.waitForTimeout(400)
  const openX = (await drawer.boundingBox())?.x ?? -1
  expect(openX).toBe(0)

  await deleteProject(request, projectId)
})

test('mobile shell: tapping a tree leaf navigates and auto-closes the drawer', async ({ page, request }) => {
  // Phase 12.2: the off-canvas drawer should close itself when the user lands
  // on a document, otherwise they stare at a covered page after navigating.
  // Editing UI must remain reachable — we don't want a read-only mobile.
  const projectName = `Mobile-Nav-${Date.now()}`
  const projectId = await createProject(request, projectName)
  await createDocument(request, projectId, 'characters', [{ id: 'name', value: 'Frodo' }])

  await openProjectMobile(page, projectName)

  await page.getByTestId('mobile-drawer-toggle').click()
  await page.waitForTimeout(400)

  // Expand the blueprint root that has a doc, then tap the leaf
  const rootWithDoc = page.locator('.q-tree__node-header').filter({
    has: page.locator('.docCount', { hasText: /^[1-9]/ })
  }).first()
  await expect(rootWithDoc).toBeVisible({ timeout: 15000 })
  await rootWithDoc.click()

  const leafHeader = page.locator('.q-tree__node-header').filter({ has: page.locator('.treeButton--edit') }).first()
  await expect(leafHeader).toBeVisible({ timeout: 5000 })
  await leafHeader.click()

  await page.waitForURL(/\/project\/[^/]+\/display-content\//)
  await page.waitForTimeout(400)

  // Drawer should be off-screen again after navigation
  const drawer = page.locator('.q-drawer').first()
  const x = (await drawer.boundingBox())?.x ?? 0
  expect(x).toBeLessThan(0)

  // Editing actions remain reachable on mobile (toolbar wraps but is rendered).
  // The "delete current document" button is the canonical destructive action and
  // is only present once a real document is loaded.
  await expect(page.locator('button .mdi-text-box-remove-outline')).toBeVisible()

  await deleteProject(request, projectId)
})
