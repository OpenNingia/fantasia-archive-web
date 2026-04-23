import { GetterTree } from "vuex"
import { StateInterface } from "../index"
import type { ProjectInterface } from "./state"

const getters: GetterTree<ProjectInterface, StateInterface> = {
  getProjectData (context) {
    return context
  },

  getProjectLoadedStatus (context) {
    return context.projectLoaded
  },

  getProjectName (context) {
    return context.projectName
  },

  getProjectCustomCSS (context) {
    return context.projectCustomCSS
  },

  currentUser (context) {
    return context.currentUser
  },

  currentUserRole (context) {
    return context.currentUserRole
  },

  currentProjectId (context) {
    return context.currentProjectId
  },

  isMaster (context) {
    return context.currentUserRole === "master"
  }
}

export default getters
