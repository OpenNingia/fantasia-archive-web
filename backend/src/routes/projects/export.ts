import type { FastifyPluginAsync } from 'fastify'
import { requireProjectAccess, requireMaster } from '../../middleware/requireProjectAccess'
import { exportProjectToZip, importProjectFromZip } from '../../services/exportService'

export const exportRoutes: FastifyPluginAsync = async (fastify) => {
  // GET export — any project member can export
  fastify.get('/export', { preHandler: requireProjectAccess() }, async (req, reply) => {
    const zipBuffer = await exportProjectToZip(fastify.prisma, req.projectId!)
    reply.header('Content-Type', 'application/zip')
    reply.header('Content-Disposition', 'attachment; filename="project-backup.zip"')
    return reply.send(zipBuffer)
  })

  // POST import — master only
  fastify.post('/import', { preHandler: requireMaster }, async (req, reply) => {
    try {
      const data = await req.file()
      if (!data) return reply.status(400).send({ error: 'No file provided' })
      const buffer = await data.toBuffer()
      await importProjectFromZip(fastify.prisma, req.projectId!, buffer)
      return reply.send({ ok: true })
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      fastify.log.error({ err }, 'import failed')
      return reply.status(500).send({ error: message })
    }
  })
}
