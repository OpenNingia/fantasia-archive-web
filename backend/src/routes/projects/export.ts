import type { FastifyPluginAsync } from 'fastify'
import { requireMaster } from '../../middleware/requireProjectAccess'

// Full implementation in Phase 6 — stubs for now
export const exportRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post('/export', { preHandler: requireMaster }, async (_req, reply) => {
    return reply.status(501).send({ error: 'Export not yet implemented' })
  })

  fastify.post('/import', { preHandler: requireMaster }, async (_req, reply) => {
    return reply.status(501).send({ error: 'Import not yet implemented' })
  })
}
