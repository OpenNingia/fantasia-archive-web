import { boot } from "quasar/wrappers"
import { vuexStore, storeKey } from "src/store"

// @quasar/app-vite dropped Vuex support (only Pinia is auto-detected via src/stores/).
// We install the store manually here and also provide it under our custom storeKey
// so that useStore() in components works via inject().
export default boot(({ app }) => {
  app.use(vuexStore)
  app.provide(storeKey, vuexStore)
})
