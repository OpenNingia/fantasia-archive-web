import api from "./client"

export interface BackendVersion {
  version: string
  buildDate: string | null
}

export const versionApi = {
  async get (): Promise<BackendVersion> {
    const { data } = await api.get<BackendVersion>("/api/version")
    return data
  }
}
