<template>
    <q-dialog
    v-model="dialogModel"
    @before-hide="triggerDialogClose"
    >
    <q-card
    class="documentCloseCheckDialog"
     dark>

      <q-card-section class="row justify-center">
        <h6 class="text-center q-my-sm">You have unsaved documents opened!</h6>
      </q-card-section>
      <q-card-section class="row justify-center q-mx-lg">
        All unsaved data will be lost upon closing the app unless the documents are saved first.
      </q-card-section>

      <q-card-section class="row q-mx-lg">
        <div class="q-mb-md text-bold">Affected documents:</div>
        <q-list class="projectCloseDialogList">
          <q-item
          v-for=" doc in openedDocsWithEdits"
          :key="doc._id"
          clickable
          v-ripple
          active
          class="noHigh"
          active-class="bg-primary-1 text-primary"
          v-close-popup
          :to="doc.url">
            <q-item-section avatar>
              <q-icon color="white" :name="doc.icon" />
            </q-item-section>

            <q-item-section class="text-primary">{{retrieveFieldValue(doc,'name')}}</q-item-section>
          </q-item>
        </q-list>

      </q-card-section>

      <q-card-actions align="right" class="q-mx-xl q-mt-lg q-mb-md">
        <q-btn
          flat
          label="Cancel"
          color="accent"
          class="q-mx-sm"
          v-close-popup />
        <q-btn
          outline
          :label="saveAllLabelText"
          color="primary"
          class="q-mx-sm"
          @click="determineMassSaveAction" />
        <q-btn
          outline
          :label="exitLabelText"
          color="secondary"
          class="q-mx-sm"
          v-close-popup
          @click="determineModeAction" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">

import { ref, computed, watch } from "vue"
import { useRouter } from "vue-router"
import { extend, QSpinnerGears, Loading } from "quasar"
import { useAppStores } from "src/composables/useAppStores"
import { useDocumentHelpers } from "src/composables/useDocumentHelpers"
import type { I_OpenedDocument } from "src/interfaces/I_OpenedDocument"
import { saveDocument } from "src/scripts/databaseManager/documentManager"

const props = defineProps<{
  dialogTrigger?: string
  dialogMode: "appClose" | "projectClose"
}>()
const emit = defineEmits(["triggerDialogClose", "triggerDialogSubmit"])

const router = useRouter()
const { dialogsStore, openedDocumentsStore, allDocumentsStore } = useAppStores()
const { retrieveFieldValue, mapShortDocument, sleep } = useDocumentHelpers()

const dialogModel = ref(false)

watch(() => dialogsStore.getDialogsState, (val) => { if (!val) dialogModel.value = false })

watch(() => props.dialogTrigger, (val) => {
  if (val) {
    dialogsStore.setDialogState(true)
    checkForDocumentsWithEdits()
  }
})

function triggerDialogClose () { dialogsStore.setDialogState(false); emit("triggerDialogClose", true) }
function triggerDialogSubmit (val: string) { emit("triggerDialogSubmit", val) }

/**
 * Label text for the dialog
 */
const exitLabelText = computed(() => {
  if (props.dialogMode === "appClose") {
    return "Exit app without saving"
  }

  if (props.dialogMode === "projectClose") {
    return "Close project without saving"
  }
  return ""
})

/**
 * Label text for the dialog
 */
const saveAllLabelText = computed(() => {
  if (props.dialogMode === "appClose") {
    return "Save all & exit FA"
  }

  if (props.dialogMode === "projectClose") {
    return "Save all & close project"
  }
  return ""
})

/**
 * List of opened documents with edits in them
 */
const openedDocsWithEdits = ref<I_OpenedDocument[]>([])

/**
 * Check if we have any documents with edit. If not, skip the dialog and proceed.
 */
function checkForDocumentsWithEdits () {
  openedDocsWithEdits.value = openedDocumentsStore.getAllDocuments.docs.filter(doc => doc.hasEdits)

  if (openedDocsWithEdits.value.length > 0) {
    dialogModel.value = true
  }
  else {
    determineModeAction()
  }
}

/**
 * Decide what action to take depending on the dialog mode
 */
function determineModeAction () {
  if (props.dialogMode === "appClose") {
    closeApp()
  }
  if (props.dialogMode === "projectClose") {
    closeProject()
  }
}

async function determineMassSaveAction () {
  openedDocsWithEdits.value = openedDocumentsStore.getAllDocuments.docs.filter(doc => doc.hasEdits)

  const setup = {
    message: "<h4>Saving project...</h4>",
    spinnerColor: "primary",
    messageColor: "cultured",
    spinnerSize: 120,
    backgroundColor: "dark",
    // @ts-ignore
    spinner: QSpinnerGears
  }

  // @ts-ignore
  Loading.show(setup)
  for (const document of openedDocsWithEdits.value) {
    await saveOpenedDocument(document)
  }

  if (props.dialogMode === "appClose") {
    closeApp()
  }
  if (props.dialogMode === "projectClose") {
    await sleep(3000)
    Loading.hide()
    closeProject()
  }
}

/**
 * Close the project and navigate to the intro screen
 */
function closeProject () {
  openedDocumentsStore.resetDocuments()
  triggerDialogClose()
  router.push({ path: "/" }).catch((e: {name: string}) => {
    if (e && e.name !== "NavigationDuplicated") {
      console.log(e)
    }
  })
}

/**
 * Close app — in web mode just navigate away or reload
 */
function closeApp () {
  window.close()
}

async function saveOpenedDocument (document: I_OpenedDocument) {
  const docCopy: I_OpenedDocument = extend(true, [], document)
  const allOpenedDocuments: I_OpenedDocument[] = extend(true, [], openedDocumentsStore.getAllDocuments)

  // @ts-ignore
  const isNew = document.isNew

  // @ts-ignore
  const savedDocument: {
    documentCopy: I_OpenedDocument,
    allOpenedDocuments: I_OpenedDocument[]
  } = await saveDocument(docCopy, allOpenedDocuments, false, true)

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
    // Update the opened document
    const dataPass = { doc: doc, treeAction: true }
    openedDocumentsStore.updateDocument(dataPass)

    // @ts-ignore
    allDocumentsStore.updateDocument({ doc: mapShortDocument(doc, allDocumentsStore.getDocumentsByType(doc.type).docs) })
  }
}
</script>

<style lang="scss">

  .documentCloseCheckDialog {
    width: 700px;
    max-width: 700px !important;
  }

  .projectCloseDialogList {
    width: 100%;
  }

</style>
