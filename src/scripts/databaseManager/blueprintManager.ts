import { blueprintApi } from "src/services/api/blueprintApi"
import type { I_Blueprint } from "src/interfaces/I_Blueprint"

/**
 * Maps an API Blueprint record to the I_Blueprint shape used by the Vuex store.
 * The API uses `slug` as the type identifier and `displayOrder` for ordering;
 * the frontend uses `_id` and `order` respectively.
 */
function toIBlueprint (bp: Awaited<ReturnType<typeof blueprintApi.list>>[number]): I_Blueprint {
  return {
    _id: bp.slug,
    order: bp.displayOrder,
    nameSingular: bp.nameSingular,
    namePlural: bp.namePlural,
    icon: bp.icon,
    category: bp.category,
    extraFields: bp.extraFields as unknown as I_Blueprint["extraFields"]
  }
}

/**
 * Fetches all blueprints for the given project from the API and returns them
 * mapped to the I_Blueprint format used by the Vuex store.
 * Blueprints are seeded server-side on project creation — no local seeding needed.
 */
export const engageBlueprints = async (projectId: string): Promise<I_Blueprint[]> => {
  const raw = await blueprintApi.list(projectId)
  return raw.map(toIBlueprint)
}

/**
 * Alias for engageBlueprints — kept for call-site compatibility.
 */
export const retrieveAllBlueprints = engageBlueprints
