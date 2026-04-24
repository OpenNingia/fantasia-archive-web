import { defineStore } from "pinia"
import type { AuthUser } from "src/services/api/authApi"

export const useProjectStore = defineStore("project", {
  state: () => ({
    projectLoaded: false,
    projectName: "",
    projectCustomCSS: "",
    currentUser: null as AuthUser | null,
    currentUserRole: null as "master" | "player" | null,
    currentProjectId: null as string | null
  }),

  getters: {
    getProjectData: (state) => state,
    getProjectLoadedStatus: (state) => state.projectLoaded,
    getProjectName: (state) => state.projectName,
    getProjectCustomCSS: (state) => state.projectCustomCSS,
    isMaster: (state) => state.currentUserRole === "master"
  },

  actions: {
    setProjecLoadingState (input: boolean) {
      this.projectLoaded = input
    },

    setProjectName (input: string) {
      this.projectName = input
    },

    setProjectCustomCSS (input: string) {
      this.projectCustomCSS = input
    },

    setCurrentUser (user: AuthUser | null) {
      this.currentUser = user
    },

    setCurrentUserRole (role: "master" | "player" | null) {
      this.currentUserRole = role
    },

    setCurrentProjectId (id: string | null) {
      this.currentProjectId = id
    }
  }
})
