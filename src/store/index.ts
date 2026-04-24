import { store } from "quasar/wrappers"
import { createStore, useStore as baseUseStore, Store } from "vuex"
import { InjectionKey } from "vue"
import { BlueprintStateInterface } from "./module-blueprints/state"

import blueprintsModule from "./module-blueprints"
import openedDocumentsModule from "./module-openedDocuments"
import allDocumentsModule from "./module-allDocuments"
import keybindsModule from "./module-keybinds"
import dialogsModule from "./module-dialogs"
import optionsModule from "./module-options"
import floatingWindowsModule from "./module-floatingWindows"
import projectModule from "./module-project"

export interface StateInterface {
  blueprintsModule: BlueprintStateInterface
}

export const storeKey: InjectionKey<Store<StateInterface>> = Symbol("store")

// Module-level singleton — created once, installed by boot/store.ts.
// Used directly in router guards where inject() is unavailable.
export const vuexStore = createStore<StateInterface>({
  modules: {
    blueprintsModule,
    openedDocumentsModule,
    allDocumentsModule,
    keybindsModule,
    dialogsModule,
    optionsModule,
    floatingWindowsModule,
    projectModule
  },
  strict: !!process.env.DEBUGGING
})

// For components: inject under our custom key (provided by boot/store.ts).
export function useStore (): Store<StateInterface> {
  return baseUseStore(storeKey)
}

// Kept for compatibility — @quasar/app-vite no longer auto-includes Vuex stores,
// so boot/store.ts installs vuexStore manually.
export default store(function () {
  return vuexStore
})
