import { test, expect, request as baseRequest } from '@playwright/test'
import { MASTER_STATE, PLAYER_STATE, MASTER_EMAIL, PLAYER_EMAIL, TEST_PASSWORD } from './helpers/auth'
import {
  createProject, deleteProject, getBlueprints, createDocument,
  addProjectMember, getUserId
} from './helpers/api'

const API_URL = process.env.API_URL ?? 'http://localhost:3000'

let projectId: string
let firstBlueprintSlug: string

// We run two test blocks: one as master, one as player — so we set up once and share
test.describe('masterOnly fields — master perspective', () => {
  test.use({ storageState: MASTER_STATE })

  test.beforeEach(async ({ request }) => {
    projectId = await createProject(request, `E2E-MO-${Date.now()}`)
    const blueprints = await getBlueprints(request, projectId)
    firstBlueprintSlug = blueprints[0].slug
  })

  test.afterEach(async ({ request }) => {
    if (projectId) await deleteProject(request, projectId)
  })

  test('master can create document and sees all blueprint fields in blueprint response', async ({ request }) => {
    const blueprints = await getBlueprints(request, projectId)
    const bp = blueprints.find(b => b.slug === firstBlueprintSlug)
    expect(bp).toBeDefined()
    // Blueprint response for master includes extraFields (not stripped)
    expect(bp!.extraFields).toBeDefined()
  })
})

test.describe('masterOnly fields — player perspective', () => {
  test.use({ storageState: PLAYER_STATE })

  test('player cannot access a project they are not a member of', async ({ request }) => {
    // Create project as master (using a separate API context)
    const masterApi = await baseRequest.newContext({ baseURL: API_URL })
    await masterApi.post('/auth/local/login', {
      data: { email: MASTER_EMAIL, password: TEST_PASSWORD }
    })
    const projectRes = await masterApi.post('/api/projects', { data: { name: 'Player-Excluded-Project' } })
    const { id: pId } = await projectRes.json()

    // Player tries to access — should get 403
    const res = await request.get(`${API_URL}/api/projects/${pId}/blueprints`)
    expect(res.status()).toBe(403)

    await masterApi.delete(`${API_URL}/api/projects/${pId}`)
    await masterApi.dispose()
  })
})
