import { APIRequestContext } from '@playwright/test'

const API_URL = process.env.API_URL ?? 'http://localhost:3000'

export function apiUrl (path: string) {
  return `${API_URL}${path}`
}

export async function createProject (request: APIRequestContext, name: string): Promise<string> {
  const res = await request.post(apiUrl('/api/projects'), { data: { name } })
  const json = await res.json()
  return json.id as string
}

export async function deleteProject (request: APIRequestContext, projectId: string) {
  await request.delete(apiUrl(`/api/projects/${projectId}`))
}

export async function getBlueprints (request: APIRequestContext, projectId: string) {
  const res = await request.get(apiUrl(`/api/projects/${projectId}/blueprints`))
  return res.json() as Promise<Array<{ slug: string; nameSingular: string; extraFields: object[] }>>
}

export async function createDocument (
  request: APIRequestContext,
  projectId: string,
  type: string,
  extraFields: object[] = []
): Promise<{ id: string; type: string }> {
  const res = await request.post(
    apiUrl(`/api/projects/${projectId}/documents/${type}`),
    { data: { extraFields } }
  )
  return res.json()
}

export async function addProjectMember (
  request: APIRequestContext,
  projectId: string,
  userId: string,
  role: 'master' | 'player'
) {
  await request.post(apiUrl(`/api/projects/${projectId}/access`), {
    data: { userId, role }
  })
}

export async function getUserId (request: APIRequestContext): Promise<string> {
  const res = await request.get(apiUrl('/auth/me'))
  const json = await res.json()
  return json.id as string
}

export async function updateProject (
  request: APIRequestContext,
  projectId: string,
  data: { name?: string; customCss?: string; corkboardText?: string }
) {
  const res = await request.put(apiUrl(`/api/projects/${projectId}`), { data })
  return { status: res.status(), body: await res.json().catch(() => ({})) }
}

export async function listProjects (request: APIRequestContext) {
  const res = await request.get(apiUrl('/api/projects'))
  return res.json() as Promise<Array<{ id: string; name: string; role: string }>>
}

export async function listProjectMembers (request: APIRequestContext, projectId: string) {
  const res = await request.get(apiUrl(`/api/projects/${projectId}/access`))
  return { status: res.status(), body: await res.json().catch(() => ({})) }
}

export async function updateProjectMemberRole (
  request: APIRequestContext,
  projectId: string,
  userId: string,
  role: 'master' | 'player'
) {
  const res = await request.put(apiUrl(`/api/projects/${projectId}/access/${userId}`), { data: { role } })
  return { status: res.status(), body: await res.json().catch(() => ({})) }
}

export async function removeProjectMember (
  request: APIRequestContext,
  projectId: string,
  userId: string
) {
  const res = await request.delete(apiUrl(`/api/projects/${projectId}/access/${userId}`))
  return res.status()
}

export async function listDocuments (request: APIRequestContext, projectId: string) {
  const res = await request.get(apiUrl(`/api/projects/${projectId}/documents`))
  return res.json() as Promise<Array<{ id: string; type: string; extraFields: unknown[] }>>
}

export async function getDocument (
  request: APIRequestContext,
  projectId: string,
  type: string,
  docId: string
) {
  const res = await request.get(apiUrl(`/api/projects/${projectId}/documents/${type}/${docId}`))
  return { status: res.status(), body: await res.json().catch(() => ({})) }
}

export async function updateDocument (
  request: APIRequestContext,
  projectId: string,
  type: string,
  docId: string,
  data: { extraFields?: unknown[]; isCategory?: boolean; parentDocId?: string | null }
) {
  const res = await request.put(
    apiUrl(`/api/projects/${projectId}/documents/${type}/${docId}`),
    { data }
  )
  return { status: res.status(), body: await res.json().catch(() => ({})) }
}

export async function deleteDocument (
  request: APIRequestContext,
  projectId: string,
  type: string,
  docId: string
) {
  const res = await request.delete(apiUrl(`/api/projects/${projectId}/documents/${type}/${docId}`))
  return res.status()
}

export async function updateBlueprint (
  request: APIRequestContext,
  projectId: string,
  slug: string,
  extraFields: unknown[]
) {
  const res = await request.put(
    apiUrl(`/api/projects/${projectId}/blueprints/${slug}`),
    { data: { extraFields } }
  )
  return { status: res.status(), body: await res.json().catch(() => ({})) }
}
