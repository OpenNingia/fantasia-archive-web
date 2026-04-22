import type { FastifyPluginAsync } from 'fastify'
import { requireAuth } from '../../middleware/requireAuth'
import { createWriteStream, createReadStream } from 'fs'
import { join } from 'path'
import { pipeline } from 'stream/promises'
import { randomUUID } from 'crypto'

const UPLOAD_DIR = process.env.UPLOAD_DIR ?? './uploads'

export const fileRoutes: FastifyPluginAsync = async (fastify) => {
  // POST /files/upload — multipart, requires auth + projectId in body
  fastify.post('/upload', { preHandler: requireAuth }, async (req, reply) => {
    const parts = req.parts()
    let projectId = ''
    let savedFile: { id: string; url: string } | null = null

    for await (const part of parts) {
      if (part.type === 'field' && part.fieldname === 'projectId') {
        projectId = part.value as string
        continue
      }
      if (part.type === 'file') {
        const id = randomUUID()
        const ext = part.filename.split('.').pop() ?? 'bin'
        const storagePath = `${projectId}/${id}.${ext}`
        const fullPath = join(UPLOAD_DIR, storagePath)

        // Ensure directory exists
        const { mkdirSync } = await import('fs')
        mkdirSync(join(UPLOAD_DIR, projectId), { recursive: true })

        await pipeline(part.file, createWriteStream(fullPath))

        await fastify.prisma.uploadedFile.create({
          data: {
            id,
            projectId,
            uploadedById: req.user!.sub,
            filename: part.filename,
            mimeType: part.mimetype,
            storagePath,
            sizeBytes: BigInt(0)
          }
        })
        savedFile = { id, url: `/files/${id}` }
      }
    }

    if (!savedFile) return reply.status(400).send({ error: 'No file uploaded' })
    return reply.send(savedFile)
  })

  // GET /files/:id — serve file (auth required + project membership checked)
  fastify.get('/:id', { preHandler: requireAuth }, async (req, reply) => {
    const { id } = req.params as { id: string }
    const file = await fastify.prisma.uploadedFile.findUnique({ where: { id } })
    if (!file) return reply.status(404).send({ error: 'File not found' })

    // Verify user has access to the project
    const access = await fastify.prisma.projectAccess.findUnique({
      where: { projectId_userId: { projectId: file.projectId, userId: req.user!.sub } }
    })
    if (!access) return reply.status(403).send({ error: 'No access' })

    const fullPath = join(UPLOAD_DIR, file.storagePath)
    return reply.type(file.mimeType).send(createReadStream(fullPath))
  })
}
