<template>

  <div>

     <!-- New document dialog -->
    <newDocumentDialog
      :dialog-trigger="newObjectDialogTrigger"
      @trigger-dialog-close="newObjectDialogClose"
    />

    <!-- Existing document dialog -->
    <existingDocumentDialog
      :dialog-trigger="existingObjectDialogTrigger"
      @trigger-dialog-close="existingObjectDialogClose"
    />

    <!-- Delele document dialog -->
    <deleteDocumentCheckDialog
      :dialog-trigger="deleteObjectDialogTrigger"
      @trigger-dialog-close="deleteObjectDialogClose"
    />

    <!-- Advanced search guide dialog -->
    <advancedSearchGuideDialog
      :dialog-trigger="advancedSearchGuideDialogTrigger"
      @trigger-dialog-close="advancedSearchGuideDialogClose"
    />

    <!-- Keybind dialog -->
    <keybindCheatsheetDialog
      :dialog-trigger="keybindsDialogTrigger"
      @trigger-dialog-close="keybindsDialogClose"
    />

    <!-- Tips, Tricks & Trivia dialog -->
    <tipsTricksTriviaDialog
      :dialog-trigger="tipsTricksDialogTrigger"
      @trigger-dialog-close="tipsTricksDialogClose"
    />

    <q-page-sticky position="top-right"
      class="documentControl bg-dark"
      :class="{'fullScreen': hideHierarchyTree}"
      v-if="!disableDocumentControlBar"
      >

      <div
      class="documentControl__blocker"
      ></div>

      <div
      class="documentControl__wrapper"
      :class="{'fullScreen': hideHierarchyTree}"
      >

        <div class="documentControl__left">

          <template v-if="!disableDocumentControlBarGuides">
            <q-btn
              icon="mdi-keyboard-settings"
              color="primary"
              outline
              @click="keybindsDialogAssignUID"
            >
              <q-tooltip
                :delay="500"
                anchor="bottom middle"
                self="top middle"
              >
              Open keybinds cheatsheet
              </q-tooltip>
            </q-btn>

            <q-btn
              icon="mdi-file-question"
              color="primary"
              outline
              @click="advancedSearchGuideAssignUID"
            >
              <q-tooltip
                :delay="500"
                anchor="bottom middle"
                self="top middle"
              >
              Open advanced search guide
              </q-tooltip>
            </q-btn>

            <q-btn
              icon="mdi-fire-alert"
              color="primary"
              outline
              @click="tipsTricksAssignUID"
            >
              <q-tooltip
                :delay="500"
                anchor="bottom middle"
                self="top middle"
              >
              Open Tips, Tricks & Trivia
              </q-tooltip>
            </q-btn>

            <q-separator vertical inset color="accent" />
          </template>

          <q-btn
            icon="mdi-package-variant-closed"
            color="primary"
            outline
            :disable="!projectExists"
            @click="commenceSave"
          >
            <q-tooltip
              :delay="500"
              anchor="bottom middle"
              self="top middle"
            >
             Save current project
            </q-tooltip>
          </q-btn>

          <q-separator vertical inset color="accent" />

          <q-btn
            icon="mdi-page-layout-sidebar-left"
            color="primary"
            outline
            @click="toggleHierarchicalTree"
          >
            <q-tooltip
              :delay="500"
              anchor="bottom middle"
              self="top middle"
            >
             Toggle hierarchical tree
            </q-tooltip>
          </q-btn>

          <q-btn
            icon="mdi-clipboard-text-outline"
            color="primary"
            outline
            @click="floatingWindowsStore.setNoteCorkboardWindowVisible()"
          >
            <q-tooltip
              :delay="500"
              anchor="bottom middle"
              self="top middle"
            >
             Show note board
            </q-tooltip>
          </q-btn>

          <q-separator vertical inset color="accent" />

          <q-btn
            icon="mdi-database-search"
            color="primary"
            outline
            @click="existingObjectAssignUID"
          >
            <q-tooltip
              :delay="500"
              anchor="bottom middle"
              self="top middle"
            >
              Quick-search an existing document
            </q-tooltip>
          </q-btn>

          <q-btn
            icon="mdi-text-box-plus-outline"
            color="primary"
            outline
            @click="newObjectAssignUID"
          >
            <q-tooltip
              :delay="500"
              anchor="bottom middle"
              self="top middle"
            >
              Quick-add a new document
            </q-tooltip>
          </q-btn>

          <template
            v-if="openedDocumentsStore.getAllDocuments.docs.length > 0  && route.path !== '/project'"
          >
            <q-separator vertical inset color="accent" />

            <q-btn
              icon="mdi-content-save-settings-outline"
              color="primary"
              outline
              @click="massSave"
            >
              <q-tooltip
                :delay="500"
                anchor="bottom left"
                self="top middle"
              >
              Save all opened documents with active changes
              </q-tooltip>
            </q-btn>

          </template>

        </div>

        <div class="documentControl__right">

           <q-btn
            icon="mdi-file-document-edit"
            color="primary"
            outline
            @click="toggleEditMode"
            v-if="currentyEditable && openedDocumentsStore.getAllDocuments.docs.length > 0  && route.path !== '/project'"
          >
            <q-tooltip
              :delay="500"
              anchor="bottom middle"
              self="top middle"
            >
             Edit current document
            </q-tooltip>
          </q-btn>

          <q-btn
            icon="mdi-content-save-edit"
            :color="(!hasEdits) ? 'teal-14' : 'primary'"
            outline
            @click="saveCurrentDocument(true)"
            v-if="!currentyEditable && openedDocumentsStore.getAllDocuments.docs.length > 0  && route.path !== '/project'"
          >
            <q-tooltip
              :delay="500"
              anchor="bottom left"
              self="top middle"
            >
             Save document without exiting edit mode
            </q-tooltip>

          </q-btn>

          <q-btn
            icon="mdi-content-save"
            :color="(!hasEdits) ? 'teal-14' : 'primary'"
            outline
            @click="saveCurrentDocument(false)"
            v-if="!currentyEditable && openedDocumentsStore.getAllDocuments.docs.length > 0  && route.path !== '/project'"
          >
            <q-tooltip
              :delay="500"
              anchor="bottom left"
              self="top middle"
            >
             Save current document
            </q-tooltip>

          </q-btn>

          <q-btn
            icon="mdi-file-search-outline"
            color="primary"
            outline
            @click="openThisDocumentInSidebar"
            v-if="!currentlyNew && openedDocumentsStore.getAllDocuments.docs.length > 0  && route.path !== '/project'"
          >
            <q-tooltip
              :delay="500"
              max-width="500px"
              anchor="bottom left"
              self="top middle"
            >
              Preview document in split-view mode
            </q-tooltip>
          </q-btn>

          <q-btn
            icon="mdi-file-tree"
            color="primary"
            outline
            @click="addNewUnderParent"
            v-if="!currentlyNew && openedDocumentsStore.getAllDocuments.docs.length > 0  && route.path !== '/project'"
          >
            <q-tooltip
              :delay="500"
              max-width="500px"
              anchor="bottom left"
              self="top middle"
            >
              Add a new document with the currently opened one as the parent
            </q-tooltip>
          </q-btn>

          <q-btn
            icon="mdi-content-copy"
            color="primary"
            outline
            @click="copyTargetDocument"
            v-if="!currentlyNew && openedDocumentsStore.getAllDocuments.docs.length > 0 && route.path !== '/project'"
          >
            <q-tooltip
              :delay="500"
              max-width="500px"
              anchor="bottom left"
              self="top middle"
            >
             Copy current document
            </q-tooltip>
          </q-btn>

           <q-separator vertical inset color="accent"
            v-if="!currentlyNew && openedDocumentsStore.getAllDocuments.docs.length > 0  && route.path !== '/project'"
          />

          <q-btn
            :color="(!hasEdits) ? 'secondary' : 'primary'"
            icon="mdi-database-export-outline"
            @click="triggerExport"
            outline
            v-if="!currentlyNew && openedDocumentsStore.getAllDocuments.docs.length > 0  && route.path !== '/project'"
            >
              <q-tooltip
                :delay="500"
                anchor="bottom middle"
                self="top middle"
              >
                Export current project
                <span class="text-secondary" v-if="!hasEdits">
                  <br>
                  <br>
                  Document has active edits.
                  <br>
                  These will not be exported.
                  <br>
                  Please save first.
                </span>
              </q-tooltip>
            </q-btn>

          <q-separator vertical inset color="accent"
            v-if="!currentlyNew && openedDocumentsStore.getAllDocuments.docs.length > 0  && route.path !== '/project'"
          />

          <q-btn
            icon="mdi-text-box-remove-outline"
            color="secondary"
            outline
            @click="deleteObjectAssignUID"
            v-if="!currentlyNew && openedDocumentsStore.getAllDocuments.docs.length > 0  && route.path !== '/project'"
          >
            <q-tooltip
              :delay="500"
              anchor="bottom left"
              self="top middle"
            >
              Delete current document
            </q-tooltip>
          </q-btn>

        </div>

      </div>

    </q-page-sticky>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from "vue"
import { useRoute, useRouter } from "vue-router"
import { useQuasar } from "quasar"

import newDocumentDialog from "src/components/dialogs/NewDocument.vue"
import existingDocumentDialog from "src/components/dialogs/ExistingDocument.vue"
import deleteDocumentCheckDialog from "src/components/dialogs/DeleteDocumentCheck.vue"
import advancedSearchGuideDialog from "src/components/dialogs/AdvancedSearchGuide.vue"
import keybindCheatsheetDialog from "src/components/dialogs/KeybindCheatsheet.vue"
import tipsTricksTriviaDialog from "src/components/dialogs/TipsTricksTrivia.vue"

import type { I_OpenedDocument } from "src/interfaces/I_OpenedDocument"
import { extend, Loading, QSpinnerGears } from "quasar"
import { saveDocument } from "src/scripts/databaseManager/documentManager"
import { createNewWithParent } from "src/scripts/documentActions/createNewWithParent"
import { copyDocument } from "src/scripts/documentActions/copyDocument"
import { saveProject } from "src/scripts/projectManagement/projectManagent"

import { useAppStores } from "src/composables/useAppStores"
import { useDocumentHelpers } from "src/composables/useDocumentHelpers"

const route = useRoute()
const router = useRouter()
const q = useQuasar()

const {
  blueprintsStore,
  openedDocumentsStore,
  allDocumentsStore,
  keybindsStore,
  dialogsStore,
  optionsStore,
  floatingWindowsStore,
  projectStore
} = useAppStores()

const {
  generateUID,
  sleep,
  findRequestedOrActiveDocument,
  openDocumentPreviewPanel,
  toggleHierarchicalTree,
  mapShortDocument,
  determineKeyBind
} = useDocumentHelpers()

/****************************************************************/
// Basic state
/****************************************************************/

const projectExists = ref<undefined | string | boolean>(false)
const projectName = ref("")

const disableDocumentControlBar = ref(false)
const disableDocumentControlBarGuides = ref(false)
const hideHierarchyTree = ref(false)

watch(() => optionsStore.getOptions, () => {
  const options = optionsStore.getOptions
  disableDocumentControlBar.value = options.disableDocumentControlBar
  disableDocumentControlBarGuides.value = options.disableDocumentControlBarGuides
  hideHierarchyTree.value = options.hideHierarchyTree
}, { immediate: true, deep: true })

// created
checkProjectStatus()

watch(() => projectStore.getProjectName, () => {
  checkProjectStatus()
})

function checkProjectStatus () {
  projectName.value = projectStore.getProjectName
  projectExists.value = (projectStore.getProjectName.length > 0)
}

/****************************************************************/
// Keybinds management
/****************************************************************/

watch(() => keybindsStore.getCurrentKeyBindData, async () => {
  // Quick new document
  if (determineKeyBind("quickNewDocument") && !dialogsStore.getDialogsState) {
    newObjectAssignUID()
  }

  // Quick open existing document
  if (determineKeyBind("quickExistingDocument") && !dialogsStore.getDialogsState) {
    existingObjectAssignUID()
  }

  // Quick open existing document
  if (determineKeyBind("openDocInSide") && !currentlyNew.value && openedDocumentsStore.getAllDocuments.docs.length > 0 && !dialogsStore.getDialogsState && route.path !== "/project") {
    openThisDocumentInSidebar()
  }

  // Delete dialog - CTRL + D
  if (determineKeyBind("deleteDocument") && !currentlyNew.value && openedDocumentsStore.getAllDocuments.docs.length > 0 && !dialogsStore.getDialogsState && route.path !== "/project") {
    deleteObjectAssignUID()
  }

  // Export document - NONE
  if (determineKeyBind("exportDocument") && currentyEditable.value && openedDocumentsStore.getAllDocuments.docs.length > 0 && !dialogsStore.getDialogsState && route.path !== "/project") {
    triggerExport()
  }

  // Edit document - CTRL + E
  if (determineKeyBind("editDocument") && !currentlyNew.value && openedDocumentsStore.getAllDocuments.docs.length > 0 && !dialogsStore.getDialogsState && route.path !== "/project") {
    toggleEditMode()
  }

  // Save document - CTRL + S
  if (determineKeyBind("saveDocument") && !currentyEditable.value && openedDocumentsStore.getAllDocuments.docs.length > 0 && !dialogsStore.getDialogsState && route.path !== "/project") {
    setTimeout(() => {
      saveCurrentDocument(false).catch(e => console.log(e))
    }, 500)
  }

  // Save document without exiting edit mode - CTRL + ALT + S
  if (determineKeyBind("saveDocumentNoExit") && !currentyEditable.value && openedDocumentsStore.getAllDocuments.docs.length > 0 && !dialogsStore.getDialogsState && route.path !== "/project") {
    setTimeout(() => {
      saveCurrentDocument(true).catch(e => console.log(e))
    }, 500)
  }

  // Mass document save - CTRL + SHIFT + S
  if (determineKeyBind("saveDocumentMass") && openedDocumentsStore.getAllDocuments.docs.length > 0 && !dialogsStore.getDialogsState && route.path !== "/project") {
    setTimeout(() => {
      massSave().catch(e => console.log(e))
    }, 500)
  }

  // Save document and mark it as finished - NONE
  if (determineKeyBind("saveDocumentTickFinish") && !currentyEditable.value && openedDocumentsStore.getAllDocuments.docs.length > 0 && !dialogsStore.getDialogsState && route.path !== "/project") {
    setTimeout(() => {
      saveCurrentDocument(false, true).catch(e => console.log(e))
    }, 500)
  }

  // Add new under parent - CTRL + SHIFT + N
  if (determineKeyBind("addUnderParent") && !currentlyNew.value && openedDocumentsStore.getAllDocuments.docs.length > 0 && !dialogsStore.getDialogsState && route.path !== "/project") {
    await sleep(100)
    addNewUnderParent()
  }

  // Copy document - CTRL + ALT + C
  if (determineKeyBind("copyDocument") && !currentlyNew.value && openedDocumentsStore.getAllDocuments.docs.length > 0 && !dialogsStore.getDialogsState && route.path !== "/project") {
    await sleep(100)
    copyTargetDocument()
  }

  // Toggle hierarchical tree - CTRL + ALT + SHIFT + T
  if (determineKeyBind("toggleHierarchicalTree")) {
    toggleHierarchicalTree()
  }
}, { deep: true })

/****************************************************************/
// Advanced search guide dialog
/****************************************************************/

const advancedSearchGuideDialogTrigger = ref<string | false>(false)
function advancedSearchGuideDialogClose () {
  advancedSearchGuideDialogTrigger.value = false
}

function advancedSearchGuideAssignUID () {
  advancedSearchGuideDialogTrigger.value = generateUID()
}

/****************************************************************/
// Keybinds cheatsheet dialog
/****************************************************************/

const keybindsDialogTrigger = ref<string | false>(false)
function keybindsDialogClose () {
  keybindsDialogTrigger.value = false
}

function keybindsDialogAssignUID () {
  keybindsDialogTrigger.value = generateUID()
}

/****************************************************************/
// Delete dialog
/****************************************************************/

const deleteObjectDialogTrigger = ref<string | false>(false)
function deleteObjectDialogClose () {
  deleteObjectDialogTrigger.value = false
}

function deleteObjectAssignUID () {
  deleteObjectDialogTrigger.value = generateUID()
}

/****************************************************************/
// New document dialog
/****************************************************************/

const newObjectDialogTrigger = ref<string | false>(false)
function newObjectDialogClose () {
  newObjectDialogTrigger.value = false
}

function newObjectAssignUID () {
  newObjectDialogTrigger.value = generateUID()
}

/****************************************************************/
// Existing document dialog
/****************************************************************/

const existingObjectDialogTrigger = ref<string | false>(false)
function existingObjectDialogClose () {
  existingObjectDialogTrigger.value = false
}

function existingObjectAssignUID () {
  existingObjectDialogTrigger.value = generateUID()
}

/****************************************************************/
// Tips, Tricks & Trivia dialog
/****************************************************************/

const tipsTricksDialogTrigger = ref<string | false>(false)
function tipsTricksDialogClose () {
  tipsTricksDialogTrigger.value = false
}

function tipsTricksAssignUID () {
  tipsTricksDialogTrigger.value = generateUID()
}

/****************************************************************/
// Save project
/****************************************************************/
function commenceSave () {
  const setup = {
    message: "<h4>Saving current project...</h4>",
    spinnerColor: "primary",
    messageColor: "cultured",
    spinnerSize: 120,
    backgroundColor: "dark",
    // @ts-ignore
    spinner: QSpinnerGears
  }
  saveProject(projectStore.currentProjectId as string, Loading, setup, q)
}

/****************************************************************/
// Add new document under parent
/****************************************************************/
function addNewUnderParent () {
  const currentDoc = findRequestedOrActiveDocument() as I_OpenedDocument
  createNewWithParent(currentDoc, {
    addNewObjectRoute: (obj: any) => router.push({ path: `/project/display-content/${obj._id}/${generateUID()}`, query: { parent: obj.parent ?? "", tag: obj.tag ?? "" } }).catch(console.log)
  })
}

/****************************************************************/
// Open current document in sidebar
/****************************************************************/
function openThisDocumentInSidebar () {
  const currentDoc = findRequestedOrActiveDocument() as I_OpenedDocument
  openDocumentPreviewPanel(currentDoc._id)
}

/****************************************************************/
// Document copy
/****************************************************************/
const documentPass = ref(null as unknown as I_OpenedDocument)

function copyTargetDocument () {
  documentPass.value = extend(true, {}, findRequestedOrActiveDocument())

  const blueprint = blueprintsStore.getBlueprint(documentPass.value.type)
  const newDocument = copyDocument(documentPass.value, generateUID(), blueprint)

  const dataPass = {
    doc: newDocument,
    treeAction: false
  }

  // @ts-ignore
  openedDocumentsStore.addDocument(dataPass)
  router.push({
    path: newDocument.url
  }).catch((e: {name: string}) => {
    const errorName: string = e.name
    if (errorName === "NavigationDuplicated") {
      return
    }
    console.log(e)
  })
}

/****************************************************************/
// Toggle edit mode & Save document
/****************************************************************/
function toggleEditMode () {
  const currentDoc = findRequestedOrActiveDocument()
  if (currentDoc && !currentDoc.editMode) {
    const dataCopy: I_OpenedDocument = extend(true, {}, currentDoc)
    dataCopy.editMode = true
    const dataPass = { doc: dataCopy, treeAction: false }
    openedDocumentsStore.updateDocument(dataPass)
  }
}

const documentsCopy = ref(null as unknown as I_OpenedDocument[])

async function saveCurrentDocument (editMode: boolean, saveAsFinished = false) {
  if (document.activeElement && editMode === false) {
    (document.activeElement as HTMLElement).blur()
  }

  const currentDoc = findRequestedOrActiveDocument() as I_OpenedDocument

  // @ts-ignore
  const isNew = currentDoc.isNew

  const allDocuments = openedDocumentsStore.getAllDocuments

  documentsCopy.value = extend(true, [], allDocuments.docs)
  if (currentDoc) {
    const docCopy: I_OpenedDocument = extend(true, [], currentDoc)

    if (saveAsFinished) {
      const isFinishedInded = docCopy.extraFields.findIndex(e => e.id === "finishedSwitch")
      docCopy.extraFields[isFinishedInded].value = true
    }

    // @ts-ignore
    const savedDocument: {
      documentCopy: I_OpenedDocument,
      allOpenedDocuments: I_OpenedDocument[]
    } = await saveDocument(docCopy, documentsCopy.value, allDocumentsStore.getAllDocuments.docs, editMode, { SGET_allDocuments: allDocumentsStore.getAllDocuments, SGET_allDocumentsByType: (id: string) => allDocumentsStore.getDocumentsByType(id), SSET_updateDocument: (p: any) => allDocumentsStore.updateDocument(p), SSET_addDocument: (p: any) => allDocumentsStore.addDocument(p) }).catch(err => console.log(err))

    // Update the opened document
    const dataPass = { doc: savedDocument.documentCopy, treeAction: true }
    openedDocumentsStore.updateDocument(dataPass)

    // Update document
    if (!isNew) {
      // @ts-ignore
      allDocumentsStore.updateDocument({ doc: mapShortDocument(savedDocument.documentCopy, allDocumentsStore.getDocumentsByType(savedDocument.documentCopy.type).docs) })
    }
    // Add new document
    else {
      // @ts-ignore
      allDocumentsStore.addDocument({ doc: mapShortDocument(savedDocument.documentCopy, allDocumentsStore.getDocumentsByType(savedDocument.documentCopy.type).docs) })
    }

    // Update all others
    for (const doc of savedDocument.allOpenedDocuments) {
      const dataPass = { doc: doc, treeAction: true }
      openedDocumentsStore.updateDocument(dataPass)

      // @ts-ignore
      allDocumentsStore.updateDocument({ doc: mapShortDocument(doc, allDocumentsStore.getDocumentsByType(doc.type).docs) })
    }

    q.notify({
      group: false,
      type: "positive",
      message: "Document successfully saved"
    })
  }
}

watch(route, () => {
  checkEditability()
  checkNew()
  checkHasEdits()
}, { immediate: true, deep: true })

watch(() => openedDocumentsStore.getAllDocuments, () => {
  checkEditability()
  checkNew()
  checkHasEdits()
}, { deep: true })

const hasEdits = ref(false)

function checkHasEdits () {
  const currentDocument = findRequestedOrActiveDocument()

  if (currentDocument && !currentDocument.hasEdits) {
    hasEdits.value = true
  }
  else {
    hasEdits.value = false
  }
}

function checkEditability () {
  const currentDocument = findRequestedOrActiveDocument()

  if (currentDocument && !currentDocument.editMode) {
    currentyEditable.value = true
  }
  else {
    currentyEditable.value = false
  }
}

function checkNew () {
  const currentDocument = findRequestedOrActiveDocument()

  if (currentDocument && currentDocument.isNew) {
    currentlyNew.value = true
  }
  else {
    currentlyNew.value = false
  }
}

const currentyEditable = ref(false)
const currentlyNew = ref(false)

const openedDocsWithEdits = ref<I_OpenedDocument[]>([])

async function massSave () {
  openedDocsWithEdits.value = openedDocumentsStore.getAllDocuments.docs.filter(doc => doc.hasEdits)

  const setup = {
    message: "<h4>Saving all opened documents...</h4>",
    spinnerColor: "primary",
    messageColor: "cultured",
    spinnerSize: 120,
    backgroundColor: "dark",
    // @ts-ignore
    spinner: QSpinnerGears
  }

  // @ts-ignore
  Loading.show(setup)
  for (const doc of openedDocsWithEdits.value) {
    await saveOpenedDocument(doc)
  }

  await sleep(3000)
  Loading.hide()
}

async function saveOpenedDocument (doc: I_OpenedDocument) {
  const docCopy: I_OpenedDocument = extend(true, [], doc)
  const allOpenedDocuments: I_OpenedDocument[] = extend(true, [], openedDocumentsStore.getAllDocuments)

  // @ts-ignore
  const isNew = doc.isNew

  // @ts-ignore
  const savedDocument: {
    documentCopy: I_OpenedDocument,
    allOpenedDocuments: I_OpenedDocument[]
  } = await saveDocument(docCopy, allOpenedDocuments, allDocumentsStore.getAllDocuments.docs, false, { SGET_allDocuments: allDocumentsStore.getAllDocuments, SGET_allDocumentsByType: (id: string) => allDocumentsStore.getDocumentsByType(id), SSET_updateDocument: (p: any) => allDocumentsStore.updateDocument(p), SSET_addDocument: (p: any) => allDocumentsStore.addDocument(p) }, true)

  // Update the opened document
  const dataPass = { doc: savedDocument.documentCopy, treeAction: true }
  openedDocumentsStore.updateDocument(dataPass)

  // Update document
  if (!isNew) {
    // @ts-ignore
    allDocumentsStore.updateDocument({ doc: mapShortDocument(savedDocument.documentCopy, allDocumentsStore.getDocumentsByType(savedDocument.documentCopy.type).docs) })
  }
  // Add new document
  else {
    // @ts-ignore
    allDocumentsStore.addDocument({ doc: mapShortDocument(savedDocument.documentCopy, allDocumentsStore.getDocumentsByType(savedDocument.documentCopy.type).docs) })
  }

  // Update all others
  for (const d of savedDocument.allOpenedDocuments) {
    const dataPass = { doc: d, treeAction: true }
    openedDocumentsStore.updateDocument(dataPass)

    // @ts-ignore
    allDocumentsStore.updateDocument({ doc: mapShortDocument(d, allDocumentsStore.getDocumentsByType(d.type).docs) })
  }
}

function triggerExport () {
  const currentDocument = findRequestedOrActiveDocument()
  // @ts-ignore
  const prepickedID = currentDocument._id

  dialogsStore.setExportDialogState([prepickedID])
}
</script>

<style lang="scss">
.documentControl {
  z-index: 999;
  width: calc(100vw - 380px);
  margin-top: 2.5px;

  &.fullScreen {
    width: calc(100vw);
  }

  &__blocker {
    position: absolute;
    top: -7.5px;
    left: 0;
    right: 0;
    background-color: darken($dark, 0.5);
    z-index: 999;
    height: 7.5px;
  }

  &__wrapper {
    width: calc(100vw - 385px);
    padding: 8.5px 15px;
    display: flex;
    justify-content: space-between;
    position: relative;

    &.fullScreen {
      width: calc(100vw);
    }

    &::after {
      content: " ";
      bottom: 1px;
      right: -5px;
      left: -5px;
      position: absolute;
      height: 1px;
      background-color: rgba($accent, 0.2);
    }
  }

  &__left,
  &__right {
    display: flex;
  }

  &__left {
    justify-content: flex-start;

    .q-btn,
    .q-separator {
      margin-right: 10px;
    }
  }

  &__right {
    justify-content: flex-end;

    .q-btn,
    .q-separator {
      margin-left: 10px;
    }
  }
}

html body {
  &.q-body--prevent-scroll {
    .documentControl {
      min-width: calc(100vw - 375px);
    }
  }
}
</style>
