import type { PrismaClient } from '@prisma/client'

// ─── Types matching the frontend I_OpenedDocument extraFields ─────────────────

interface FieldValue {
  id: string
  value: unknown
  type?: string
}

interface RelationshipValue {
  value: {
    _id: string
    type: string      // document type (blueprint slug)
    pairedField: string  // field id in the paired document that back-references this one
  }
  addedValues?: Array<{ _id: string; type: string; pairedField: string }>
}

// Relationship field types as defined in the frontend blueprints
const RELATIONSHIP_FIELD_TYPES = new Set([
  'singleToNoneRelationship',
  'singleToSingleRelationship',
  'singleToManyRelationship',
  'manyToNoneRelationship',
  'manyToSingleRelationship',
  'manyToManyRelationship'
])

function isRelationshipField (field: FieldValue): boolean {
  return !!field.type && RELATIONSHIP_FIELD_TYPES.has(field.type)
}

function getRelationshipTargets (field: FieldValue): Array<{ _id: string; type: string; pairedField: string }> {
  if (!field.value) return []
  const v = field.value as RelationshipValue
  // singleTo* stores value.value as a single ref; manyTo* stores value.addedValues
  const single = v.value ? [v.value] : []
  const many = v.addedValues ?? []
  return [...single, ...many].filter(r => r._id && r.type && r.pairedField)
}

// ─── Create document ──────────────────────────────────────────────────────────

export const documentService = {
  async createDocument (
    prisma: PrismaClient,
    data: {
      projectId: string
      type: string
      extraFields: object[]
      isCategory: boolean
      parentDocId: string | null
      createdById: string
    }
  ) {
    return prisma.$transaction(async (tx) => {
      const doc = await tx.document.create({
        data: {
          projectId: data.projectId,
          type: data.type,
          extraFields: data.extraFields,
          isCategory: data.isCategory,
          parentDocId: data.parentDocId,
          createdById: data.createdById
        }
      })

      // Establish back-references for any relationship fields on the new document
      await syncRelationshipAdditions(tx, data.projectId, doc.id, data.extraFields as FieldValue[], [])

      return doc
    })
  },

  // ─── Update document ─────────────────────────────────────────────────────────

  async updateDocument (
    prisma: PrismaClient,
    data: {
      id: string
      projectId: string
      type: string
      extraFields: object[]
      isCategory?: boolean
      parentDocId?: string
    }
  ): Promise<{ doc: Awaited<ReturnType<PrismaClient['document']['findFirst']>>; affectedTypes: string[] }> {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.document.findFirst({
        where: { id: data.id, projectId: data.projectId }
      })
      if (!existing) {
        const err = new Error('Document not found') as Error & { statusCode: number }
        err.statusCode = 404
        throw err
      }

      const oldFields = existing.extraFields as unknown as FieldValue[]
      const newFields = data.extraFields as FieldValue[]

      const affectedTypes = await syncRelationshipChanges(tx, data.projectId, data.id, newFields, oldFields)

      const doc = await tx.document.update({
        where: { id: data.id },
        data: {
          extraFields: data.extraFields,
          ...(data.isCategory !== undefined && { isCategory: data.isCategory }),
          ...(data.parentDocId !== undefined && { parentDocId: data.parentDocId })
        }
      })

      return { doc, affectedTypes: [...new Set([data.type, ...affectedTypes])] }
    })
  },

  // ─── Delete document ──────────────────────────────────────────────────────────

  async deleteDocument (
    prisma: PrismaClient,
    data: { id: string; projectId: string; type: string }
  ) {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.document.findFirst({
        where: { id: data.id, projectId: data.projectId }
      })
      if (!existing) return

      // Remove all back-references this document has in other documents
      await syncRelationshipRemovals(tx, data.projectId, data.id, existing.extraFields as unknown as FieldValue[])

      await tx.document.delete({ where: { id: data.id } })
    })
  }
}

// ─── Relationship sync helpers ────────────────────────────────────────────────

async function syncRelationshipChanges (
  tx: Parameters<Parameters<PrismaClient['$transaction']>[0]>[0],
  projectId: string,
  sourceDocId: string,
  newFields: FieldValue[],
  oldFields: FieldValue[]
): Promise<string[]> {
  const affectedTypes: string[] = []

  const oldFieldMap = new Map(oldFields.map(f => [f.id, f]))
  const newFieldMap = new Map(newFields.map(f => [f.id, f]))

  for (const newField of newFields) {
    if (!isRelationshipField(newField)) continue

    const oldField = oldFieldMap.get(newField.id)
    const oldTargets = oldField ? getRelationshipTargets(oldField) : []
    const newTargets = getRelationshipTargets(newField)

    const oldIds = new Set(oldTargets.map(t => t._id))
    const newIds = new Set(newTargets.map(t => t._id))

    // Additions: targets in new but not old
    const added = newTargets.filter(t => !oldIds.has(t._id))
    // Removals: targets in old but not new
    const removed = oldTargets.filter(t => !newIds.has(t._id))

    for (const target of added) {
      await addBackReference(tx, projectId, sourceDocId, target)
      affectedTypes.push(target.type)
    }
    for (const target of removed) {
      await removeBackReference(tx, projectId, sourceDocId, target)
      affectedTypes.push(target.type)
    }
  }

  // Handle fields removed entirely
  for (const oldField of oldFields) {
    if (!isRelationshipField(oldField)) continue
    if (!newFieldMap.has(oldField.id)) {
      for (const target of getRelationshipTargets(oldField)) {
        await removeBackReference(tx, projectId, sourceDocId, target)
        affectedTypes.push(target.type)
      }
    }
  }

  return affectedTypes
}

async function syncRelationshipAdditions (
  tx: Parameters<Parameters<PrismaClient['$transaction']>[0]>[0],
  projectId: string,
  sourceDocId: string,
  newFields: FieldValue[],
  _oldFields: FieldValue[]
) {
  for (const field of newFields) {
    if (!isRelationshipField(field)) continue
    for (const target of getRelationshipTargets(field)) {
      await addBackReference(tx, projectId, sourceDocId, target)
    }
  }
}

async function syncRelationshipRemovals (
  tx: Parameters<Parameters<PrismaClient['$transaction']>[0]>[0],
  projectId: string,
  sourceDocId: string,
  fields: FieldValue[]
) {
  for (const field of fields) {
    if (!isRelationshipField(field)) continue
    for (const target of getRelationshipTargets(field)) {
      await removeBackReference(tx, projectId, sourceDocId, target)
    }
  }
}

async function addBackReference (
  tx: Parameters<Parameters<PrismaClient['$transaction']>[0]>[0],
  projectId: string,
  sourceDocId: string,
  target: { _id: string; type: string; pairedField: string }
) {
  const paired = await (tx as PrismaClient).document.findFirst({
    where: { id: target._id, projectId }
  })
  if (!paired) return

  const pairedFields = paired.extraFields as unknown as FieldValue[]
  const fieldIdx = pairedFields.findIndex(f => f.id === target.pairedField)

  if (fieldIdx === -1) {
    // Field doesn't exist yet — create it with the back-reference
    pairedFields.push({
      id: target.pairedField,
      value: {
        addedValues: [{ _id: sourceDocId, type: paired.type, pairedField: '' }]
      }
    })
  } else {
    // Add sourceDocId to the existing field's addedValues (avoid duplicates)
    const f = pairedFields[fieldIdx]
    const v = (f.value ?? {}) as RelationshipValue
    const existing = v.addedValues ?? []
    if (!existing.some(e => e._id === sourceDocId)) {
      existing.push({ _id: sourceDocId, type: paired.type, pairedField: '' })
    }
    v.addedValues = existing
    f.value = v
    pairedFields[fieldIdx] = f
  }

  await (tx as PrismaClient).document.update({
    where: { id: target._id },
    data: { extraFields: pairedFields as unknown as import('@prisma/client').Prisma.InputJsonValue }
  })
}

async function removeBackReference (
  tx: Parameters<Parameters<PrismaClient['$transaction']>[0]>[0],
  projectId: string,
  sourceDocId: string,
  target: { _id: string; type: string; pairedField: string }
) {
  const paired = await (tx as PrismaClient).document.findFirst({
    where: { id: target._id, projectId }
  })
  if (!paired) return

  const pairedFields = paired.extraFields as unknown as FieldValue[]
  const fieldIdx = pairedFields.findIndex(f => f.id === target.pairedField)
  if (fieldIdx === -1) return

  const f = pairedFields[fieldIdx]
  const v = (f.value ?? {}) as RelationshipValue

  if (v.value?._id === sourceDocId) {
    v.value = null as unknown as RelationshipValue['value']
  }
  if (v.addedValues) {
    v.addedValues = v.addedValues.filter(e => e._id !== sourceDocId)
  }
  f.value = v
  pairedFields[fieldIdx] = f

  await (tx as PrismaClient).document.update({
    where: { id: target._id },
    data: { extraFields: pairedFields as unknown as import('@prisma/client').Prisma.InputJsonValue }
  })
}
