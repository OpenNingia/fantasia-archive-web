import api from "./client"

export interface UserSearchResult {
  id: string
  email: string | null
  displayName: string | null
}

export const userApi = {
  async search (email: string): Promise<UserSearchResult[]> {
    const { data } = await api.get<UserSearchResult[]>("/api/users/search", { params: { email } })
    return data
  }
}
