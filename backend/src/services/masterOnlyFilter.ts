import type { Blueprint, Document } from '@prisma/client'

type FieldDef = { id: string; masterOnly?: boolean; [key: string]: unknown }
type FieldValue = { id: string; value: unknown }

function getMasterOnlyIds (blueprint: Blueprint | null | undefined): Set<string> {
  if (!blueprint) return new Set()
  const fields = blueprint.extraFields as unknown as FieldDef[]
  return new Set(fields.filter(f => f.masterOnly).map(f => f.id))
}

export function filterBlueprintForPlayer (blueprint: Blueprint): Blueprint {
  const fields = blueprint.extraFields as unknown as FieldDef[]
  return { ...blueprint, extraFields: fields.filter(f => !f.masterOnly) as unknown as Blueprint['extraFields'] }
}

export function filterDocumentForPlayer (doc: Document, blueprint: Blueprint | null | undefined): Document {
  const masterOnlyIds = getMasterOnlyIds(blueprint)
  if (masterOnlyIds.size === 0) return doc
  const fields = doc.extraFields as unknown as FieldValue[]
  return { ...doc, extraFields: fields.filter(f => !masterOnlyIds.has(f.id)) as unknown as Document['extraFields'] }
}

export function validateDocumentWriteForPlayer (
  incomingFields: unknown[],
  blueprint: Blueprint | null | undefined
): void {
  const masterOnlyIds = getMasterOnlyIds(blueprint)
  if (masterOnlyIds.size === 0) return
  const fields = incomingFields as FieldValue[]
  const violation = fields.find(f => masterOnlyIds.has(f.id))
  if (violation) {
    const err = new Error(`Field '${violation.id}' is master-only`) as Error & { statusCode: number }
    err.statusCode = 403
    throw err
  }
}
