import { boot } from "quasar/wrappers"
import { authApi } from "src/services/api/authApi"
import { vuexStore } from "src/store"

// useStore() calls inject() which only works inside component setup().
// Router guards run outside of component context, so we use the module-level singleton.
export default boot(async ({ router }) => {
  router.beforeEach(async (to) => {
    if (to.meta.public) return true

    if (!vuexStore.getters["projectModule/currentUser"]) {
      try {
        const user = await authApi.me()
        vuexStore.commit("projectModule/SET_CURRENT_USER", user)
      } catch {
        if (to.path !== "/login") {
          return { path: "/login", query: { redirect: to.fullPath } }
        }
      }
    }

    return true
  })
})
