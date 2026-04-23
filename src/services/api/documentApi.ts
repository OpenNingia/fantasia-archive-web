import api from "./client"

export interface DocumentRecord {
  id: string
  projectId: string
  type: string
  extraFields: Array<{ id: string; value: unknown }>
  isCategory: boolean
  parentDocId: string | null
  createdById: string | null
  createdAt: string
  updatedAt: string
}

export interface DocumentUpdateResult {
  doc: DocumentRecord
  affectedTypes: string[]
}

export const documentApi = {
  async listAll (projectId: string): Promise<DocumentRecord[]> {
    const { data } = await api.get<DocumentRecord[]>(`/api/projects/${projectId}/documents`)
    return data
  },

  async listByType (projectId: string, type: string): Promise<DocumentRecord[]> {
    const { data } = await api.get<DocumentRecord[]>(`/api/projects/${projectId}/documents/${type}`)
    return data
  },

  async get (projectId: string, type: string, docId: string): Promise<DocumentRecord> {
    const { data } = await api.get<DocumentRecord>(`/api/projects/${projectId}/documents/${type}/${docId}`)
    return data
  },

  async create (
    projectId: string,
    type: string,
    payload: { extraFields?: Array<{ id: string; value: unknown }>; isCategory?: boolean; parentDocId?: string }
  ): Promise<DocumentRecord> {
    const { data } = await api.post<DocumentRecord>(`/api/projects/${projectId}/documents/${type}`, payload)
    return data
  },

  async update (
    projectId: string,
    type: string,
    docId: string,
    payload: { extraFields?: Array<{ id: string; value: unknown }>; isCategory?: boolean; parentDocId?: string }
  ): Promise<DocumentUpdateResult> {
    const { data } = await api.put<DocumentUpdateResult>(`/api/projects/${projectId}/documents/${type}/${docId}`, payload)
    return data
  },

  async delete (projectId: string, type: string, docId: string): Promise<void> {
    await api.delete(`/api/projects/${projectId}/documents/${type}/${docId}`)
  }
}
