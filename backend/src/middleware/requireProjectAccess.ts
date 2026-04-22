import type { FastifyRequest, FastifyReply } from 'fastify'

export type ProjectRole = 'master' | 'player'

declare module 'fastify' {
  interface FastifyRequest {
    projectRole?: ProjectRole
    projectId?: string
  }
}

export function requireProjectAccess (minRole?: ProjectRole) {
  return async (req: FastifyRequest, reply: FastifyReply) => {
    if (!req.user) {
      return reply.status(401).send({ error: 'Unauthorized' })
    }

    const projectId = (req.params as Record<string, string>).projectId
    if (!projectId) {
      return reply.status(400).send({ error: 'Missing projectId' })
    }

    const access = await req.server.prisma.projectAccess.findUnique({
      where: { projectId_userId: { projectId, userId: req.user.sub } }
    })

    if (!access) {
      return reply.status(403).send({ error: 'No access to this project' })
    }

    if (minRole === 'master' && access.role !== 'master') {
      return reply.status(403).send({ error: 'Master role required' })
    }

    req.projectRole = access.role as ProjectRole
    req.projectId = projectId
  }
}

export const requireMaster = requireProjectAccess('master')
