// Stub for Node.js-only modules imported by ExportProject.vue.
// The real implementation will be replaced in Phase 6 (server-side export via REST API).
const noop = () => undefined
const handler: ProxyHandler<object> = {
  get: () => new Proxy({}, handler),
  apply: () => undefined,
  construct: () => new Proxy({}, handler)
}
export default new Proxy({}, handler)
export const readFileSync = noop
export const writeFileSync = noop
export const existsSync = () => false
export const mkdirSync = noop
export const copySync = noop
export const outputFileSync = noop
export const removeSync = noop
