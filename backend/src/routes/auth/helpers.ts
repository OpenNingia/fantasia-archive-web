import { createHash } from 'crypto'
import { nanoid } from 'nanoid'
import type { FastifyInstance, FastifyReply } from 'fastify'

const REFRESH_TOKEN_EXPIRY_DAYS = Number(process.env.REFRESH_TOKEN_EXPIRY_DAYS ?? 7)

export const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  path: '/'
}

export function hashToken (token: string) {
  return createHash('sha256').update(token).digest('hex')
}

export async function issueAuthCookies (
  fastify: FastifyInstance,
  reply: FastifyReply,
  userId: string,
  email?: string | null,
  displayName?: string | null
) {
  const jwt = await fastify.signJwt({ sub: userId, email: email ?? undefined, displayName: displayName ?? undefined })

  const rawRefresh = nanoid(64)
  const tokenHash = hashToken(rawRefresh)
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 86400 * 1000)

  await fastify.prisma.refreshToken.create({
    data: { userId, tokenHash, expiresAt }
  })

  reply.setCookie('fa_token', jwt, { ...COOKIE_OPTS, maxAge: Number(process.env.JWT_EXPIRY ?? 900) })
  reply.setCookie('fa_refresh', rawRefresh, { ...COOKIE_OPTS, maxAge: REFRESH_TOKEN_EXPIRY_DAYS * 86400 })
}
