import { test, expect } from '@playwright/test'
import { MASTER_STATE } from './helpers/auth'
import { createProject, deleteProject, createDocument } from './helpers/api'

test.use({ storageState: MASTER_STATE, viewport: { width: 390, height: 844 } })

test('mobile shell: hamburger toggles ObjectTree drawer; TopTabs hidden', async ({ page, request }) => {
  // Phase 12.1 smoke: in a phone-sized viewport the desktop splitter+drawer is
  // replaced by an off-canvas drawer toggled by a hamburger button. The TopTabs
  // multi-doc bar is hidden — navigation is single-doc-per-route.
  const projectName = `Mobile-${Date.now()}`
  const projectId = await createProject(request, projectName)
  await createDocument(request, projectId, 'characters', [{ id: 'name', value: 'Aragorn' }])

  await page.goto('/')
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(1500)

  await page.locator('.q-item').filter({ hasText: projectName }).first().click()
  await page.waitForTimeout(300)
  await page.locator('button').filter({ hasText: /Open Project/i }).click()
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(2500)

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
