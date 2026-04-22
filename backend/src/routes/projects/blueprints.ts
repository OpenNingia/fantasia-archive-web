import type { FastifyPluginAsync } from 'fastify'
import { requireProjectAccess, requireMaster } from '../../middleware/requireProjectAccess'
import { filterBlueprintForPlayer } from '../../services/masterOnlyFilter'

export const blueprintRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /api/projects/:projectId/blueprints
  fastify.get('/', { preHandler: requireProjectAccess() }, async (req, reply) => {
    const blueprints = await fastify.prisma.blueprint.findMany({
      where: { projectId: req.projectId },
      orderBy: { displayOrder: 'asc' }
    })
    const result = req.projectRole === 'master'
      ? blueprints
      : blueprints.map(filterBlueprintForPlayer)
    return reply.send(result)
  })

  // PUT /api/projects/:projectId/blueprints/:slug — update field definitions (master only)
  fastify.put('/:slug', { preHandler: requireMaster }, async (req, reply) => {
    const { slug } = req.params as { slug: string }
    const { extraFields } = req.body as { extraFields: unknown[] }
    const updated = await fastify.prisma.blueprint.update({
      where: { projectId_slug: { projectId: req.projectId!, slug } },
      data: { extraFields: extraFields as object[] }
    })
    return reply.send(updated)
  })
}
