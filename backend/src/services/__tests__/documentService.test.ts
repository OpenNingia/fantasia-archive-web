import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { PrismaClient } from '@prisma/client'
import { documentService } from '../documentService'

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
    value: { addedValues: targets }
  }
}

function getField (fields: unknown[], fieldId: string) {
  return (fields as Array<{ id: string; value: unknown }>).find(f => f.id === fieldId)
}

function getAddedValues (field: unknown) {
  return ((field as { value: { addedValues?: Array<{ _id: string }> } }).value?.addedValues ?? [])
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
    const refs = getAddedValues(field)
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
    const refs = getAddedValues(field)
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
    const refs = getAddedValues(field)
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

    const refs1 = getAddedValues(getField(updLoc1!.extraFields as unknown[], 'pairedCurrentCharacters'))
    const refs2 = getAddedValues(getField(updLoc2!.extraFields as unknown[], 'pairedCurrentCharacters'))

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
    const refs = getAddedValues(field)
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
      const refs = getAddedValues(getField(updated!.extraFields as unknown[], 'pairedCharacters'))
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
