import type { Router } from "vue-router"
import { saveAs } from "file-saver"
import { projectApi } from "src/services/api/projectApi"
import { exportApi } from "src/services/api/exportApi"
import { useProjectStore } from "src/stores/project"
import { useAllDocumentsStore } from "src/stores/allDocuments"
import { useOpenedDocumentsStore } from "src/stores/openedDocuments"

const LAST_OPENED_KEY = "fa_lastOpenedDocs"

// `quasar`/`Loading` are surfaced through Quasar's plugin namespace which has no
// single exported "instance" type — these helpers are passed in from <script setup>
// already typed via `useQuasar()`/`Loading`, so the intermediary is intentionally loose.
type QuasarLike = { notify: (opts: { type: string; message: string }) => void }
type LoadingLike = { show: (opts: unknown) => void; hide: () => void }

function resetProjectStores () {
  useAllDocumentsStore().resetDocuments()
  useOpenedDocumentsStore().resetDocuments()
}

/**
 * Creates a new project via the API, commits it to the project store, and navigates to /project.
 */
export const createNewProject = async (projectName: string, vueRouter: Router, quasar: QuasarLike) => {
  const projectStore = useProjectStore()

  const project = await projectApi.create(projectName)

  projectStore.setCurrentProjectId(project.id)
  projectStore.setProjectName(project.name)
  projectStore.setProjectCustomCSS(project.customCss || "")

  resetProjectStores()

  await vueRouter.push({ path: `/project/${project.id}` })

  quasar.notify({ type: "positive", message: "New project successfully created" })
}

/**
 * Downloads the project export archive (ZIP) via authenticated XHR.
 * Using `<a href>.click()` is brittle: if the session is expired the browser
 * follows the redirect and saves the login HTML as "export.html".
 */
export const saveProject = async (projectId: string, Loading: LoadingLike, loadingSetup: unknown, quasar: QuasarLike) => {
  if (!projectId) {
    quasar.notify({ type: "negative", message: "No project loaded" })
    return
  }
  Loading.show(loadingSetup)
  try {
    const projectName = useProjectStore().getProjectName || "project"
    const blob = await exportApi.exportZip(projectId)
    saveAs(blob, `${projectName} - Backup.zip`)
    quasar.notify({ type: "positive", message: "Project saved" })
  } catch (err) {
    console.error("saveProject failed", err)
    quasar.notify({ type: "negative", message: "Failed to save project" })
  } finally {
    Loading.hide()
  }
}

/**
 * Removes a project via the API.
 */
export const removeCurrentProject = async (projectId: string) => {
  if (!projectId) {
    return
  }
  await projectApi.delete(projectId)
}

/**
 * Load an existing project from an export ZIP uploaded by the user.
 * Opens a hidden file input; on selection, posts to the import endpoint.
 */
export const loadExistingProject = (vueRouter: Router, Loading: LoadingLike, loadingSetup: unknown, quasar: QuasarLike) => {
  const projectStore = useProjectStore()

  const input = document.createElement("input")
  input.type = "file"
  input.accept = ".zip"
  input.onchange = async () => {
    const file = input.files?.[0]
    if (!file) {
      return
    }

    Loading.show(loadingSetup)
    try {
      const form = new FormData()
      form.append("file", file)
      const res = await fetch("/api/projects/import", { method: "POST", body: form, credentials: "include" })
      if (!res.ok) {
        throw new Error(await res.text())
      }
      const project = await res.json() as { id: string; name: string; customCss: string | null }

      projectStore.setCurrentProjectId(project.id)
      projectStore.setProjectName(project.name)
      projectStore.setProjectCustomCSS(project.customCss || "")
      resetProjectStores()

      await vueRouter.push({ path: `/project/${project.id}` })
      quasar.notify({ type: "positive", message: "Project successfully loaded" })
    }
    catch (err) {
      quasar.notify({ type: "negative", message: "Failed to load project" })
      console.error(err)
    }
    finally {
      Loading.hide()
    }
  }
  input.click()
}

/**
 * Merge an exported project ZIP into the currently loaded project.
 */
export const mergeExistingProject = (vueRouter: Router, Loading: LoadingLike, loadingSetup: unknown, quasar: QuasarLike) => {
  const projectStore = useProjectStore()
  const projectId = projectStore.currentProjectId
  if (!projectId) {
    quasar.notify({ type: "negative", message: "No project loaded" })
    return
  }

  const input = document.createElement("input")
  input.type = "file"
  input.accept = ".zip"
  input.onchange = async () => {
    const file = input.files?.[0]
    if (!file) {
      return
    }

    Loading.show(loadingSetup)
    try {
      const form = new FormData()
      form.append("file", file)
      const res = await fetch(`/api/projects/${projectId}/merge`, { method: "POST", body: form, credentials: "include" })
      if (!res.ok) {
        throw new Error(await res.text())
      }

      resetProjectStores()

      await vueRouter.push({ path: `/project/${projectId}` })
      quasar.notify({ type: "positive", message: "Data successfully merged into the project" })
    }
    catch (err) {
      quasar.notify({ type: "negative", message: "Failed to merge project" })
      console.error(err)
    }
    finally {
      Loading.hide()
    }
  }
  input.click()
}

/**
 * Returns the current project name from the project store.
 */
export const retrieveCurrentProjectName = (): Promise<string> => {
  return Promise.resolve(useProjectStore().getProjectName || "")
}

/**
 * Returns the current project version — always "web" in the web app.
 */
export const retrieveCurrentProjectVersion = (): Promise<number> => {
  return Promise.resolve(0.999)
}

/**
 * Returns the current project custom CSS from the project store.
 */
export const retrieveCurrentProjectCustomCSS = (): Promise<string> => {
  return Promise.resolve(useProjectStore().getProjectCustomCSS || "")
}

/**
 * Updates project settings via the API and syncs name/CSS to the project store.
 */
export const changeCurrentProjectSettings = async (
  input: { projectName?: string; createdOnVersion?: string; projectCustomCSS?: string }
) => {
  const projectStore = useProjectStore()
  const projectId = projectStore.currentProjectId
  if (!projectId) {
    return
  }

  const updated = await projectApi.update(projectId, {
    name: input.projectName,
    customCss: input.projectCustomCSS
  })

  if (input.projectName) {
    projectStore.setProjectName(updated.name)
  }
  if (input.projectCustomCSS !== undefined) {
    projectStore.setProjectCustomCSS(updated.customCss || "")
  }
}

/**
 * Persists the corkboard text to the server.
 */
export const saveCorkboard = async (input: string, projectId?: string | null) => {
  if (!projectId) {
    return
  }
  await projectApi.update(projectId, { corkboardText: input.trim() })
}

/**
 * Retrieves the corkboard text from the server.
 */
export const retrieveCorkboard = async (projectId?: string | null): Promise<string> => {
  if (!projectId) {
    return ""
  }
  const project = await projectApi.get(projectId)
  return project.corkboardText || ""
}

/**
 * Adds a document ID to the per-project recently-opened list stored in localStorage.
 */
export const updateLastOpenedDocuments = (newDocID: string, projectId?: string | null) => {
  if (!projectId) {
    return
  }
  const key = `${LAST_OPENED_KEY}_${projectId}`
  const existing: string[] = JSON.parse(localStorage.getItem(key) || "[]")
  const updated = [...new Set([newDocID, ...existing])].slice(0, 50)
  localStorage.setItem(key, JSON.stringify(updated))
}

/**
 * Retrieves the recently-opened document ID list from localStorage.
 */
export const retrieveLastOpenedDocuments = (projectId?: string | null): Promise<string[]> => {
  if (!projectId) {
    return Promise.resolve([])
  }
  const key = `${LAST_OPENED_KEY}_${projectId}`
  return Promise.resolve(JSON.parse(localStorage.getItem(key) || "[]"))
}
