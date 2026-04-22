import type { FastifyPluginAsync } from 'fastify'
import { generators } from '../../plugins/oidc'
import { compareSync, hashSync } from 'bcryptjs'
import { z } from 'zod'
import { issueAuthCookies, hashToken, COOKIE_OPTS } from './helpers'

export const authRoutes: FastifyPluginAsync = async (fastify) => {
  // ─── OIDC login redirect ────────────────────────────────────────────────────
  fastify.get('/login', async (req, reply) => {
    if (!fastify.oidcClient) {
      return reply.status(503).send({ error: 'OIDC not configured — use /auth/local/login' })
    }
    const state = generators.state()
    const nonce = generators.nonce()
    const url = fastify.oidcClient.authorizationUrl({ scope: 'openid email profile', state, nonce })
    reply.setCookie('oidc_state', state, { ...COOKIE_OPTS, maxAge: 300 })
    reply.setCookie('oidc_nonce', nonce, { ...COOKIE_OPTS, maxAge: 300 })
    return reply.redirect(url)
  })

  // ─── OIDC callback ──────────────────────────────────────────────────────────
  fastify.get('/callback', async (req, reply) => {
    if (!fastify.oidcClient) {
      return reply.status(503).send({ error: 'OIDC not configured' })
    }
    const storedState = req.cookies?.oidc_state
    const storedNonce = req.cookies?.oidc_nonce

    const params = fastify.oidcClient.callbackParams(req.url)
    const tokenSet = await fastify.oidcClient.callback(
      process.env.OIDC_REDIRECT_URI ?? `${process.env.BASE_URL}/auth/callback`,
      params,
      { state: storedState, nonce: storedNonce }
    )
    const claims = tokenSet.claims()

    const user = await fastify.prisma.user.upsert({
      where: { oidcSub_oidcIss: { oidcSub: claims.sub, oidcIss: claims.iss } },
      update: {
        email: claims.email,
        displayName: (claims.name ?? claims.preferred_username ?? undefined) as string | undefined
      },
      create: {
        oidcSub: claims.sub,
        oidcIss: claims.iss,
        email: claims.email,
        displayName: (claims.name ?? claims.preferred_username ?? undefined) as string | undefined
      }
    })

    await issueAuthCookies(fastify, reply, user.id, user.email, user.displayName)
    return reply.redirect(process.env.BASE_URL ?? '/')
  })

  // ─── Local login (MVP fallback, enabled via LOCAL_AUTH_ENABLED=true) ────────
  const LocalLoginBody = z.object({
    email: z.string().email(),
    password: z.string().min(8)
  })

  fastify.post('/local/login', async (req, reply) => {
    if (process.env.LOCAL_AUTH_ENABLED !== 'true') {
      return reply.status(404).send({ error: 'Local auth not enabled' })
    }
    const parsed = LocalLoginBody.safeParse(req.body)
    if (!parsed.success) return reply.status(400).send({ error: parsed.error.flatten() })

    const { email, password } = parsed.data
    const user = await fastify.prisma.user.findFirst({ where: { email } })
    if (!user?.passwordHash || !compareSync(password, user.passwordHash)) {
      return reply.status(401).send({ error: 'Invalid credentials' })
    }
    await issueAuthCookies(fastify, reply, user.id, user.email, user.displayName)
    return reply.send({ ok: true })
  })

  // ─── Local registration (first-time admin bootstrap) ───────────────────────
  const RegisterBody = z.object({
    email: z.string().email(),
    password: z.string().min(8),
    displayName: z.string().min(1)
  })

  fastify.post('/local/register', async (req, reply) => {
    if (process.env.LOCAL_AUTH_ENABLED !== 'true') {
      return reply.status(404).send({ error: 'Local auth not enabled' })
    }
    const parsed = RegisterBody.safeParse(req.body)
    if (!parsed.success) return reply.status(400).send({ error: parsed.error.flatten() })

    const { email, password, displayName } = parsed.data
    const existing = await fastify.prisma.user.findFirst({ where: { email } })
    if (existing) return reply.status(409).send({ error: 'Email already registered' })

    const user = await fastify.prisma.user.create({
      data: { email, displayName, passwordHash: hashSync(password, 12) }
    })
    await issueAuthCookies(fastify, reply, user.id, user.email, user.displayName)
    return reply.status(201).send({ ok: true })
  })

  // ─── Refresh token ──────────────────────────────────────────────────────────
  fastify.post('/refresh', async (req, reply) => {
    const rawToken = req.cookies?.fa_refresh
    if (!rawToken) return reply.status(401).send({ error: 'No refresh token' })

    const tokenHash = hashToken(rawToken)
    const stored = await fastify.prisma.refreshToken.findUnique({ where: { tokenHash } })
    if (!stored || stored.expiresAt < new Date()) {
      return reply.status(401).send({ error: 'Refresh token expired or invalid' })
    }
    const user = await fastify.prisma.user.findUnique({ where: { id: stored.userId } })
    if (!user) return reply.status(401).send({ error: 'User not found' })

    await fastify.prisma.refreshToken.delete({ where: { tokenHash } })
    await issueAuthCookies(fastify, reply, user.id, user.email, user.displayName)
    return reply.send({ ok: true })
  })

  // ─── Logout ─────────────────────────────────────────────────────────────────
  fastify.post('/logout', async (req, reply) => {
    const rawToken = req.cookies?.fa_refresh
    if (rawToken) {
      await fastify.prisma.refreshToken.deleteMany({ where: { tokenHash: hashToken(rawToken) } })
    }
    reply.clearCookie('fa_token', COOKIE_OPTS)
    reply.clearCookie('fa_refresh', COOKIE_OPTS)
    return reply.send({ ok: true })
  })

  // ─── Current user ────────────────────────────────────────────────────────────
  fastify.get('/me', async (req, reply) => {
    if (!req.user) return reply.status(401).send({ error: 'Not authenticated' })
    return reply.send({ id: req.user.sub, email: req.user.email, displayName: req.user.displayName })
  })
}
