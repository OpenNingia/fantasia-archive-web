import Fastify from 'fastify'
import cookie from '@fastify/cookie'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import rateLimit from '@fastify/rate-limit'
import multipart from '@fastify/multipart'

import { prismaPlugin } from './plugins/prisma'
import { authPlugin } from './plugins/auth'
import { oidcPlugin } from './plugins/oidc'

import { authRoutes } from './routes/auth'
import { projectRoutes } from './routes/projects'
import { fileRoutes } from './routes/files'
import { userRoutes } from './routes/users'

const app = Fastify({
  logger: {
    level: process.env.LOG_LEVEL ?? 'info',
    transport: process.env.NODE_ENV !== 'production'
      ? { target: 'pino-pretty' }
      : undefined
  }
})

async function start () {
  await app.register(helmet, { contentSecurityPolicy: false })
  await app.register(cors, {
    origin: process.env.BASE_URL ?? 'http://localhost:9000',
    credentials: true
  })
  await app.register(rateLimit, { max: 200, timeWindow: '1 minute' })
  await app.register(cookie, { secret: process.env.COOKIE_SECRET ?? process.env.JWT_SECRET ?? 'change-me' })
  await app.register(multipart, { limits: { fileSize: 50 * 1024 * 1024 } })

  // Core plugins
  await app.register(prismaPlugin)
  await app.register(oidcPlugin)
  await app.register(authPlugin)

  // Routes
  await app.register(authRoutes, { prefix: '/auth' })
  await app.register(projectRoutes, { prefix: '/api/projects' })
  await app.register(fileRoutes, { prefix: '/files' })
  await app.register(userRoutes, { prefix: '/api/users' })

  app.get('/health', async () => ({ ok: true }))

  const port = Number(process.env.PORT ?? 3000)
  const host = process.env.HOST ?? '0.0.0.0'
  await app.listen({ port, host })
}

start().catch(err => {
  console.error(err)
  process.exit(1)
})
