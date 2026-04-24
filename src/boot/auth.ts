import { boot } from "quasar/wrappers"
import { authApi } from "src/services/api/authApi"
import { useProjectStore } from "src/stores/project"

export default boot(async ({ router }) => {
  router.beforeEach(async (to) => {
    if (to.meta.public) return true

    const projectStore = useProjectStore()
    if (!projectStore.currentUser) {
      try {
        const user = await authApi.me()
        projectStore.setCurrentUser(user)
      } catch {
        if (to.path !== "/login") {
          return { path: "/login", query: { redirect: to.fullPath } }
        }
      }
    }

    return true
  })
})
