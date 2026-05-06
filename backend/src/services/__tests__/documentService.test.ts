import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { PrismaClient } from '@prisma/client'
import { documentService } from '../documentService'
import { seedBlueprintsForProject } from '../blueprintService'

const prisma = new PrismaClient()

// ─── Test fixtures ────────────────────────────────────────────────────────────

let userId: string
let projectId: string

beforeAll(async () => {
  const user = await prisma.user.create({
    data: { email: `test-${Date.now()}@test.local`, displayName: 'Test User' }
  })
  userId = user.id

  const project = await prisma.project.create({
    data: { name: 'Test Project', createdById: userId }
  })
  projectId = project.id

  await prisma.projectAccess.create({
    data: { projectId, userId, role: 'master' }
  })

  // Built-in blueprints carry the field types the relationship sync looks up
  // when the frontend's payload omits `type` on each extraField (the common case).
  await seedBlueprintsForProject(prisma, projectId)
})

afterAll(async () => {
  await prisma.project.delete({ where: { id: projectId } })
  await prisma.user.delete({ where: { id: userId } })
  await prisma.$disconnect()
})

// ─── Helpers ──────────────────────────────────────────────────────────────────

function singleRelField (fieldId: string, targetId: string, targetType: string, pairedField: string) {
  return {
    id: fieldId,
    type: 'singleToManyRelationship',
    value: { value: { _id: targetId, type: targetType, pairedField } }
  }
}

function manyRelField (fieldId: string, targets: Array<{ _id: string; type: string; pairedField: string }>) {
  return {
    id: fieldId,
    type: 'manyToManyRelationship',
    value: { value: targets }
  }
}

function getField (fields: unknown[], fieldId: string) {
  return (fields as Array<{ id: string; value: unknown }>).find(f => f.id === fieldId)
}

// Read back-references the way the frontend does — from value.value (single
// object for singleTo* fields, array for manyTo* fields). Normalises to an
// array so tests can ergonomically assert membership.
function getBackRefs (field: unknown): Array<{ _id: string }> {
  const v = (field as { value?: { value?: unknown } } | undefined)?.value?.value
  if (Array.isArray(v)) return v as Array<{ _id: string }>
  if (v && typeof v === 'object') return [v as { _id: string }]
  return []
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('documentService.createDocument', () => {
  it('creates a document without relationships', async () => {
    const doc = await documentService.createDocument(prisma, {
      projectId,
      type: 'characters',
      extraFields: [{ id: 'name', value: 'Aragorn' }],
      isCategory: false,
      parentDocId: null,
      createdById: userId
    })

    expect(doc.id).toBeTruthy()
    expect(doc.type).toBe('characters')
    expect(doc.projectId).toBe(projectId)
  })

  it('establishes back-reference on paired document when creating with relationship', async () => {
    const location = await documentService.createDocument(prisma, {
      projectId,
      type: 'locations',
      extraFields: [],
      isCategory: false,
      parentDocId: null,
      createdById: userId
    })

    const character = await documentService.createDocument(prisma, {
      projectId,
      type: 'characters',
      extraFields: [
        singleRelField('pairedCurrentLocation', location.id, 'locations', 'pairedCurrentCharacters')
      ],
      isCategory: false,
      parentDocId: null,
      createdById: userId
    })

    const updatedLocation = await prisma.document.findUnique({ where: { id: location.id } })
    const field = getField(updatedLocation!.extraFields as unknown[], 'pairedCurrentCharacters')
    expect(field).toBeTruthy()
    const refs = getBackRefs(field)
    expect(refs.some(r => r._id === character.id)).toBe(true)
  })
})

describe('documentService.updateDocument', () => {
  it('adds back-reference when a new relationship is added', async () => {
    const loc = await documentService.createDocument(prisma, {
      projectId, type: 'locations', extraFields: [], isCategory: false, parentDocId: null, createdById: userId
    })
    const char = await documentService.createDocument(prisma, {
      projectId, type: 'characters', extraFields: [], isCategory: false, parentDocId: null, createdById: userId
    })

    await documentService.updateDocument(prisma, {
      id: char.id,
      projectId,
      type: 'characters',
      extraFields: [singleRelField('pairedCurrentLocation', loc.id, 'locations', 'pairedCurrentCharacters')]
    })

    const updatedLoc = await prisma.document.findUnique({ where: { id: loc.id } })
    const field = getField(updatedLoc!.extraFields as unknown[], 'pairedCurrentCharacters')
    const refs = getBackRefs(field)
    expect(refs.some(r => r._id === char.id)).toBe(true)
  })

  it('removes back-reference when a relationship is dropped', async () => {
    const loc = await documentService.createDocument(prisma, {
      projectId, type: 'locations', extraFields: [], isCategory: false, parentDocId: null, createdById: userId
    })
    const char = await documentService.createDocument(prisma, {
      projectId,
      type: 'characters',
      extraFields: [singleRelField('pairedCurrentLocation', loc.id, 'locations', 'pairedCurrentCharacters')],
      isCategory: false,
      parentDocId: null,
      createdById: userId
    })

    // Remove the relationship
    await documentService.updateDocument(prisma, {
      id: char.id,
      projectId,
      type: 'characters',
      extraFields: []
    })

    const updatedLoc = await prisma.document.findUnique({ where: { id: loc.id } })
    const field = getField(updatedLoc!.extraFields as unknown[], 'pairedCurrentCharacters')
    const refs = getBackRefs(field)
    expect(refs.some(r => r._id === char.id)).toBe(false)
  })

  it('handles switching relationship target (old removed, new added)', async () => {
    const loc1 = await documentService.createDocument(prisma, {
      projectId, type: 'locations', extraFields: [], isCategory: false, parentDocId: null, createdById: userId
    })
    const loc2 = await documentService.createDocument(prisma, {
      projectId, type: 'locations', extraFields: [], isCategory: false, parentDocId: null, createdById: userId
    })
    const char = await documentService.createDocument(prisma, {
      projectId,
      type: 'characters',
      extraFields: [singleRelField('pairedCurrentLocation', loc1.id, 'locations', 'pairedCurrentCharacters')],
      isCategory: false,
      parentDocId: null,
      createdById: userId
    })

    // Switch from loc1 to loc2
    await documentService.updateDocument(prisma, {
      id: char.id,
      projectId,
      type: 'characters',
      extraFields: [singleRelField('pairedCurrentLocation', loc2.id, 'locations', 'pairedCurrentCharacters')]
    })

    const updLoc1 = await prisma.document.findUnique({ where: { id: loc1.id } })
    const updLoc2 = await prisma.document.findUnique({ where: { id: loc2.id } })

    const refs1 = getBackRefs(getField(updLoc1!.extraFields as unknown[], 'pairedCurrentCharacters'))
    const refs2 = getBackRefs(getField(updLoc2!.extraFields as unknown[], 'pairedCurrentCharacters'))

    expect(refs1.some(r => r._id === char.id)).toBe(false)
    expect(refs2.some(r => r._id === char.id)).toBe(true)
  })

  it('returns affectedTypes listing all document types touched', async () => {
    const loc = await documentService.createDocument(prisma, {
      projectId, type: 'locations', extraFields: [], isCategory: false, parentDocId: null, createdById: userId
    })
    const char = await documentService.createDocument(prisma, {
      projectId, type: 'characters', extraFields: [], isCategory: false, parentDocId: null, createdById: userId
    })

    const { affectedTypes } = await documentService.updateDocument(prisma, {
      id: char.id,
      projectId,
      type: 'characters',
      extraFields: [singleRelField('pairedCurrentLocation', loc.id, 'locations', 'pairedCurrentCharacters')]
    })

    expect(affectedTypes).toContain('characters')
    expect(affectedTypes).toContain('locations')
  })

  it('throws 404 if document does not exist', async () => {
    await expect(
      documentService.updateDocument(prisma, {
        id: '00000000-0000-0000-0000-000000000000',
        projectId,
        type: 'characters',
        extraFields: []
      })
    ).rejects.toMatchObject({ statusCode: 404 })
  })
})

describe('documentService.deleteDocument', () => {
  it('removes back-references from all paired documents on delete', async () => {
    const loc = await documentService.createDocument(prisma, {
      projectId, type: 'locations', extraFields: [], isCategory: false, parentDocId: null, createdById: userId
    })
    const char = await documentService.createDocument(prisma, {
      projectId,
      type: 'characters',
      extraFields: [singleRelField('pairedCurrentLocation', loc.id, 'locations', 'pairedCurrentCharacters')],
      isCategory: false,
      parentDocId: null,
      createdById: userId
    })

    await documentService.deleteDocument(prisma, { id: char.id, projectId, type: 'characters' })

    const updatedLoc = await prisma.document.findUnique({ where: { id: loc.id } })
    const field = getField(updatedLoc!.extraFields as unknown[], 'pairedCurrentCharacters')
    const refs = getBackRefs(field)
    expect(refs.some(r => r._id === char.id)).toBe(false)

    const deletedChar = await prisma.document.findUnique({ where: { id: char.id } })
    expect(deletedChar).toBeNull()
  })

  it('removes back-references from many-to-many paired documents on delete', async () => {
    const item1 = await documentService.createDocument(prisma, {
      projectId, type: 'items', extraFields: [], isCategory: false, parentDocId: null, createdById: userId
    })
    const item2 = await documentService.createDocument(prisma, {
      projectId, type: 'items', extraFields: [], isCategory: false, parentDocId: null, createdById: userId
    })
    const char = await documentService.createDocument(prisma, {
      projectId,
      type: 'characters',
      extraFields: [
        manyRelField('pairedItems', [
          { _id: item1.id, type: 'items', pairedField: 'pairedCharacters' },
          { _id: item2.id, type: 'items', pairedField: 'pairedCharacters' }
        ])
      ],
      isCategory: false,
      parentDocId: null,
      createdById: userId
    })

    await documentService.deleteDocument(prisma, { id: char.id, projectId, type: 'characters' })

    for (const item of [item1, item2]) {
      const updated = await prisma.document.findUnique({ where: { id: item.id } })
      const refs = getBackRefs(getField(updated!.extraFields as unknown[], 'pairedCharacters'))
      expect(refs.some(r => r._id === char.id)).toBe(false)
    }
  })

  it('is a no-op for non-existent document', async () => {
    await expect(
      documentService.deleteDocument(prisma, {
        id: '00000000-0000-0000-0000-000000000001',
        projectId,
        type: 'characters'
      })
    ).resolves.toBeUndefined()
  })
})

// ─── Real frontend payload shape ──────────────────────────────────────────────
// The fixtures above carry an explicit `type` on each extraField. The real
// frontend (see buildDefaultExtraFields in fieldDefaults.ts) emits only
// {id, value} — so the backend has to detect relationship-ness via the
// project's blueprint. These tests use the raw shape to exercise that path
// and the value→back-reference round-trip the way Field_MultiRelationship.vue
// and Field_SingleRelationship.vue actually read it.

function realSingleRelField (fieldId: string, target: { _id: string; type: string; pairedField: string }) {
  return {
    id: fieldId,
    value: {
      value: { _id: target._id, id: target._id, type: target.type, url: '', label: '', pairedField: target.pairedField },
      addedValues: { pairedId: target._id, value: '' }
    }
  }
}

function realManyRelField (fieldId: string, targets: Array<{ _id: string; type: string; pairedField: string }>) {
  return {
    id: fieldId,
    value: {
      value: targets.map(t => ({ _id: t._id, id: t._id, type: t.type, url: '', label: '', pairedField: t.pairedField })),
      addedValues: [],
      isSilent: false
    }
  }
}

describe('documentService relationship back-references — frontend payload shape', () => {
  it('many-to-many: forward save AND back-reference are persisted on paired doc', async () => {
    // Two conditions ↔ one character via the built-in pairedCharactersPositive
    // <-> pairedConditionsPositive m:m pair (both manyToManyRelationship).
    const cond1 = await documentService.createDocument(prisma, {
      projectId, type: 'conditions', extraFields: [], isCategory: false, parentDocId: null, createdById: userId
    })
    const cond2 = await documentService.createDocument(prisma, {
      projectId, type: 'conditions', extraFields: [], isCategory: false, parentDocId: null, createdById: userId
    })

    const character = await documentService.createDocument(prisma, {
      projectId,
      type: 'characters',
      extraFields: [
        realManyRelField('pairedConditionsPositive', [
          { _id: cond1.id, type: 'conditions', pairedField: 'pairedCharactersPositive' },
          { _id: cond2.id, type: 'conditions', pairedField: 'pairedCharactersPositive' }
        ])
      ],
      isCategory: false,
      parentDocId: null,
      createdById: userId
    })

    // Forward save — character's value.value still holds both conditions
    const reloadedChar = await prisma.document.findUnique({ where: { id: character.id } })
    const charField = getField(reloadedChar!.extraFields as unknown[], 'pairedConditionsPositive')
    const forwardRefs = getBackRefs(charField)
    expect(forwardRefs.map(r => r._id).sort()).toEqual([cond1.id, cond2.id].sort())

    // Back-reference — each condition has the character in pairedCharactersPositive.value.value
    for (const cond of [cond1, cond2]) {
      const updated = await prisma.document.findUnique({ where: { id: cond.id } })
      const field = getField(updated!.extraFields as unknown[], 'pairedCharactersPositive')
      expect(field, `paired field missing on condition ${cond.id}`).toBeTruthy()
      const refs = getBackRefs(field)
      expect(refs.some(r => r._id === character.id), `back-reference not visible to frontend on condition ${cond.id}`).toBe(true)
      // The back-reference points back to the source field so removing it from
      // the condition's UI side propagates correctly through the cycle.
      expect(refs.find(r => r._id === character.id)).toMatchObject({
        _id: character.id,
        type: 'characters',
        pairedField: 'pairedConditionsPositive'
      })
    }
  })

  it('single-to-many: back-reference appears in paired manyTo* field as an array entry', async () => {
    // pairedCurrentLocation (singleToManyRelationship on characters) <->
    // pairedCurrentCharacters (manyToSingleRelationship on locations).
    const loc = await documentService.createDocument(prisma, {
      projectId, type: 'locations', extraFields: [], isCategory: false, parentDocId: null, createdById: userId
    })
    const char = await documentService.createDocument(prisma, {
      projectId,
      type: 'characters',
      extraFields: [
        realSingleRelField('pairedCurrentLocation', { _id: loc.id, type: 'locations', pairedField: 'pairedCurrentCharacters' })
      ],
      isCategory: false,
      parentDocId: null,
      createdById: userId
    })

    const updatedLoc = await prisma.document.findUnique({ where: { id: loc.id } })
    const field = getField(updatedLoc!.extraFields as unknown[], 'pairedCurrentCharacters')
    expect(field, 'paired field missing on location').toBeTruthy()
    const refs = getBackRefs(field)
    expect(refs.some(r => r._id === char.id), 'back-reference not visible to frontend on location').toBe(true)
  })

  it('many-to-many: removing a relationship clears the back-reference on the paired doc', async () => {
    const cond = await documentService.createDocument(prisma, {
      projectId, type: 'conditions', extraFields: [], isCategory: false, parentDocId: null, createdById: userId
    })
    const char = await documentService.createDocument(prisma, {
      projectId,
      type: 'characters',
      extraFields: [
        realManyRelField('pairedConditionsPositive', [
          { _id: cond.id, type: 'conditions', pairedField: 'pairedCharactersPositive' }
        ])
      ],
      isCategory: false,
      parentDocId: null,
      createdById: userId
    })

    await documentService.updateDocument(prisma, {
      id: char.id,
      projectId,
      type: 'characters',
      extraFields: [realManyRelField('pairedConditionsPositive', [])]
    })

    const updated = await prisma.document.findUnique({ where: { id: cond.id } })
    const field = getField(updated!.extraFields as unknown[], 'pairedCharactersPositive')
    const refs = getBackRefs(field)
    expect(refs.some(r => r._id === char.id)).toBe(false)
  })
})
