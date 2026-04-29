import { test, expect } from '@playwright/test'
import { MASTER_STATE } from './helpers/auth'
import { createProject, deleteProject, getBlueprints, createDocument } from './helpers/api'

test.use({ storageState: MASTER_STATE })

test('typing in a document field does not throw stack-overflow on extend', async ({ page, request }) => {
  // Regression: optionsStore.getOptions used to return the Pinia store proxy in
  // Pinia 3, creating a self-loop (getOptions.getOptions...) that crashed
  // Quasar's deep extend() on every keystroke that touched an extend() path.
  const projectId = await createProject(request, `Typing-${Date.now()}`)
  const blueprints = await getBlueprints(request, projectId)
  const slug = blueprints[0].slug
  const doc = await createDocument(request, projectId, slug, [{ id: 'name', value: 'Initial' }])

  const pageErrors: string[] = []
  page.on('pageerror', err => pageErrors.push(err.message))

  await page.goto(`/project/display-content/${doc.id}/${doc.id}?editMode=editMode`)
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(1500)

  const titleInput = page.locator('input.q-field__native').first()
  await titleInput.click()
  await titleInput.fill('')
  await titleInput.type('Hello world this is a test', { delay: 30 })
  await page.waitForTimeout(1500)

  await deleteProject(request, projectId)

  expect(
    pageErrors.filter(e => e.includes('Maximum call stack')),
    `unexpected stack overflows: ${JSON.stringify(pageErrors)}`
  ).toEqual([])
})
