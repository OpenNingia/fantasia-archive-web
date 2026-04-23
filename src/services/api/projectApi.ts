import api from "./client"

export interface ProjectSummary {
  id: string
  name: string
  role: "master" | "player"
  customCss: string | null
  corkboardText: string | null
  createdAt: string
  updatedAt: string
}

export interface ProjectMember {
  id: string
  userId: string
  role: "master" | "player"
  user: { id: string; email: string | null; displayName: string | null }
}

export const projectApi = {
  async list (): Promise<ProjectSummary[]> {
    const { data } = await api.get<ProjectSummary[]>("/api/projects")
    return data
  },

  async get (projectId: string): Promise<ProjectSummary> {
    const { data } = await api.get<ProjectSummary>(`/api/projects/${projectId}`)
    return data
  },

  async create (name: string): Promise<ProjectSummary> {
    const { data } = await api.post<ProjectSummary>("/api/projects", { name })
    return data
  },

  async update (projectId: string, patch: { name?: string; customCss?: string; corkboardText?: string }): Promise<ProjectSummary> {
    const { data } = await api.put<ProjectSummary>(`/api/projects/${projectId}`, patch)
    return data
  },

  async delete (projectId: string): Promise<void> {
    await api.delete(`/api/projects/${projectId}`)
  },

  async listMembers (projectId: string): Promise<ProjectMember[]> {
    const { data } = await api.get<ProjectMember[]>(`/api/projects/${projectId}/access`)
    return data
  },

  async addMember (projectId: string, userId: string, role: "master" | "player"): Promise<void> {
    await api.post(`/api/projects/${projectId}/access`, { userId, role })
  },

  async updateMember (projectId: string, userId: string, role: "master" | "player"): Promise<void> {
    await api.put(`/api/projects/${projectId}/access/${userId}`, { role })
  },

  async removeMember (projectId: string, userId: string): Promise<void> {
    await api.delete(`/api/projects/${projectId}/access/${userId}`)
  }
}
