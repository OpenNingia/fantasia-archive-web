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
  fastify.get('/me/settings', { preHandler: requireAuth }, async (req, reply) => {
    const setting = await fastify.prisma.userSetting.findUnique({
      where: { userId_projectId: { userId: req.user!.sub, projectId: null as unknown as string } }
    })
    return reply.send(setting?.settings ?? {})
  })

  // PUT /api/users/me/settings
  fastify.put('/me/settings', { preHandler: requireAuth }, async (req, reply) => {
    const settings = req.body as object
    await fastify.prisma.userSetting.upsert({
      where: { userId_projectId: { userId: req.user!.sub, projectId: null as unknown as string } },
      update: { settings },
      create: { userId: req.user!.sub, settings }
    })
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
