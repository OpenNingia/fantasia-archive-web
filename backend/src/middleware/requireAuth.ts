import type { FastifyRequest, FastifyReply } from 'fastify'

export async function requireAuth (req: FastifyRequest, reply: FastifyReply) {
  if (!req.user) {
    return reply.status(401).send({ error: 'Unauthorized' })
  }
}
