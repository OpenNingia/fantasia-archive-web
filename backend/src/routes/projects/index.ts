import type { FastifyPluginAsync } from 'fastify'
import { requireAuth } from '../../middleware/requireAuth'
import { requireProjectAccess, requireMaster } from '../../middleware/requireProjectAccess'
import { seedBlueprintsForProject } from '../../services/blueprintService'
import { z } from 'zod'

export const projectRoutes: FastifyPluginAsync = async (fastify) => {
  // ─── List projects accessible by the current user ───────────────────────────
  fastify.get('/', { preHandler: requireAuth }, async (req, reply) => {
    const rows = await fastify.prisma.projectAccess.findMany({
      where: { userId: req.user!.sub },
      include: { project: true }
    })
    return reply.send(rows.map(r => ({ ...r.project, role: r.role })))
  })

  // ─── Create project ─────────────────────────────────────────────────────────
  const CreateProjectBody = z.object({ name: z.string().min(1) })

  fastify.post('/', { preHandler: requireAuth }, async (req, reply) => {
    const parsed = CreateProjectBody.safeParse(req.body)
    if (!parsed.success) return reply.status(400).send({ error: parsed.error.flatten() })

    const project = await fastify.prisma.project.create({
      data: { name: parsed.data.name, createdById: req.user!.sub }
    })
    await fastify.prisma.projectAccess.create({
      data: { projectId: project.id, userId: req.user!.sub, role: 'master' }
    })
    await seedBlueprintsForProject(fastify.prisma, project.id)
    return reply.status(201).send(project)
  })

  // ─── Get project ─────────────────────────────────────────────────────────────
  fastify.get('/:projectId', { preHandler: requireProjectAccess() }, async (req, reply) => {
    const project = await fastify.prisma.project.findUnique({ where: { id: req.projectId } })
    return reply.send({ ...project, role: req.projectRole })
  })

  // ─── Update project ──────────────────────────────────────────────────────────
  const UpdateProjectBody = z.object({
    name: z.string().min(1).optional(),
    customCss: z.string().optional(),
    corkboardText: z.string().optional()
  })

  fastify.put('/:projectId', { preHandler: requireMaster }, async (req, reply) => {
    const parsed = UpdateProjectBody.safeParse(req.body)
    if (!parsed.success) return reply.status(400).send({ error: parsed.error.flatten() })
    const project = await fastify.prisma.project.update({
      where: { id: req.projectId },
      data: parsed.data
    })
    return reply.send(project)
  })

  // ─── Delete project ──────────────────────────────────────────────────────────
  fastify.delete('/:projectId', { preHandler: requireMaster }, async (req, reply) => {
    await fastify.prisma.project.delete({ where: { id: req.projectId } })
    return reply.send({ ok: true })
  })

  // ─── ACL: list members ───────────────────────────────────────────────────────
  fastify.get('/:projectId/access', { preHandler: requireMaster }, async (req, reply) => {
    const members = await fastify.prisma.projectAccess.findMany({
      where: { projectId: req.projectId },
      include: { user: { select: { id: true, email: true, displayName: true } } }
    })
    return reply.send(members)
  })

  // ─── ACL: add member ─────────────────────────────────────────────────────────
  const AccessBody = z.object({
    userId: z.string().uuid(),
    role: z.enum(['master', 'player'])
  })

  fastify.post('/:projectId/access', { preHandler: requireMaster }, async (req, reply) => {
    const parsed = AccessBody.safeParse(req.body)
    if (!parsed.success) return reply.status(400).send({ error: parsed.error.flatten() })
    const access = await fastify.prisma.projectAccess.create({
      data: { projectId: req.projectId!, ...parsed.data }
    })
    return reply.status(201).send(access)
  })

  // ─── ACL: update member role ─────────────────────────────────────────────────
  fastify.put('/:projectId/access/:userId', { preHandler: requireMaster }, async (req, reply) => {
    const { userId } = req.params as { userId: string; projectId: string }
    const parsed = z.object({ role: z.enum(['master', 'player']) }).safeParse(req.body)
    if (!parsed.success) return reply.status(400).send({ error: parsed.error.flatten() })
    const access = await fastify.prisma.projectAccess.update({
      where: { projectId_userId: { projectId: req.projectId!, userId } },
      data: { role: parsed.data.role }
    })
    return reply.send(access)
  })

  // ─── ACL: remove member ──────────────────────────────────────────────────────
  fastify.delete('/:projectId/access/:userId', { preHandler: requireMaster }, async (req, reply) => {
    const { userId } = req.params as { userId: string; projectId: string }
    await fastify.prisma.projectAccess.delete({
      where: { projectId_userId: { projectId: req.projectId!, userId } }
    })
    return reply.send({ ok: true })
  })

  // ─── Blueprints, documents, export/import — registered as sub-plugins ────────
  // (Implemented in Phase 2)
  const { blueprintRoutes } = await import('./blueprints')
  const { documentRoutes } = await import('./documents')
  const { exportRoutes } = await import('./export')

  fastify.register(blueprintRoutes, { prefix: '/:projectId/blueprints' })
  fastify.register(documentRoutes, { prefix: '/:projectId/documents' })
  fastify.register(exportRoutes, { prefix: '/:projectId' })
}
