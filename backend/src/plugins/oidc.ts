import fp from 'fastify-plugin'
import { Issuer, generators } from 'openid-client'
import type { Client } from 'openid-client'
import type { FastifyPluginAsync } from 'fastify'

declare module 'fastify' {
  interface FastifyInstance {
    oidcClient: Client | null
  }
}

const plugin: FastifyPluginAsync = async (fastify) => {
  const issuerUrl = process.env.OIDC_ISSUER_URL
  if (!issuerUrl) {
    fastify.log.warn('OIDC_ISSUER_URL not set — OIDC login disabled')
    fastify.decorate('oidcClient', null)
    return
  }

  try {
    const issuer = await Issuer.discover(issuerUrl)
    const client = new issuer.Client({
      client_id: process.env.OIDC_CLIENT_ID ?? '',
      client_secret: process.env.OIDC_CLIENT_SECRET ?? '',
      redirect_uris: [process.env.OIDC_REDIRECT_URI ?? `${process.env.BACKEND_URL}/auth/callback`],
      response_types: ['code']
    })
    fastify.decorate('oidcClient', client)
    fastify.log.info(`OIDC configured with issuer: ${issuer.metadata.issuer}`)
  } catch (err) {
    fastify.log.error('Failed to discover OIDC issuer: %s', (err as Error).message)
    fastify.decorate('oidcClient', null)
  }
}

export const oidcPlugin = fp(plugin, { name: 'oidc' })
export { generators }
