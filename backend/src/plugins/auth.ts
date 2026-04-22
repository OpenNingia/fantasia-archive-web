import fp from 'fastify-plugin'
import { jwtVerify, SignJWT } from 'jose'
import type { FastifyPluginAsync, FastifyRequest } from 'fastify'

export interface JwtPayload {
  sub: string      // user id
  email?: string
  displayName?: string
  iat: number
  exp: number
}

declare module 'fastify' {
  interface FastifyRequest {
    user?: JwtPayload
  }
  interface FastifyInstance {
    signJwt(payload: Omit<JwtPayload, 'iat' | 'exp'>): Promise<string>
    verifyJwt(token: string): Promise<JwtPayload>
  }
}

const plugin: FastifyPluginAsync = async (fastify) => {
  const secret = new TextEncoder().encode(
    process.env.JWT_SECRET ?? 'change-me-in-production-min-32-chars!!'
  )
  const expirySeconds = Number(process.env.JWT_EXPIRY ?? 900)

  fastify.decorate('signJwt', async (payload: Omit<JwtPayload, 'iat' | 'exp'>) => {
    return new SignJWT(payload as Record<string, unknown>)
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime(`${expirySeconds}s`)
      .sign(secret)
  })

  fastify.decorate('verifyJwt', async (token: string): Promise<JwtPayload> => {
    const { payload } = await jwtVerify(token, secret)
    return payload as unknown as JwtPayload
  })

  // Decorator to extract user from cookie on every request (non-blocking — missing JWT is OK)
  fastify.addHook('preHandler', async (req: FastifyRequest) => {
    const token = req.cookies?.fa_token
    if (!token) return
    try {
      req.user = await fastify.verifyJwt(token)
    } catch {
      // expired or invalid — user stays undefined; protected routes will reject
    }
  })
}

export const authPlugin = fp(plugin, { name: 'auth', dependencies: ['prisma'] })
