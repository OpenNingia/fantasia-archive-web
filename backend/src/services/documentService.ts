import type { PrismaClient, Prisma } from '@prisma/client'

// ─── Types matching the frontend I_OpenedDocument extraFields ─────────────────

interface FieldValue {
  id: string
  value: unknown
  type?: string
}

interface BlueprintField {
  id: string
  type: string
  relationshipSettings?: { connectedObjectType?: string; connectedField?: string }
}

interface RefShape { _id: string; type: string; pairedField: string }

// Shape of a relationship field's `value`:
//   single*: { value: RefShape | null,  addedValues: { pairedId, value } | undefined }
//   many*:   { value: RefShape[],       addedValues: { pairedId, value }[] | undefined }
// `addedValues` holds USER NOTES, not relationship targets — see Field_MultiRelationship.vue
// and Field_SingleRelationship.vue. The relationship targets always live in `value.value`.

const RELATIONSHIP_FIELD_TYPES = new Set([
  'singleToNoneRelationship',
  'singleToSingleRelationship',
  'singleToManyRelationship',
  'manyToNoneRelationship',
  'manyToSingleRelationship',
  'manyToManyRelationship'
])

const SINGLE_REL_TYPES = new Set([
  'singleToNoneRelationship',
  'singleToSingleRelationship',
  'singleToManyRelationship'
])

type Tx = Parameters<Parameters<PrismaClient['$transaction']>[0]>[0]

async function loadBlueprintFields (tx: Tx, projectId: string, slug: string): Promise<BlueprintField[] | null> {
  const bp = await (tx as PrismaClient).blueprint.findUnique({
    where: { projectId_slug: { projectId, slug } }
  })
  return bp ? (bp.extraFields as unknown as BlueprintField[]) : null
}

function findFieldType (blueprint: BlueprintField[] | null, fieldId: string): string | undefined {
  return blueprint?.find(f => f.id === fieldId)?.type
}

function isRelationshipType (type: string | undefined): boolean {
  return !!type && RELATIONSHIP_FIELD_TYPES.has(type)
}

// Resolve a field's effective type: prefer the explicit `type` on the saved field
// (e.g. set by importPouchdb or older payloads), otherwise fall back to the blueprint.
function effectiveFieldType (field: FieldValue, blueprint: BlueprintField[] | null): string | undefined {
  return field.type ?? findFieldType(blueprint, field.id)
}

// Read the target list from a relationship field's `value.value`. Single-side
// relationships store one object; many-side store an array. Anything that
// doesn't carry the {_id, type, pairedField} triple is dropped — those are
// the only refs we can act on.
function getRelationshipTargets (field: FieldValue): RefShape[] {
  const v = field.value as { value?: unknown } | null | undefined
  if (!v || typeof v !== 'object') return []
  const target = v.value
  const candidates: unknown[] = []
  if (Array.isArray(target)) candidates.push(...target)
  else if (target && typeof target === 'object') candidates.push(target)

  return candidates.filter((r): r is RefShape => {
    if (!r || typeof r !== 'object') return false
    const o = r as Partial<RefShape>
    return typeof o._id === 'string' && typeof o.type === 'string' && typeof o.pairedField === 'string' &&
      o._id.length > 0 && o.type.length > 0 && o.pairedField.length > 0
  })
}

// ─── Service ─────────────────────────────────────────────────────────────────

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

      await syncRelationshipAdditions(tx, data.projectId, doc.id, data.type, data.extraFields as FieldValue[])

      return doc
    })
  },

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

      const affectedTypes = await syncRelationshipChanges(tx, data.projectId, data.id, data.type, newFields, oldFields)

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

  async deleteDocument (
    prisma: PrismaClient,
    data: { id: string; projectId: string; type: string }
  ) {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.document.findFirst({
        where: { id: data.id, projectId: data.projectId }
      })
      if (!existing) return

      await syncRelationshipRemovals(tx, data.projectId, data.id, existing.type, existing.extraFields as unknown as FieldValue[])

      await tx.document.delete({ where: { id: data.id } })
    })
  }
}

// ─── Relationship sync helpers ────────────────────────────────────────────────

async function syncRelationshipChanges (
  tx: Tx,
  projectId: string,
  sourceDocId: string,
  sourceType: string,
  newFields: FieldValue[],
  oldFields: FieldValue[]
): Promise<string[]> {
  const affectedTypes: string[] = []

  const sourceBlueprint = await loadBlueprintFields(tx, projectId, sourceType)

  const oldFieldMap = new Map(oldFields.map(f => [f.id, f]))
  const newFieldMap = new Map(newFields.map(f => [f.id, f]))

  for (const newField of newFields) {
    if (!isRelationshipType(effectiveFieldType(newField, sourceBlueprint))) continue

    const oldField = oldFieldMap.get(newField.id)
    const oldTargets = oldField ? getRelationshipTargets(oldField) : []
    const newTargets = getRelationshipTargets(newField)

    const oldIds = new Set(oldTargets.map(t => t._id))
    const newIds = new Set(newTargets.map(t => t._id))

    const added = newTargets.filter(t => !oldIds.has(t._id))
    const removed = oldTargets.filter(t => !newIds.has(t._id))

    for (const target of added) {
      await addBackReference(tx, projectId, sourceDocId, sourceType, newField.id, target)
      affectedTypes.push(target.type)
    }
    for (const target of removed) {
      await removeBackReference(tx, projectId, sourceDocId, target)
      affectedTypes.push(target.type)
    }
  }

  for (const oldField of oldFields) {
    if (!isRelationshipType(effectiveFieldType(oldField, sourceBlueprint))) continue
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
  tx: Tx,
  projectId: string,
  sourceDocId: string,
  sourceType: string,
  newFields: FieldValue[]
) {
  const sourceBlueprint = await loadBlueprintFields(tx, projectId, sourceType)
  for (const field of newFields) {
    if (!isRelationshipType(effectiveFieldType(field, sourceBlueprint))) continue
    for (const target of getRelationshipTargets(field)) {
      await addBackReference(tx, projectId, sourceDocId, sourceType, field.id, target)
    }
  }
}

async function syncRelationshipRemovals (
  tx: Tx,
  projectId: string,
  sourceDocId: string,
  sourceType: string,
  fields: FieldValue[]
) {
  const sourceBlueprint = await loadBlueprintFields(tx, projectId, sourceType)
  for (const field of fields) {
    if (!isRelationshipType(effectiveFieldType(field, sourceBlueprint))) continue
    for (const target of getRelationshipTargets(field)) {
      await removeBackReference(tx, projectId, sourceDocId, target)
    }
  }
}

// Resolve the paired field's type — first from any `type` already stored on the
// existing field (preserves explicit info from older payloads/imports), then
// from the paired blueprint. Returns undefined if neither knows.
async function resolvePairedFieldType (
  tx: Tx,
  projectId: string,
  pairedType: string,
  existingField: FieldValue | undefined,
  pairedFieldId: string
): Promise<string | undefined> {
  if (existingField?.type && RELATIONSHIP_FIELD_TYPES.has(existingField.type)) return existingField.type
  const bp = await loadBlueprintFields(tx, projectId, pairedType)
  return findFieldType(bp, pairedFieldId)
}

async function addBackReference (
  tx: Tx,
  projectId: string,
  sourceDocId: string,
  sourceType: string,
  sourceFieldId: string,
  target: RefShape
) {
  const paired = await (tx as PrismaClient).document.findFirst({
    where: { id: target._id, projectId }
  })
  if (!paired) return

  const pairedFields = paired.extraFields as unknown as FieldValue[]
  const fieldIdx = pairedFields.findIndex(f => f.id === target.pairedField)
  const existing = fieldIdx === -1 ? undefined : pairedFields[fieldIdx]

  const pairedFieldType = await resolvePairedFieldType(tx, projectId, paired.type, existing, target.pairedField)
  // Default to many-shape (array) when the type is unknown — safer than overwriting
  // with a single-object shape that would clobber a sibling back-reference.
  const isSingle = pairedFieldType ? SINGLE_REL_TYPES.has(pairedFieldType) : false

  const refEntry: RefShape = { _id: sourceDocId, type: sourceType, pairedField: sourceFieldId }

  if (existing === undefined) {
    pairedFields.push({
      id: target.pairedField,
      ...(pairedFieldType ? { type: pairedFieldType } : {}),
      value: isSingle ? { value: refEntry } : { value: [refEntry] }
    })
  } else {
    const v = (existing.value && typeof existing.value === 'object')
      ? existing.value as { value?: unknown; addedValues?: unknown }
      : {}
    if (isSingle) {
      v.value = refEntry
    } else {
      const arr = Array.isArray(v.value) ? (v.value as RefShape[]).slice() : []
      if (!arr.some(r => r._id === sourceDocId)) arr.push(refEntry)
      v.value = arr
    }
    existing.value = v
    if (pairedFieldType && existing.type !== pairedFieldType) existing.type = pairedFieldType
    pairedFields[fieldIdx] = existing
  }

  await (tx as PrismaClient).document.update({
    where: { id: target._id },
    data: { extraFields: pairedFields as unknown as Prisma.InputJsonValue }
  })
}

async function removeBackReference (
  tx: Tx,
  projectId: string,
  sourceDocId: string,
  target: RefShape
) {
  const paired = await (tx as PrismaClient).document.findFirst({
    where: { id: target._id, projectId }
  })
  if (!paired) return

  const pairedFields = paired.extraFields as unknown as FieldValue[]
  const fieldIdx = pairedFields.findIndex(f => f.id === target.pairedField)
  if (fieldIdx === -1) return

  const f = pairedFields[fieldIdx]
  if (!f.value || typeof f.value !== 'object') return
  const v = f.value as { value?: unknown; addedValues?: unknown }

  if (Array.isArray(v.value)) {
    v.value = (v.value as RefShape[]).filter(r => r._id !== sourceDocId)
  } else if (v.value && typeof v.value === 'object' && (v.value as RefShape)._id === sourceDocId) {
    v.value = null
  }
  f.value = v
  pairedFields[fieldIdx] = f

  await (tx as PrismaClient).document.update({
    where: { id: target._id },
    data: { extraFields: pairedFields as unknown as Prisma.InputJsonValue }
  })
}
