import type { FastifyPluginAsync } from 'fastify'
import { requireAuth } from '../../middleware/requireAuth'
import { z } from 'zod'

export const userRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /api/users/me
  fastify.get('/me', { preHandler: requireAuth }, async (req, reply) => {
    const user = await fastify.prisma.user.findUnique({
      where: { id: req.user!.sub },
      select: { id: true, email: true, displayName: true, createdAt: true }
    })
    return reply.send(user)
  })

  // GET /api/users/me/settings
  // Global (non-project) settings are stored with projectId = null. Composite-unique
  // findUnique can't accept null in an optional column, so use findFirst here.
  fastify.get('/me/settings', { preHandler: requireAuth }, async (req, reply) => {
    const setting = await fastify.prisma.userSetting.findFirst({
      where: { userId: req.user!.sub, projectId: null }
    })
    return reply.send(setting?.settings ?? {})
  })

  // PUT /api/users/me/settings
  fastify.put('/me/settings', { preHandler: requireAuth }, async (req, reply) => {
    const settings = req.body as object
    const existing = await fastify.prisma.userSetting.findFirst({
      where: { userId: req.user!.sub, projectId: null }
    })
    if (existing) {
      await fastify.prisma.userSetting.update({ where: { id: existing.id }, data: { settings } })
    } else {
      await fastify.prisma.userSetting.create({ data: { userId: req.user!.sub, settings } })
    }
    return reply.send({ ok: true })
  })

  // GET /api/users/search?email=... (for adding project members)
  fastify.get('/search', { preHandler: requireAuth }, async (req, reply) => {
    const { email } = req.query as { email?: string }
    if (!email || email.length < 3) return reply.status(400).send({ error: 'Provide at least 3 characters' })
    const users = await fastify.prisma.user.findMany({
      where: { email: { contains: email, mode: 'insensitive' } },
      select: { id: true, email: true, displayName: true },
      take: 10
    })
    return reply.send(users)
  })
}
