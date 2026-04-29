import { test, expect } from '@playwright/test'
import { MASTER_STATE } from './helpers/auth'
import { createProject, deleteProject, createDocument } from './helpers/api'

test.use({ storageState: MASTER_STATE })

test('side tree stays visible while typing in any field', async ({ page, request }) => {
  // Regression: in Vue 3 / Quasar v2, q-splitter emits `update:modelValue`
  // (not `input`). DocumentLayout had `@input="onChange"`, which instead
  // caught native `input` events bubbling from any q-input inside the
  // before-slot (the tree filter, document field inputs). onChange was
  // then called with an InputEvent — `event > 0` is false — so it set
  // `leftDrawerOpen = false` and the drawer slid off-screen on every
  // keystroke.
  const projectName = `SideTree-${Date.now()}`
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

  const drawerTransform = async () => {
    return await page.evaluate(() => {
      const drawer = document.querySelector('.q-drawer') as HTMLElement
      const r = drawer?.getBoundingClientRect()
      return { x: r?.x, w: r?.width, transform: window.getComputedStyle(drawer).transform }
    })
  }

  console.log('initial:', await drawerTransform())

  // Type into tree filter
  const filterInput = page.locator('aside input').first()
  await filterInput.click()
  await filterInput.press('a')
  await page.waitForTimeout(300)
  console.log('after press a in tree filter:', await drawerTransform())

  await filterInput.press('b')
  await page.waitForTimeout(300)
  console.log('after press b in tree filter:', await drawerTransform())

  // Drawer should still be at x=0
  const t = await drawerTransform()
  expect(t.x).toBe(0)
  expect(t.w).toBeGreaterThan(0)

  await deleteProject(request, projectId)
})
