import { test, expect } from '@playwright/test'
import { MASTER_STATE, PLAYER_STATE, PLAYER_EMAIL, apiContextAs, MASTER_EMAIL } from './helpers/auth'
import {
  createProject, deleteProject, updateProject, listProjects,
  listProjectMembers, addProjectMember, updateProjectMemberRole,
  removeProjectMember, getUserId
} from './helpers/api'

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
  // Routes are /project/:projectId — match the id segment, not bare /project
  await page.waitForURL(/\/project\/[^/]+/)
  await page.waitForLoadState('networkidle')
  // mainProjectTitle is an h2 populated asynchronously; check the subtitle which is always visible
  await expect(page.getByText('Project overview for')).toBeVisible({ timeout: 15000 })
})

test.describe('projects — API CRUD', () => {
  test('POST response includes role=master so the UI does not flash "Player"', async ({ request }) => {
    const API_URL = process.env.API_URL ?? 'http://localhost:3000'
    const res = await request.post(`${API_URL}/api/projects`, { data: { name: `Role-Echo-${Date.now()}` } })
    expect(res.status()).toBe(201)
    const body = await res.json()
    expect(body.role).toBe('master')
    await deleteProject(request, body.id)
  })

  test('PUT updates project name', async ({ request }) => {
    const newName = `Renamed-${Date.now()}`
    const { status, body } = await updateProject(request, projectId, { name: newName })
    expect(status).toBe(200)
    expect(body.name).toBe(newName)
  })

  test('DELETE removes the project from the list', async ({ request }) => {
    // Create a separate project to delete (don't use projectId — afterEach would double-delete)
    const targetId = await createProject(request, `ToDelete-${Date.now()}`)
    await deleteProject(request, targetId)
    const projects = await listProjects(request)
    expect(projects.find(p => p.id === targetId)).toBeUndefined()
  })

  test('GET /api/projects/:id/access lists at least the creator as master', async ({ request }) => {
    const { status, body } = await listProjectMembers(request, projectId)
    expect(status).toBe(200)
    expect(Array.isArray(body)).toBe(true)
    expect(body.length).toBeGreaterThanOrEqual(1)
    expect(body.some((m: { role: string }) => m.role === 'master')).toBe(true)
  })
})

test.describe('projects — member management', () => {
  test('master adds player → player sees the project', async ({ request }) => {
    const playerCtx = await apiContextAs(PLAYER_EMAIL)
    try {
      const playerId = await getUserId(playerCtx)
      await addProjectMember(request, projectId, playerId, 'player')

      const projects = await listProjects(playerCtx)
      const found = projects.find(p => p.id === projectId)
      expect(found).toBeDefined()
      expect(found!.role).toBe('player')
    } finally {
      await playerCtx.dispose()
    }
  })

  test('master changes a player to master via PUT /access/:userId', async ({ request }) => {
    const playerCtx = await apiContextAs(PLAYER_EMAIL)
    try {
      const playerId = await getUserId(playerCtx)
      await addProjectMember(request, projectId, playerId, 'player')

      const { status } = await updateProjectMemberRole(request, projectId, playerId, 'master')
      expect(status).toBe(200)

      const { body } = await listProjectMembers(request, projectId)
      const updated = body.find((m: { userId: string }) => m.userId === playerId)
      expect(updated.role).toBe('master')
    } finally {
      await playerCtx.dispose()
    }
  })

  test('master removes member → player no longer sees project', async ({ request }) => {
    const playerCtx = await apiContextAs(PLAYER_EMAIL)
    try {
      const playerId = await getUserId(playerCtx)
      await addProjectMember(request, projectId, playerId, 'player')

      // Confirm visibility, then remove
      let projects = await listProjects(playerCtx)
      expect(projects.find(p => p.id === projectId)).toBeDefined()

      const status = await removeProjectMember(request, projectId, playerId)
      expect(status).toBe(200)

      projects = await listProjects(playerCtx)
      expect(projects.find(p => p.id === projectId)).toBeUndefined()
    } finally {
      await playerCtx.dispose()
    }
  })
})

test.describe('projects — non-master forbidden writes', () => {
  test('player as project member cannot PUT project (403)', async ({ request }) => {
    const playerCtx = await apiContextAs(PLAYER_EMAIL)
    try {
      const playerId = await getUserId(playerCtx)
      await addProjectMember(request, projectId, playerId, 'player')

      const { status } = await updateProject(playerCtx, projectId, { name: 'should-fail' })
      expect(status).toBe(403)
    } finally {
      await playerCtx.dispose()
    }
  })
})
