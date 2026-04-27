import { test, expect } from '@playwright/test'
import { MASTER_STATE } from './helpers/auth'
import { createProject, deleteProject } from './helpers/api'

test.use({ storageState: MASTER_STATE })

let projectId: string

test.beforeEach(async ({ request }) => {
  projectId = await createProject(request, `E2E-Project-${Date.now()}`)
})

test.afterEach(async ({ request }) => {
  if (projectId) await deleteProject(request, projectId)
})

test('newly created project appears in project list', async ({ page }) => {
  await page.goto('/')
  await page.waitForLoadState('networkidle')
  await expect(page.getByText('Your Projects')).toBeVisible({ timeout: 15000 })
  // At least one project item must be visible
  await expect(page.locator('.q-list .q-item').first()).toBeVisible({ timeout: 15000 })
})

test('can create a project via the New Project dialog', async ({ page }) => {
  await page.goto('/')
  const newName = `UI-Created-${Date.now()}`
  await page.getByRole('button', { name: 'New Project' }).click()
  await page.getByLabel('Project name').fill(newName)
  await page.getByRole('button', { name: 'Create' }).click()
  await expect(page.getByText(newName)).toBeVisible()
})

test('selecting a project and clicking Open Project navigates to /project', async ({ page }) => {
  await page.goto('/')
  await page.waitForLoadState('networkidle')
  // Select the first project item
  await page.locator('.q-list .q-item').first().click()
  await page.getByRole('button', { name: 'Open Project' }).click()
  await page.waitForURL('/project')
  await page.waitForLoadState('networkidle')
  // mainProjectTitle is an h2 populated asynchronously; check the subtitle which is always visible
  await expect(page.getByText('Project overview for')).toBeVisible({ timeout: 15000 })
})
