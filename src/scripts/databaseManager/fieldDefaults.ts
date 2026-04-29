import type { I_Blueprint } from "src/interfaces/I_Blueprint"

/**
 * Returns the canonical empty value for a given blueprint field type.
 * The shapes match what each `Field_*` component expects via its `inputDataValue` prop:
 * empty arrays for collection fields, `null` for relationships and numbers, `false` for
 * switches, and `""` for plain text-like fields. Using a `""` sentinel for everything
 * (the previous PouchDB-era behavior) caused Vue runtime prop validation to warn on every
 * unset field of a non-string type.
 */
export function defaultValueForFieldType (type: string): unknown {
  switch (type) {
    case "number":
      return null
    case "switch":
      return false
    case "list":
    case "tags":
    case "multiSelect":
      return []
    case "singleToNoneRelationship":
    case "singleToSingleRelationship":
    case "singleToManyRelationship":
    case "manyToNoneRelationship":
    case "manyToSingleRelationship":
    case "manyToManyRelationship":
      return null
    default:
      return ""
  }
}

/**
 * Builds a fresh `extraFields` array for a new document of the given blueprint, with each
 * field populated with the type-appropriate empty default. Pass `overrides` to seed specific
 * fields with non-default values (e.g. the new doc's name, or a pre-set parent relationship).
 */
export function buildDefaultExtraFields (
  blueprint: I_Blueprint,
  overrides: Record<string, unknown> = {}
): { id: string; value: unknown }[] {
  return (blueprint.extraFields ?? []).map(field => ({
    id: field.id,
    value: Object.prototype.hasOwnProperty.call(overrides, field.id)
      ? overrides[field.id]
      : defaultValueForFieldType(field.type)
  }))
}
