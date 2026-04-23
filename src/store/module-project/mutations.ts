import { MutationTree } from "vuex"
import type { ProjectInterface } from "./state"
import type { AuthUser } from "src/services/api/authApi"

const mutation: MutationTree<ProjectInterface> = {
  setProjecLoadingState (state, input: boolean) {
    state.projectLoaded = input
  },

  setProjectName (state, input: string) {
    state.projectName = input
  },

  setProjectCustomCSS (state, input: string) {
    state.projectCustomCSS = input
  },

  SET_CURRENT_USER (state, user: AuthUser | null) {
    state.currentUser = user
  },

  SET_CURRENT_USER_ROLE (state, role: "master" | "player" | null) {
    state.currentUserRole = role
  },

  SET_CURRENT_PROJECT_ID (state, id: string | null) {
    state.currentProjectId = id
  }
}

export default mutation
