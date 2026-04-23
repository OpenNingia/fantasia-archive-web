import { boot } from "quasar/wrappers"
import api from "src/services/api/client"

export default boot(({ app }) => {
  app.config.globalProperties.$axios = api
})
