import api from "./client"

export interface AuthUser {
  id: string
  email: string | null
  displayName: string | null
}

export interface AuthConfig {
  oidcEnabled: boolean
  localAuthEnabled: boolean
}

export const authApi = {
  async me (): Promise<AuthUser> {
    const { data } = await api.get<AuthUser>("/auth/me")
    return data
  },

  async getConfig (): Promise<AuthConfig> {
    const { data } = await api.get<AuthConfig>("/auth/config")
    return data
  },

  async localLogin (email: string, password: string): Promise<void> {
    await api.post("/auth/local/login", { email, password })
  },

  async localRegister (email: string, password: string, displayName: string): Promise<void> {
    await api.post("/auth/local/register", { email, password, displayName })
  },

  async refresh (): Promise<void> {
    await api.post("/auth/refresh")
  },

  async logout (): Promise<void> {
    await api.post("/auth/logout")
  },

  oidcLoginUrl (): string {
    return (process.env.API_URL ?? "") + "/auth/login"
  }
}
