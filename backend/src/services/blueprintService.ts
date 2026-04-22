import type { PrismaClient } from '@prisma/client'

// Seeder: imports the existing frontend blueprint definitions and inserts them
// into the database for a new project. The blueprint TS files are pure data
// (no PouchDB dependency) so they can be reused directly.
//
// Each blueprint file exports a default I_Blueprint-shaped object.
// We import them all lazily to avoid loading unused blueprints.

const BLUEPRINT_SLUGS = [
  'characters', 'locations', 'items', 'events', 'magic', 'races',
  'religions', 'languages', 'currencies', 'guilds', 'skills', 'professions',
  'resources', 'conditions', 'myths', 'lore-notes', 'chapters',
  'science-technology', 'political-groups', 'culture'
] as const

// Path relative to this file — walks up to src/ then into the frontend blueprints
const BLUEPRINTS_PATH = '../../../src/scripts/databaseManager/blueprints'

export async function seedBlueprintsForProject (prisma: PrismaClient, projectId: string) {
  for (let i = 0; i < BLUEPRINT_SLUGS.length; i++) {
    const slug = BLUEPRINT_SLUGS[i]
    try {
      // Dynamic import of the existing frontend blueprint definition
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const mod = require(`${BLUEPRINTS_PATH}/${slug}`)
      const bp = mod.default ?? mod

      await prisma.blueprint.upsert({
        where: { projectId_slug: { projectId, slug } },
        update: {},
        create: {
          projectId,
          slug,
          nameSingular: bp.nameSingular ?? slug,
          namePlural: bp.namePlural ?? slug,
          icon: bp.icon ?? 'mdi-help',
          category: bp.category ?? '',
          displayOrder: i,
          extraFields: bp.extraFields ?? [],
          isBuiltIn: true
        }
      })
    } catch {
      // Blueprint file not found or not compatible — skip gracefully
      console.warn(`[blueprintService] Could not load blueprint: ${slug}`)
    }
  }
}
