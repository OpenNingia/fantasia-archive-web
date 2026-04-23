import api from "./client"

export interface BlueprintField {
  id: string
  name: string
  type: string
  icon: string
  sizing?: number
  masterOnly?: boolean
  tooltip?: string
  [key: string]: unknown
}

export interface Blueprint {
  id: string
  projectId: string
  slug: string
  nameSingular: string
  namePlural: string
  icon: string
  category: string
  displayOrder: number
  extraFields: BlueprintField[]
  isBuiltIn: boolean
}

export const blueprintApi = {
  async list (projectId: string): Promise<Blueprint[]> {
    const { data } = await api.get<Blueprint[]>(`/api/projects/${projectId}/blueprints`)
    return data
  },

  async updateFields (projectId: string, slug: string, extraFields: BlueprintField[]): Promise<Blueprint> {
    const { data } = await api.put<Blueprint>(`/api/projects/${projectId}/blueprints/${slug}`, { extraFields })
    return data
  }
}
