import type { FastifyPluginAsync } from 'fastify'
import { requireProjectAccess } from '../../middleware/requireProjectAccess'
import { documentService } from '../../services/documentService'
import { filterDocumentForPlayer, validateDocumentWriteForPlayer } from '../../services/masterOnlyFilter'

export const documentRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /api/projects/:projectId/documents — all docs summary (tree)
  fastify.get('/', { preHandler: requireProjectAccess() }, async (req, reply) => {
    const documents = await fastify.prisma.document.findMany({
      where: { projectId: req.projectId },
      orderBy: { createdAt: 'asc' }
    })
    if (req.projectRole === 'player') {
      const blueprints = await fastify.prisma.blueprint.findMany({ where: { projectId: req.projectId } })
      const bpMap = Object.fromEntries(blueprints.map(b => [b.slug, b]))
      return reply.send(documents.map(d => filterDocumentForPlayer(d, bpMap[d.type])))
    }
    return reply.send(documents)
  })

  // GET /api/projects/:projectId/documents/:type
  fastify.get('/:type', { preHandler: requireProjectAccess() }, async (req, reply) => {
    const { type } = req.params as { type: string }
    const documents = await fastify.prisma.document.findMany({
      where: { projectId: req.projectId, type },
      orderBy: { createdAt: 'asc' }
    })
    if (req.projectRole === 'player') {
      const blueprint = await fastify.prisma.blueprint.findUnique({
        where: { projectId_slug: { projectId: req.projectId!, slug: type } }
      })
      return reply.send(documents.map(d => filterDocumentForPlayer(d, blueprint)))
    }
    return reply.send(documents)
  })

  // GET /api/projects/:projectId/documents/:type/:docId
  fastify.get('/:type/:docId', { preHandler: requireProjectAccess() }, async (req, reply) => {
    const { type, docId } = req.params as { type: string; docId: string }
    const doc = await fastify.prisma.document.findFirst({
      where: { id: docId, projectId: req.projectId, type }
    })
    if (!doc) return reply.status(404).send({ error: 'Document not found' })

    if (req.projectRole === 'player') {
      const blueprint = await fastify.prisma.blueprint.findUnique({
        where: { projectId_slug: { projectId: req.projectId!, slug: type } }
      })
      return reply.send(filterDocumentForPlayer(doc, blueprint))
    }
    return reply.send(doc)
  })

  // POST /api/projects/:projectId/documents/:type
  fastify.post('/:type', { preHandler: requireProjectAccess() }, async (req, reply) => {
    const { type } = req.params as { type: string }
    const body = req.body as { extraFields?: unknown[]; isCategory?: boolean; parentDocId?: string }

    if (req.projectRole === 'player') {
      const blueprint = await fastify.prisma.blueprint.findUnique({
        where: { projectId_slug: { projectId: req.projectId!, slug: type } }
      })
      validateDocumentWriteForPlayer(body.extraFields ?? [], blueprint)
    }

    const doc = await documentService.createDocument(fastify.prisma, {
      projectId: req.projectId!,
      type,
      extraFields: (body.extraFields ?? []) as object[],
      isCategory: body.isCategory ?? false,
      parentDocId: body.parentDocId ?? null,
      createdById: req.user!.sub
    })
    return reply.status(201).send(doc)
  })

  // PUT /api/projects/:projectId/documents/:type/:docId
  fastify.put('/:type/:docId', { preHandler: requireProjectAccess() }, async (req, reply) => {
    const { type, docId } = req.params as { type: string; docId: string }
    const body = req.body as { extraFields?: unknown[]; isCategory?: boolean; parentDocId?: string }

    if (req.projectRole === 'player') {
      const blueprint = await fastify.prisma.blueprint.findUnique({
        where: { projectId_slug: { projectId: req.projectId!, slug: type } }
      })
      validateDocumentWriteForPlayer(body.extraFields ?? [], blueprint)
    }

    const { doc, affectedTypes } = await documentService.updateDocument(fastify.prisma, {
      id: docId,
      projectId: req.projectId!,
      type,
      extraFields: (body.extraFields ?? []) as object[],
      isCategory: body.isCategory,
      parentDocId: body.parentDocId
    })
    return reply.send({ doc, affectedTypes })
  })

  // DELETE /api/projects/:projectId/documents/:type/:docId
  fastify.delete('/:type/:docId', { preHandler: requireProjectAccess() }, async (req, reply) => {
    const { type, docId } = req.params as { type: string; docId: string }
    await documentService.deleteDocument(fastify.prisma, { id: docId, projectId: req.projectId!, type })
    return reply.send({ ok: true })
  })
}
