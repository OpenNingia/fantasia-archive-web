#!/usr/bin/env tsx
/**
 * Pre-build script: imports all frontend blueprint definitions (pure TypeScript data,
 * no PouchDB/Electron deps) and writes them to src/data/blueprints.json.
 * Run automatically via "predev" / "prebuild" npm scripts.
 */

import { writeFileSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Blueprint files relative to this script (backend/scripts/ → repo root → src/...)
const BLUEPRINTS_DIR = '../../src/scripts/databaseManager/blueprints'

const FILES = [
  { file: 'characters',        export: 'charactersBlueprint' },
  { file: 'locations',         export: 'locationsBlueprint' },
  { file: 'items',             export: 'itemsBlueprint' },
  { file: 'events',            export: 'eventsBlueprint' },
  { file: 'magic',             export: 'magicBlueprint' },
  { file: 'races',             export: 'racesBlueprint' },
  { file: 'religions',         export: 'religionsBlueprint' },
  { file: 'languages',         export: 'languagesBlueprint' },
  { file: 'currencies',        export: 'currenciesBlueprint' },
  { file: 'guilds',            export: 'guildsBlueprint' },
  { file: 'skills',            export: 'skillsBlueprint' },
  { file: 'professions',       export: 'professionsBlueprint' },
  { file: 'resources',         export: 'resourcesBlueprint' },
  { file: 'conditions',        export: 'conditionsBlueprint' },
  { file: 'myths',             export: 'mythsBlueprint' },
  { file: 'loreNotes',         export: 'loreNotesBlueprint' },
  { file: 'chapters',          export: 'chaptersBlueprint' },
  { file: 'scienceTechnology', export: 'techBlueprint' },
  { file: 'politicalGroups',   export: 'politicalGroupsBlueprint' },
  { file: 'culture',           export: 'cultureBlueprint' },
]

async function main () {
  const blueprints = []
  const failures: { file: string; reason: string }[] = []

  for (const { file, export: exportName } of FILES) {
    try {
      const mod = await import(`${BLUEPRINTS_DIR}/${file}`)
      const bp = mod[exportName]
      if (!bp) {
        failures.push({ file, reason: `export '${exportName}' not found` })
        console.error(`  ✗ ${file}: export '${exportName}' not found`)
        continue
      }
      blueprints.push(bp)
      console.log(`  ✓ ${file}`)
    } catch (err) {
      const reason = (err as Error).message
      failures.push({ file, reason })
      console.error(`  ✗ ${file}: ${reason}`)
    }
  }

  if (failures.length > 0) {
    console.error(`\n${failures.length} blueprint(s) failed to load — refusing to write a partial blueprints.json.`)
    process.exit(1)
  }

  const outDir = join(__dirname, '../src/data')
  mkdirSync(outDir, { recursive: true })
  const outPath = join(outDir, 'blueprints.json')
  writeFileSync(outPath, JSON.stringify(blueprints, null, 2))
  console.log(`\nWrote ${blueprints.length} blueprints → src/data/blueprints.json`)
}

main().catch(err => { console.error(err); process.exit(1) })
