import { test, expect, request as baseRequest } from '@playwright/test'
import { MASTER_STATE, PLAYER_STATE, MASTER_EMAIL, PLAYER_EMAIL, TEST_PASSWORD, apiContextAs } from './helpers/auth'
import {
  createProject, deleteProject, getBlueprints, createDocument,
  addProjectMember, getUserId, updateBlueprint, getDocument, updateDocument
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

test.describe('masterOnly fields — filtering for player members', () => {
  // Master sets up a project with a masterOnly field on a blueprint, adds the player,
  // creates a document with both visible + secret data. Player should never see the secret.
  let pId: string
  let bpSlug: string
  let docId: string

  test.beforeEach(async () => {
    const masterCtx = await apiContextAs(MASTER_EMAIL)
    const playerCtx = await apiContextAs(PLAYER_EMAIL)
    try {
      pId = await createProject(masterCtx, `E2E-MO-Filter-${Date.now()}`)
      const blueprints = await getBlueprints(masterCtx, pId)
      bpSlug = blueprints[0].slug

      // Inject a masterOnly field alongside whatever fields already exist
      const newFields = [
        ...blueprints[0].extraFields,
        { id: 'gm-secret', type: 'text', name: 'GM Secret', masterOnly: true }
      ]
      const upd = await updateBlueprint(masterCtx, pId, bpSlug, newFields)
      expect(upd.status).toBe(200)

      // Add player as member
      const playerId = await getUserId(playerCtx)
      await addProjectMember(masterCtx, pId, playerId, 'player')

      // Master creates a doc with both a normal value and the secret
      const created = await createDocument(masterCtx, pId, bpSlug, [
        { id: 'name', value: 'Visible' },
        { id: 'gm-secret', value: 'classified' }
      ])
      docId = created.id
    } finally {
      await playerCtx.dispose()
      await masterCtx.dispose()
    }
  })

  test.afterEach(async () => {
    if (pId) {
      const masterCtx = await apiContextAs(MASTER_EMAIL)
      await deleteProject(masterCtx, pId).catch(() => {})
      await masterCtx.dispose()
    }
  })

  test('player blueprint response strips masterOnly fields', async () => {
    const playerCtx = await apiContextAs(PLAYER_EMAIL)
    try {
      const bps = await getBlueprints(playerCtx, pId)
      const bp = bps.find(b => b.slug === bpSlug)
      expect(bp).toBeDefined()
      const ids = (bp!.extraFields as Array<{ id: string }>).map(f => f.id)
      expect(ids).not.toContain('gm-secret')
    } finally {
      await playerCtx.dispose()
    }
  })

  test('player document response strips masterOnly extraFields', async () => {
    const playerCtx = await apiContextAs(PLAYER_EMAIL)
    try {
      const { status, body } = await getDocument(playerCtx, pId, bpSlug, docId)
      expect(status).toBe(200)
      const ids = (body.extraFields as Array<{ id: string }>).map(f => f.id)
      expect(ids).toContain('name')
      expect(ids).not.toContain('gm-secret')
    } finally {
      await playerCtx.dispose()
    }
  })

  test('player gets 403 when writing to a masterOnly field', async () => {
    const playerCtx = await apiContextAs(PLAYER_EMAIL)
    try {
      const { status } = await updateDocument(playerCtx, pId, bpSlug, docId, {
        extraFields: [{ id: 'gm-secret', value: 'tampered' }]
      })
      expect(status).toBe(403)
    } finally {
      await playerCtx.dispose()
    }
  })

  test('player gets 403 when PUTting blueprints (requireMaster)', async () => {
    const playerCtx = await apiContextAs(PLAYER_EMAIL)
    try {
      const { status } = await updateBlueprint(playerCtx, pId, bpSlug, [])
      expect(status).toBe(403)
    } finally {
      await playerCtx.dispose()
    }
  })
})
