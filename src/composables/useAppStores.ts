import { useBlueprintsStore } from "src/stores/blueprints"
import { useOpenedDocumentsStore } from "src/stores/openedDocuments"
import { useAllDocumentsStore } from "src/stores/allDocuments"
import { useDialogsStore } from "src/stores/dialogs"
import { useOptionsStore } from "src/stores/options"
import { useFloatingWindowsStore } from "src/stores/floatingWindows"
import { useProjectStore } from "src/stores/project"

export function useAppStores () {
  return {
    blueprintsStore: useBlueprintsStore(),
    openedDocumentsStore: useOpenedDocumentsStore(),
    allDocumentsStore: useAllDocumentsStore(),
    dialogsStore: useDialogsStore(),
    optionsStore: useOptionsStore(),
    floatingWindowsStore: useFloatingWindowsStore(),
    projectStore: useProjectStore()
  }
}
