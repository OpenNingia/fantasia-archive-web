import api from "./client"

export interface UploadedFile {
  id: string
  filename: string
  mimeType: string
  sizeBytes: number | null
  createdAt: string
}

export const fileApi = {
  async upload (projectId: string, file: File): Promise<UploadedFile> {
    const form = new FormData()
    form.append("file", file)
    const { data } = await api.post<UploadedFile>(`/files/upload?projectId=${projectId}`, form)
    return data
  },

  fileUrl (fileId: string): string {
    return `${process.env.API_URL ?? ""}/files/${fileId}`
  }
}
