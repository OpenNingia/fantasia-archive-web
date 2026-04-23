import { ActionTree } from "vuex"
import { StateInterface } from "../index"
import type { ProjectInterface } from "./state"

const actions: ActionTree<ProjectInterface, StateInterface> = {

  setProjecLoadingState (state, input: boolean) {
    state.commit("setProjecLoadingState", input)
  },

  setProjectName (state, input: string) {
    state.commit("setProjectName", input)
  },

  setProjectCustomCSS (state, input: string) {
    state.commit("setProjectCustomCSS", input)
  }
}

export default actions
