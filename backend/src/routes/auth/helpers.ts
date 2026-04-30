import { createHash } from 'crypto'
import { nanoid } from 'nanoid'
import type { FastifyInstance, FastifyReply } from 'fastify'

const REFRESH_TOKEN_EXPIRY_DAYS = Number(process.env.REFRESH_TOKEN_EXPIRY_DAYS ?? 7)

export const TOKEN_COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  path: '/'
}

// Lax (not Strict) so cookies survive the top-level redirect back from the IdP.
export const OIDC_COOKIE_OPTS = {
  ...TOKEN_COOKIE_OPTS,
  sameSite: 'lax' as const
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

  reply.setCookie('fa_token', jwt, { ...TOKEN_COOKIE_OPTS, maxAge: Number(process.env.JWT_EXPIRY ?? 900) })
  reply.setCookie('fa_refresh', rawRefresh, { ...TOKEN_COOKIE_OPTS, maxAge: REFRESH_TOKEN_EXPIRY_DAYS * 86400 })
}
