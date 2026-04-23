import type { AuthUser } from "src/services/api/authApi"

export interface ProjectInterface {
  projectLoaded: boolean
  projectName: string
  projectCustomCSS: string
  currentUser: AuthUser | null
  currentUserRole: "master" | "player" | null
  currentProjectId: string | null
}

function state (): ProjectInterface {
  return {
    projectLoaded: false,
    projectName: "",
    projectCustomCSS: "",
    currentUser: null,
    currentUserRole: null,
    currentProjectId: null
  }
}

export default state
