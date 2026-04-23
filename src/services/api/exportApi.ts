import api from "./client"

export const exportApi = {
  async exportZip (projectId: string): Promise<Blob> {
    const { data } = await api.get(`/api/projects/${projectId}/export`, { responseType: "blob" })
    return data as Blob
  },

  async importZip (projectId: string, file: File): Promise<void> {
    const form = new FormData()
    form.append("file", file)
    await api.post(`/api/projects/${projectId}/import`, form)
  }
}
