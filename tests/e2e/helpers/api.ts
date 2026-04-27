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
