import { boot } from "quasar/wrappers"
import { authApi } from "src/services/api/authApi"
import { useStore } from "src/store"

export default boot(async ({ router }) => {
  router.beforeEach(async (to) => {
    if (to.meta.public) return true

    const store = useStore()

    if (!store.getters["projectModule/currentUser"]) {
      try {
        const user = await authApi.me()
        store.commit("projectModule/SET_CURRENT_USER", user)
      } catch {
        if (to.path !== "/login") {
          return { path: "/login", query: { redirect: to.fullPath } }
        }
      }
    }

    return true
  })
})
