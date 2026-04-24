import { ActionTree } from "vuex"
import { StateInterface } from "../index"
import type { OptionsStateInteface } from "./state"

const SETTINGS_KEY = "fa_settings"

const actions: ActionTree<OptionsStateInteface, StateInterface> = {

  async setOptions (state, input: OptionsStateInteface) {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(input))
    state.commit("setOptions", input)
  }
}

export default actions
