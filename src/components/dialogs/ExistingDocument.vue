<template>
  <div>

    <q-dialog
      no-route-dismiss
      v-model="dialogModel"
      @before-hide="triggerDialogClose"
      >
      <q-card
        dark
        class="existingDocumentPopup"
      >

        <q-card-section class="row items-center">
          <h6 class="text-center q-my-sm">Search through existing documents</h6>
        </q-card-section>

        <q-card-section class="column items-center">
          <div class="q-mb-md">
            <q-checkbox dark color="primary" v-model="includeCategories" label="Include categories in the list?" />
          </div>

           <q-select
              style="width: 400px;"
              ref="ref_existingDocument"
              dense
              class="existingDocumentSelect"
              dark
              popup-content-class="menuResizer"
              menu-anchor="bottom middle"
              menu-self="top middle"
              :options="filteredExistingInput"
              use-input
              multiple
              filled
              input-debounce="500"
              v-model="existingDocumentModel"
              @filter="filterExistingSelect"
              @input="openExistingInput"
            >
              <template v-slot:append v-if="!hideAdvSearchCheatsheetButton">
                <q-btn round dense flat icon="mdi-help-rhombus" @click.stop.prevent="floatingWindowsStore.setAdvSearchWindowVisible"
                >
                  <q-tooltip :delay="500">
                    Open search cheatsheet
                  </q-tooltip>
                </q-btn>
              </template>
              <template v-slot:option="{ itemProps, itemEvents, opt }">
                  <q-item
                    :class="{'hasTextShadow': textShadow, 'isMinor':opt.isMinor}"
                    v-bind="itemProps"
                    v-on="itemEvents"
                    :key="opt.id"
                    :style="`color: ${opt.color}; background-color: ${opt.bgColor}`"
                    @mouseleave="setDocumentPreviewClose"
                  >
                  <documentPreview
                    v-if="!preventPreviewsPopups"
                    :quickInsertMode="quickInsertMode"
                    :document-id="opt._id"
                    :external-close-trigger="documentPreviewClose"
                    :special-z-index="999999999"
                    :custom-anchor="'top start'"
                    :custom-self="'center right'"
                    :custom-delay="1200"
                  />
                    <q-item-section avatar>
                      <q-icon
                        :style="`color: ${retrieveIconColor(opt)}`"
                        :name="(opt.isCategory) ? 'fas fa-folder-open' : opt.icon"
                        />
                    </q-item-section>
                    <q-item-section>
                      <q-item-label>
                        <span class="isDeadIndicator" v-if="opt.isDead">
                          †
                        </span>
                        <span :class="{'isDead': (opt.isDead && !hideDeadCrossThrough)}" v-html="opt.label">
                        </span>
                      </q-item-label>
                      <q-item-label caption class="text-cultured" v-html="opt.hierarchicalPath"></q-item-label>
                      <q-item-label caption class="text-cultured" v-if="opt.tags">
                        <q-chip
                        v-for="(input,index) in opt.tags" :key="index"
                        outline
                        style="opacity: 0.8;"
                        size="12px"
                        class="text-cultured"
                        v-html="`${input}`"
                        >
                        </q-chip>
                      </q-item-label>
                    </q-item-section>
                    <q-btn
                      v-if="!quickInsertMode"
                      tabindex="-1"
                      round
                      flat
                      dense
                      dark
                      color="accent"
                      class="z-1 q-ml-sm self-center"
                      icon="mdi-pencil"
                      size="sm"
                      @click.stop.prevent="editExistingInput(opt)"
                      >
                      <q-tooltip
                        :delay="300"
                      >
                        Edit {{ stripTags(opt.label) }}
                      </q-tooltip>
                    </q-btn>
                    <q-btn
                      v-if="!quickInsertMode"
                      tabindex="-1"
                      round
                      flat
                      dense
                      dark
                      color="primary"
                      class="z-1 q-ml-sm self-center"
                      icon="mdi-content-copy"
                      size="sm"
                      @click.stop.prevent="copyTargetDocument(opt)"
                      >
                      <q-tooltip
                        :delay="300"
                      >
                        Make a copy of {{ stripTags(opt.label) }}
                        <br>
                        This action will always close the popup.
                    </q-tooltip>
                    </q-btn>
                    <q-btn
                      v-if="!quickInsertMode"
                      tabindex="-1"
                      round
                      flat
                      dense
                      dark
                      color="primary"
                      class="z-1 q-ml-sm self-center"
                      icon="mdi-file-tree"
                      size="sm"
                      @click.stop.prevent="addNewUnderParent(opt)"
                      >
                      <q-tooltip
                        :delay="300"
                      >
                        Add a new document belonging under {{ stripTags(opt.label) }}
                        <br>
                        This action will always close the popup.
                      </q-tooltip>
                    </q-btn>

            <q-menu
              v-if="!quickInsertMode"
              touch-position
              context-menu
              auto-close
              separate-close-popup
              content-style="z-index: 1000000000 !important;"
            >

              <q-list class="bg-gunmetal-light text-accent">

                <template>
                  <q-item clickable  @click="copyName(opt)">
                    <q-item-section>Copy name</q-item-section>
                    <q-item-section avatar>
                      <q-icon name="mdi-text-recognition" />
                    </q-item-section>
                  </q-item>
                  <q-item clickable @click="copyTextColor(opt)">
                    <q-item-section>Copy text color</q-item-section>
                    <q-item-section avatar>
                      <q-icon name="mdi-eyedropper" />
                    </q-item-section>
                  </q-item>
                  <q-item clickable @click="copyBackgroundColor(opt)">
                    <q-item-section>Copy background color</q-item-section>
                    <q-item-section avatar>
                      <q-icon name="mdi-format-color-fill" />
                    </q-item-section>
                  </q-item>
                  <q-separator dark />
                    <q-item clickable @click="openExistingInput(opt)">
                    <q-item-section>Open document</q-item-section>
                    <q-item-section avatar>
                      <q-icon name="mdi-book-open-page-variant-outline" />
                    </q-item-section>
                  </q-item>
                  <q-item clickable @click="editExistingInput(opt)">
                    <q-item-section>Edit document</q-item-section>
                    <q-item-section avatar>
                      <q-icon name="mdi-pencil" />
                    </q-item-section>
                  </q-item>
                  <q-item clickable @click="openDocumentPreviewPanel(opt._id)">
                      <q-item-section>Preview document in split-view mode</q-item-section>
                      <q-item-section avatar>
                        <q-icon name="mdi-file-search-outline" />
                      </q-item-section>
                    </q-item>
                  <q-item clickable @click="addNewUnderParent(opt)">
                    <q-item-section>Create new document with this document as parent</q-item-section>
                    <q-item-section avatar>
                      <q-icon color="primary" name="mdi-file-tree" />
                    </q-item-section>
                  </q-item>
                  <q-item clickable @click="copyTargetDocument(opt)">
                    <q-item-section>Copy this document</q-item-section>
                    <q-item-section avatar>
                      <q-icon color="primary" name="mdi-content-copy" />
                    </q-item-section>
                  </q-item>
                  <q-separator dark />
                  <q-item clickable v-close-popup @click="triggerExport(opt)">
                    <q-item-section>Export document</q-item-section>
                    <q-item-section avatar>
                      <q-icon name="mdi-database-export-outline" />
                    </q-item-section>
                  </q-item>
                </template>

              </q-list>

            </q-menu>
                  </q-item>
                </template>
            </q-select>
        </q-card-section>

        <q-card-section>
          <q-card-actions align="around" class="q-mb-sm">
            <q-btn flat label="Close" color="accent" v-close-popup />
          </q-card-actions>
        </q-card-section>

      </q-card>
    </q-dialog>
</div>

</template>

<script setup lang="ts">
import { ref, watch, nextTick, defineAsyncComponent } from "vue"
import type { I_OpenedDocument, I_ShortenedDocument } from "src/interfaces/I_OpenedDocument"
import { advancedDocumentFilter } from "src/scripts/utilities/advancedDocumentFilter"
import { extend, uid } from "quasar"

import { createNewWithParent } from "src/scripts/documentActions/createNewWithParent"
import { copyDocumentName, copyDocumentTextColor, copyDocumentBackgroundColor } from "src/scripts/documentActions/uniqueFieldCopy"
import { copyDocument } from "src/scripts/documentActions/copyDocument"

import type { I_Blueprint } from "src/interfaces/I_Blueprint"

import { useAppStores } from "src/composables/useAppStores"
import { useDocumentHelpers } from "src/composables/useDocumentHelpers"
import { useRouter } from "vue-router"

const documentPreview = defineAsyncComponent(() => import("src/components/DocumentPreview.vue"))

const props = defineProps<{
  dialogTrigger?: string
  preventOpen?: boolean
  quickInsertMode?: boolean
}>()

const emit = defineEmits(["triggerDialogClose", "triggerDialogSubmit", "signalDocumentSelected"])

const router = useRouter()
const { dialogsStore, blueprintsStore, allDocumentsStore, openedDocumentsStore, optionsStore, floatingWindowsStore, keybindsStore } = useAppStores()
const { stripTags, retrieveIconColor, generateUID, sleep, openExistingDocumentRoute, openExistingDocumentRouteWithEdit, openDocumentPreviewPanel, determineKeyBind } = useDocumentHelpers()

const dialogModel = ref(false)
const thumbStyle = { right: "-40px", borderRadius: "5px", backgroundColor: "#61a2bd", width: "5px", opacity: 1 }
const thumbStyleTabs = { right: "0px", borderRadius: "5px", backgroundColor: "#61a2bd", width: "5px", opacity: 1 }
const thumbStyleTutorialTabContent = { right: "-55px", borderRadius: "5px", backgroundColor: "#61a2bd", width: "5px", opacity: 1 }

watch(() => dialogsStore.getDialogsState, (val) => { if (!val) dialogModel.value = false })
watch(() => props.dialogTrigger, (val) => {
  if (val) {
    openDialog(val)
  }
})

function triggerDialogClose () { dialogsStore.setDialogState(false); emit("triggerDialogClose", true) }
function triggerDialogSubmit (val: string) { emit("triggerDialogSubmit", val) }

/****************************************************************/
// COMPONENT SETTINGS
/****************************************************************/

const preventPreviewsPopups = ref(false)
const hideAdvSearchCheatsheetButton = ref(false)
const hideDeadCrossThrough = ref(false)
const disableCloseAftertSelectQuickSearch = ref(false)
const closeWithSameClick = ref(false)
const textShadow = ref(false)
const isCloseAbleViaKeybind = ref(false)

/****************************************************************/
// PRE-FILTERING
/****************************************************************/

const includeCategories = ref(true)

watch(() => optionsStore.getOptions, () => {
  reloadOptions()
}, { immediate: true, deep: true })

function reloadOptions () {
  closeWithSameClick.value = optionsStore.getOptions.allowQuickPopupSameKeyClose
  disableCloseAftertSelectQuickSearch.value = optionsStore.getOptions.disableCloseAftertSelectQuickSearch
  includeCategories.value = !optionsStore.getOptions.disableQuickSearchCategoryPrecheck
  textShadow.value = optionsStore.getOptions.textShadow
  hideDeadCrossThrough.value = optionsStore.getOptions.hideDeadCrossThrough
  hideAdvSearchCheatsheetButton.value = optionsStore.getOptions.hideAdvSearchCheatsheetButton
  preventPreviewsPopups.value = optionsStore.getOptions.preventPreviewsPopups
}

/****************************************************************/
// LOCAL KEYBINDS
/****************************************************************/

watch(() => keybindsStore.getCurrentKeyBindData, () => {
  processKeyPush()
}, { deep: true })

function processKeyPush () {
  if (determineKeyBind("quickExistingDocument") && dialogModel.value && closeWithSameClick.value && isCloseAbleViaKeybind.value && dialogsStore.getDialogsState) {
    dialogModel.value = false
    dialogsStore.setDialogState(false)
    existingDocumentModel.value = []
  }
}

watch(includeCategories, () => {
  preFilterDocuments()
})

function preFilterDocuments () {
  existingObjectPrefilteredList.value = existingObjectsFullList.value
    .filter(e => !((!includeCategories.value && e.isCategory)))
}

/****************************************************************/
// SELECT LIST MANAGEMENT
/****************************************************************/

const existingObjectPrefilteredList = ref([] as I_ShortenedDocument[])
const existingObjectsFullList = ref([] as I_ShortenedDocument[])
const allDocumentBluePrints = ref([] as I_Blueprint[])
const ref_existingDocument = ref<any>(null)

async function populateExistingObjectDialog () {
  allDocumentBluePrints.value = blueprintsStore.getAllBlueprints

  existingObjectsFullList.value = allDocumentsStore.getAllDocuments.docs
  preFilterDocuments()

  await nextTick()

  if (ref_existingDocument.value) {
    await sleep(100)
    ref_existingDocument.value.focus()
  }
  isCloseAbleViaKeybind.value = true
}

const existingDocumentModel = ref<any[]>([])
const filteredExistingInput = ref(null as unknown as I_ShortenedDocument[])
const listCopy = ref<I_ShortenedDocument[]>([])

async function refocusSelect () {
  await nextTick()
  ref_existingDocument.value?.setOptionIndex(-1)
  ref_existingDocument.value?.moveOptionSelection(1, true)
}

function filterExistingSelect (val: string, update: (e: () => void) => void) {
  if (val === "") {
    update(() => {
      filteredExistingInput.value = existingObjectPrefilteredList.value.filter((obj) => !obj.isMinor)
      if (ref_existingDocument.value && filteredExistingInput.value.length > 0) {
        refocusSelect().catch(e => console.log(e))
      }
    })
    return
  }

  update(() => {
    const needle = val.toLowerCase()
    listCopy.value = extend(true, [], existingObjectPrefilteredList.value)
    filteredExistingInput.value = advancedDocumentFilter(needle, listCopy.value, allDocumentBluePrints.value, existingObjectsFullList.value)

    if (ref_existingDocument.value && filteredExistingInput.value.length > 0) {
      refocusSelect().catch(e => console.log(e))
    }
  })
}

/****************************************************************/
// DIALOG CONTROL
/****************************************************************/

function openDialog (val: string | false) {
  if (val) {
    if (dialogsStore.getDialogsState) {
      return
    }
    isCloseAbleViaKeybind.value = false
    dialogsStore.setDialogState(true)
    dialogModel.value = true

    reloadOptions()
    populateExistingObjectDialog().catch(e => console.log(e))
  }
}

/****************************************************************/
// TRIGGER ACTIONS
/****************************************************************/

function openExistingInput (e: I_ShortenedDocument) {
  // @ts-ignore
  e = (Array.isArray(e)) ? e[0] : e

  emit("signalDocumentSelected", e._id)

  if (props.preventOpen) {
    dialogModel.value = false
    existingDocumentModel.value = []
    return
  }
  if (!disableCloseAftertSelectQuickSearch.value) {
    dialogModel.value = false

    if (!props.quickInsertMode) {
      openExistingDocumentRoute(e)
    }
    existingDocumentModel.value = []
  }
  else {
    existingDocumentModel.value = []

    const retrievedObject = (openedDocumentsStore.getDocument(e._id)) || allDocumentsStore.getDocument(e._id)

    const dataPass = {
      doc: retrievedObject,
      treeAction: false
    }

    // @ts-ignore
    openedDocumentsStore.addDocument(dataPass)
  }
}

function editExistingInput (e: I_ShortenedDocument) {
  // @ts-ignore
  e = (Array.isArray(e)) ? e[0] : e
  if (!disableCloseAftertSelectQuickSearch.value) {
    dialogModel.value = false
    if (!props.quickInsertMode) {
      openExistingDocumentRouteWithEdit(e)
    }
    existingDocumentModel.value = []
  }
  else {
    existingDocumentModel.value = []

    const retrievedObject = (openedDocumentsStore.getDocument(e._id)) || allDocumentsStore.getDocument(e._id)

    // @ts-ignore
    retrievedObject.hasEdits = true

    const dataPass = {
      doc: retrievedObject,
      treeAction: false
    }

    // @ts-ignore
    openedDocumentsStore.addDocument(dataPass)
  }
}

const documentPass = ref(null as unknown as I_OpenedDocument)

/****************************************************************/
// Add new document under parent
/****************************************************************/
function addNewUnderParent (currentDoc: I_OpenedDocument) {
  createNewWithParent(currentDoc, {} as any)
  dialogModel.value = false
}

/****************************************************************/
// Document field copying
/****************************************************************/

function copyName (currentDoc: I_OpenedDocument) {
  copyDocumentName(currentDoc)
  dialogModel.value = false
}

function copyTextColor (currentDoc: I_OpenedDocument) {
  copyDocumentTextColor(currentDoc)
  dialogModel.value = false
}

function copyBackgroundColor (currentDoc: I_OpenedDocument) {
  copyDocumentBackgroundColor(currentDoc)
  dialogModel.value = false
}

function copyTargetDocument (currentDoc: I_OpenedDocument) {
  documentPass.value = extend(true, {}, currentDoc)

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
    const errorName : string = e.name
    if (errorName === "NavigationDuplicated") {
      return
    }
    console.log(e)
  })

  dialogModel.value = false
}

const documentPreviewClose = ref("")

function setDocumentPreviewClose () {
  documentPreviewClose.value = uid()
}

async function triggerExport (node: {_id: string}) {
  dialogModel.value = false

  await sleep(100)

  dialogsStore.setExportDialogState([node._id])
}
</script>

<style lang="scss" scoped>

.existingDocumentPopup {
  min-width: 600px;
  margin-top: 100px;
  align-self: flex-start;

  h6 {
    display: block;
    text-align: center;
    width: 100%;
  }
}
</style>
