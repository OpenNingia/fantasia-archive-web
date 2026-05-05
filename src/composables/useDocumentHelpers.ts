import { useRouter, useRoute } from "vue-router"
import { uid, colors, extend, getCssVar } from "quasar"
import { useAppStores } from "./useAppStores"
import { documentPath, projectHomePath } from "src/scripts/utilities/projectRoutes"
import type { I_OpenedDocument, I_ShortenedDocument } from "src/interfaces/I_OpenedDocument"
import type { I_NewObjectTrigger } from "src/interfaces/I_NewObjectTrigger"
import type { I_FieldRelationship } from "src/interfaces/I_FieldRelationship"
import type { OptionsState } from "src/stores/options"

export function useDocumentHelpers () {
  const router = useRouter()
  const route = useRoute()
  const {
    blueprintsStore,
    openedDocumentsStore,
    allDocumentsStore,
    dialogsStore,
    optionsStore,
    floatingWindowsStore,
    projectStore
  } = useAppStores()

  /****************************************************************/
  // UTILITY
  /****************************************************************/

  function generateUID (): string {
    return uid()
  }

  function sleep (ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  function stripTags (input: string) {
    return input ? input.replace(/<[^>]+>/g, "") : input
  }

  function retrieveIconColor (document: I_ShortenedDocument): string {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (document as any).activeTypeSearch ? getCssVar("primary") as string : document.color as string
  }

  function deepFreeze (object: object): object {
    const propNames = Object.getOwnPropertyNames(object)
    for (const name of propNames) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const value = (object as any)[name]
      if (value && typeof value === "object") {
        deepFreeze(value)
      }
    }
    return Object.freeze(object)
  }

  /****************************************************************/
  // FIELD HELPERS
  /****************************************************************/

  function retrieveFieldValue (
    document: I_OpenedDocument | I_ShortenedDocument,
    fieldID: string
  ): string | number | [] | false | I_FieldRelationship {
    const fieldData = document?.extraFields
    if (!fieldData) return false
    const fieldValue = fieldData.find((f) => f.id === fieldID)?.value as unknown as string
    return fieldValue
  }

  function retrieveFieldLength (document: I_OpenedDocument, fieldID: string): number | false {
    const fieldData = document?.extraFields
    if (!fieldData) return false
    const fieldValue = fieldData.find((f) => f.id === fieldID)?.value
    if (!Array.isArray(fieldValue)) return false
    return fieldValue.length
  }

  function retrieveFieldType (
    document: I_OpenedDocument | I_ShortenedDocument,
    fieldID: string
  ): string | false {
    const fieldData = document?.extraFields
    if (!fieldData) return false
    const bp = blueprintsStore.getBlueprint(document.type)
    return (bp?.extraFields.find((f) => f.id === fieldID)?.type as string) ?? false
  }

  function determineLegacyField (
    document: I_OpenedDocument | I_ShortenedDocument,
    fieldID: string
  ): boolean | false {
    const fieldData = document?.extraFields
    if (!fieldData) return false
    const bp = blueprintsStore.getBlueprint(document.type)
    return (bp?.extraFields.find((f) => f.id === fieldID)?.isLegacy as boolean) ?? false
  }

  /****************************************************************/
  // DOCUMENT HIERARCHY / MAPPING
  /****************************************************************/

  function getDocumentHieararchicalPath (document: I_OpenedDocument, list: I_OpenedDocument[]): string {
    let hierarchicalString = ""
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const parentDoc = (retrieveFieldValue(document, "parentDoc") as any)?.value
    const parentDocInDB = list.find((p) => p._id === parentDoc?._id)

    if (!parentDoc || (parentDoc && !parentDocInDB)) {
      const pluralBlueprintName = blueprintsStore.getAllBlueprints.find((e) => e._id === document.type)?.namePlural
      return pluralBlueprintName ?? ""
    }

    const matchingDoc = list.find((doc) => doc._id === parentDoc._id) as I_OpenedDocument
    hierarchicalString += retrieveFieldValue(matchingDoc, "name")
    const connectedReturn = getDocumentHieararchicalPath(matchingDoc, list)
    if (connectedReturn) {
      hierarchicalString = `${connectedReturn} > ${hierarchicalString}`
    }
    return hierarchicalString
  }

  function mapShortDocument (doc: I_ShortenedDocument, dbDocuments: I_OpenedDocument[]): I_ShortenedDocument {
    return {
      label: doc.extraFields.find((e) => e.id === "name")?.value,
      icon: doc.icon,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      id: doc._id as any,
      _id: doc._id,
      url: doc.url,
      type: doc.type,
      extraFields: doc.extraFields,
      hasEdits: false,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      hierarchicalPath: getDocumentHieararchicalPath(doc as any, dbDocuments),
      tags: doc.extraFields.find((e) => e.id === "tags")?.value,
      color: doc.extraFields.find((e) => e.id === "documentColor")?.value,
      bgColor: doc.extraFields.find((e) => e.id === "documentBackgroundColor")?.value,
      isCategory: doc.extraFields.find((e) => e.id === "categorySwitch")?.value,
      isMinor: doc.extraFields.find((e) => e.id === "minorSwitch")?.value,
      isDead: doc.extraFields.find((e) => e.id === "deadSwitch")?.value
    }
  }

  function checkForLegacyDocuments () {
    return allDocumentsStore.getAllDocuments.docs.filter((doc) => {
      const localBlueprint = blueprintsStore.getBlueprint(doc.type)
      if (!localBlueprint) return false
      let hasLegacyValue = false
      for (const field of doc.extraFields) {
        const bpField = localBlueprint.extraFields.find((e) => e.id === field.id)
        if (bpField && bpField.isLegacy && !hasLegacyValue) {
          const value = field.value
          if (!value ||
            (Array.isArray(value) && value.length === 0) ||
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ((value as any)?.value?.length === 0) ||
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ((value as any).value === null)) {
            // empty — skip
          }
          else {
            hasLegacyValue = true
          }
        }
      }
      return hasLegacyValue
    })
  }

  /****************************************************************/
  // NAVIGATION
  /****************************************************************/

  function findRequestedOrActiveDocument (doc?: I_OpenedDocument) {
    const docs = openedDocumentsStore.getAllDocuments.docs
    if (doc) {
      return docs.find((e) => e.url === doc.url) ?? false
    }
    return docs.find((e) => e.url === route.path) ?? false
  }

  function addNewObjectRoute (newObject: I_NewObjectTrigger) {
    const parentID = newObject?.parent ?? ""
    const tag = newObject?.tag ?? ""
    router.push({
      path: documentPath(projectStore.currentProjectId, newObject._id, uid()),
      query: { parent: parentID, tag }
    }).catch((e: { name: string }) => {
      if (e.name !== "NavigationDuplicated") console.log(e)
    })
  }

  function openExistingDocumentRoute (existingObject: I_OpenedDocument | I_FieldRelationship | I_ShortenedDocument) {
    router.push({ path: existingObject.url }).catch((e: { name: string }) => {
      if (e.name !== "NavigationDuplicated") console.log(e)
    })
  }

  function openExistingDocumentRouteWithEdit (existingObject: I_OpenedDocument | I_FieldRelationship) {
    const currentDoc = findRequestedOrActiveDocument()
    if (currentDoc && existingObject._id === currentDoc._id && !currentDoc.editMode) {
      const dataCopy: I_OpenedDocument = extend(true, {}, currentDoc)
      dataCopy.editMode = true
      openedDocumentsStore.updateDocument({ doc: dataCopy, treeAction: false })
      return
    }
    router.push({ path: existingObject.url, query: { editMode: "editMode" } }).catch((e: { name: string }) => {
      if (e.name !== "NavigationDuplicated") console.log(e)
    })
  }

  function refreshRoute () {
    if (optionsStore.disableCloseAftertSelectQuickSearch && dialogsStore.getDialogsState) {
      return
    }

    const remainingDocuments = openedDocumentsStore.getAllDocuments.docs
    const lastIndex = openedDocumentsStore.getAllDocuments.lastRemovedIndex
    const newIndex = (lastIndex > -1 && lastIndex < remainingDocuments.length) ? lastIndex : remainingDocuments.length - 1

    if (lastIndex > -1) {
      openedDocumentsStore.resetRemoveIndex()
    }

    if (remainingDocuments.length > 0) {
      const currentRoute = router.currentRoute.value.path
      const existingDocument = remainingDocuments.find((e) => e.url === currentRoute)
      if (existingDocument) return

      const lastDocument = remainingDocuments[newIndex]
      const newRoute = documentPath(projectStore.currentProjectId, lastDocument.type, lastDocument._id)
      if (currentRoute !== newRoute) {
        router.push({ path: newRoute }).catch((e) => console.log(e))
      }
    }
    else {
      router.push({ path: projectHomePath(projectStore.currentProjectId) }).catch((e: { name: string }) => {
        if (e && e.name !== "NavigationDuplicated") console.log(e)
      })
    }
  }

  /****************************************************************/
  // FLOATING WINDOWS / MISC
  /****************************************************************/

  function openDocumentPreviewPanel (id: string) {
    floatingWindowsStore.setDocumentPreviewWindowID(id)
    floatingWindowsStore.setDocumentPreviewWindowVisible(true)
  }

  function toggleHierarchicalTree () {
    const snap = extend<OptionsState>(true, {}, optionsStore.getOptions)
    snap.hideHierarchyTree = !snap.hideHierarchyTree
    void optionsStore.setOptions(snap)
  }

  function openLink (link: string) {
    try {
      const url = new URL(link)
      if (url.protocol === "http:" || url.protocol === "https:") {
        window.open(url.href, "_blank")
      }
      else if (url.protocol === "document:") {
        const doc = allDocumentsStore.getDocument(url.pathname)
        if (doc) openExistingDocumentRoute(doc as unknown as I_OpenedDocument)
      }
    }
    catch (_) { /* invalid URL, ignore */ }
  }

  return {
    generateUID,
    sleep,
    stripTags,
    retrieveIconColor,
    deepFreeze,
    retrieveFieldValue,
    retrieveFieldLength,
    retrieveFieldType,
    determineLegacyField,
    getDocumentHieararchicalPath,
    mapShortDocument,
    checkForLegacyDocuments,
    findRequestedOrActiveDocument,
    addNewObjectRoute,
    openExistingDocumentRoute,
    openExistingDocumentRouteWithEdit,
    refreshRoute,
    openDocumentPreviewPanel,
    toggleHierarchicalTree,
    openLink
  }
}
