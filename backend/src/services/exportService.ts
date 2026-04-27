import archiver from 'archiver'
import { Writable } from 'stream'
import unzipper from 'unzipper'
import type { PrismaClient } from '@prisma/client'

// ─── Export ───────────────────────────────────────────────────────────────────

export async function exportProjectToZip (prisma: PrismaClient, projectId: string): Promise<Buffer> {
  const [project, blueprints, documents] = await Promise.all([
    prisma.project.findUnique({ where: { id: projectId } }),
    prisma.blueprint.findMany({ where: { projectId } }),
    prisma.document.findMany({ where: { projectId } })
  ])

  const projectMeta = project
    ? {
        name: project.name,
        customCss: project.customCss,
        corkboardText: project.corkboardText,
        appVersion: project.appVersion
      }
    : {}

  const chunks: Buffer[] = []
  const output = new Writable({
    write (chunk: Buffer, _enc: BufferEncoding, cb: () => void) {
      chunks.push(chunk)
      cb()
    }
  })

  const archive = archiver('zip', { zlib: { level: 6 } })
  archive.pipe(output)

  archive.append(JSON.stringify(projectMeta, null, 2), { name: 'project.json' })
  archive.append(JSON.stringify(blueprints, null, 2), { name: 'blueprints.json' })
  archive.append(JSON.stringify(documents, null, 2), { name: 'documents.json' })

  await new Promise<void>((resolve, reject) => {
    output.on('finish', resolve)
    output.on('error', reject)
    archive.on('error', reject)
    archive.finalize().catch(reject)
  })

  return Buffer.concat(chunks as Uint8Array[])
}

// ─── Import ───────────────────────────────────────────────────────────────────

export async function importProjectFromZip (
  prisma: PrismaClient,
  projectId: string,
  zipBuffer: Buffer
): Promise<void> {
  const directory = await unzipper.Open.buffer(zipBuffer)

  const documentsFile = directory.files.find(f => f.path === 'documents.json')
  const blueprintsFile = directory.files.find(f => f.path === 'blueprints.json')

  if (!documentsFile) throw new Error('ZIP does not contain documents.json')
  if (!blueprintsFile) throw new Error('ZIP does not contain blueprints.json')

  const documentsContent = await documentsFile.buffer()
  const blueprintsContent = await blueprintsFile.buffer()

  const documents: Array<Record<string, unknown>> = JSON.parse(documentsContent.toString('utf-8'))
  const blueprints: Array<Record<string, unknown>> = JSON.parse(blueprintsContent.toString('utf-8'))

  // Delete existing documents for this project
  await prisma.document.deleteMany({ where: { projectId } })

  // Update blueprint custom fields (don't recreate seeded blueprints — just patch extraFields)
  for (const bp of blueprints) {
    const slug = (bp.slug ?? bp._id) as string | undefined
    if (!slug) continue
    await prisma.blueprint.updateMany({
      where: { projectId, slug },
      data: { extraFields: bp.extraFields as object[] ?? [] }
    })
  }

  // Recreate all documents with fresh IDs so they never collide with originals still in the DB
  if (documents.length > 0) {
    const { randomUUID } = await import('crypto')
    const idMap = new Map<string, string>()
    for (const d of documents) {
      idMap.set(d.id as string, randomUUID())
    }
    await prisma.document.createMany({
      data: documents.map(d => ({
        id: idMap.get(d.id as string)!,
        projectId,
        type: d.type as string,
        extraFields: (d.extraFields ?? []) as object[],
        isCategory: (d.isCategory ?? false) as boolean,
        parentDocId: d.parentDocId ? (idMap.get(d.parentDocId as string) ?? null) : null,
        createdById: (d.createdById ?? null) as string | null,
        createdAt: d.createdAt ? new Date(d.createdAt as string) : undefined,
        updatedAt: d.updatedAt ? new Date(d.updatedAt as string) : undefined
      }))
    })
  }
}
