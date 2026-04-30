import { RouteRecordRaw } from "vue-router"
import DocumentLayout from "src/layouts/DocumentLayout.vue"
import ProjectManagentLayout from "layouts/ProjectManagentLayout.vue"

const routes: RouteRecordRaw[] = [
  {
    path: "/login",
    component: () => import("pages/LoginPage.vue"),
    meta: { public: true }
  },
  {
    path: "/",
    component: ProjectManagentLayout,
    children: [
      { path: "", component: () => import("pages/WelcomeScreen.vue") }
    ]
  },
  {
    path: "/project/:projectId",
    component: DocumentLayout,
    children: [
      { path: "", name: "project-home", component: () => import("pages/ProjectScreen.vue") },
      { path: "display-content/:type/:id", name: "project-document", component: () => import("pages/DocumentDisplay.vue") }
    ]
  },
  {
    path: "/:catchAll(.*)*",
    component: () => import("pages/Error404.vue")
  }
]

export default routes
