<template>

<span>

   <closeDocumentCheckDialog
     :dialog-trigger="closeDocumentCheckDialogTrigger"
     :dialog-document="dialogDoc"
      @trigger-dialog-close="closeDocumentCheckDialogClose"
    />

    <!-- Delele document dialog -->
    <deleteDocumentCheckDialog
      :dialog-trigger="deleteObjectDialogTrigger"
      :document-id="toDeleteID"
      :document-type="toDeleteType"
      @trigger-dialog-close="deleteObjectDialogClose"
    />

    <q-tabs
      v-if="localDocuments.length > 0"
      :class="{'hasTextShadow': textShadow}"
      align="left"
      inline-label
      outside-arrows
      mobile-arrows
      class="tabsWrapper"
      dense
      no-caps>
      <transition-group
        name="list"
        tag="div"
        class="headerTransitionWrapper"
        enter-active-class="animated fadeIn"
        leave-active-class="animated fadeOut"
        appear
        :duration="50">

        <q-route-tab
          :ripple="false"
          v-for="document in localDocuments"
          :to="`/project/display-content/${document.type}/${document._id}`"
          :key="document.type+document._id"
          :icon="(retrieveFieldValue(document,'categorySwitch') ? 'fas fa-folder-open' : document.icon)"
          :style="`
            color: ${retrieveFieldValue(document,'documentColor')};
            background-color: ${retrieveFieldValue(document,'documentBackgroundColor')};
            filter: ${(retrieveFieldValue(document,'minorSwitch') ? 'grayscale(100) brightness(0.7)' : '')}`"
          :class="[
            {'isBold':
              (
                retrieveFieldValue(document,'documentColor') !== '#ffffff' &&
                retrieveFieldValue(document,'documentColor') !== '#fff'
              ) &&
              retrieveFieldValue(document,'documentColor') !== ''
              }]"
          :alert="document.hasEdits"
          alert-icon="mdi-feather"
          @click.prevent.middle="tryCloseTab(document)"
          @mouseleave="setDocumentPreviewClose"
          >
            <span class="isDeadIndicator" v-if="retrieveFieldValue(document,'deadSwitch')">
              †
            </span>
            <div
              class="q-tab__label"
             :class="{'isDead': (retrieveFieldValue(document,'deadSwitch') && !hideDeadCrossThrough)}">
             {{retrieveFieldValue(document,'name')}}
            </div>
            <documentPreview
              v-if="!preventPreviewsTabs"
              :document-id="document._id"
              :external-close-trigger="documentPreviewClose"
              :custom-delay="1750"
            />

            <q-btn
              round
              dense
              flat
              class="z-max q-ml-auto"
              :class="{'q-mr-sm': document.hasEdits}"
              size="xs"
              icon="close"
              style="color: #fff;"
              @click.stop.prevent="tryCloseTab(document)"
            />

            <q-menu
              touch-position
              context-menu
            >
              <q-list class="bg-gunmetal-light text-accent">
                <q-item clickable>
                  <q-item-section>All opened tabs</q-item-section>
                  <q-item-section avatar>
                    <q-icon name="keyboard_arrow_right" />
                  </q-item-section>
                  <q-menu anchor="top end" self="top start">
                    <q-list class="bg-gunmetal text-accent">
                      <q-item
                        :to="`/project/display-content/${menuDoc.type}/${menuDoc._id}`"
                        v-for="menuDoc in localDocuments"
                        :key="menuDoc._id"
                        clickable
                        :style="`
                          color: ${retrieveFieldValue(menuDoc,'documentColor')};
                          background-color: ${retrieveFieldValue(menuDoc,'documentBackgroundColor')};
                          filter: ${(retrieveFieldValue(menuDoc,'minorSwitch') ? 'grayscale(100) brightness(0.7)' : '')}`"
                      >
                       <q-item-section class="isDeadIndicator grow-0" v-if="retrieveFieldValue(menuDoc,'deadSwitch')">
                          †
                        </q-item-section>
                        <q-item-section
                          :class="{'isDead': (retrieveFieldValue(menuDoc,'deadSwitch') && !hideDeadCrossThrough)}"
                        >{{retrieveFieldValue(menuDoc,'name')}}</q-item-section>
                        <q-item-section avatar>
                          <q-icon :name="(retrieveFieldValue(menuDoc,'categorySwitch') ? 'fas fa-folder-open' : menuDoc.icon)" />
                        </q-item-section>
                      </q-item>
                    </q-list>
                  </q-menu>
                </q-item>
                <q-separator dark />
                <q-item clickable v-close-popup @click="copyName(document)">
                  <q-item-section>Copy name</q-item-section>
                  <q-item-section avatar>
                    <q-icon name="mdi-text-recognition" />
                  </q-item-section>
                </q-item>
                <q-item clickable v-close-popup @click="copyTextColor(document)">
                  <q-item-section>Copy text color</q-item-section>
                  <q-item-section avatar>
                    <q-icon name="mdi-eyedropper" />
                  </q-item-section>
                </q-item>
                <q-item clickable v-close-popup @click="copyBackgroundColor(document)">
                  <q-item-section>Copy background color</q-item-section>
                  <q-item-section avatar>
                    <q-icon name="mdi-format-color-fill" />
                  </q-item-section>
                </q-item>
                <q-separator dark />
                <q-item clickable v-if="!document.isNew"  v-close-popup @click="openDocumentPreviewPanel(document._id)">
                  <q-item-section>Preview document in split-view mode</q-item-section>
                  <q-item-section avatar>
                    <q-icon name="mdi-file-search-outline" />
                  </q-item-section>
                </q-item>
                <q-item v-if="!document.isNew" clickable v-close-popup @click="addNewUnderParent(document)">
                  <q-item-section>Create new document with this document as parent</q-item-section>
                  <q-item-section avatar>
                    <q-icon name="mdi-file-tree" />
                  </q-item-section>
                </q-item>
                <q-item clickable v-if="!document.isNew"  v-close-popup @click="copyTargetDocument(document)">
                  <q-item-section>Copy this document</q-item-section>
                  <q-item-section avatar>
                    <q-icon name="mdi-content-copy" />
                  </q-item-section>
                </q-item>
                <q-separator dark />
                 <q-item clickable v-close-popup @click="tryMoveTabLeft(document)">
                  <q-item-section>Move tab left</q-item-section>
                  <q-item-section avatar>
                    <q-icon name="mdi-chevron-left" />
                  </q-item-section>
                </q-item>
                <q-item clickable v-close-popup @click="tryMoveTabRight(document)">
                  <q-item-section>Move tab right</q-item-section>
                  <q-item-section avatar>
                    <q-icon name="mdi-chevron-right" />
                  </q-item-section>
                </q-item>
                <q-separator v-if="!document.isNew" />
                <q-item clickable v-close-popup @click="tryCloseTab(document)">
                  <q-item-section>Close this tab</q-item-section>
                  <q-item-section avatar>
                    <q-icon name="mdi-close" />
                  </q-item-section>
                </q-item>
                 <q-item clickable v-close-popup @click="openedDocumentsStore.closeAllButCurrentDocuments(document)">
                  <q-item-section>Close all tabs without changes except for this</q-item-section>
                  <q-item-section avatar>
                    <q-icon name="mdi-close-box-outline" />
                  </q-item-section>
                </q-item>
                <q-item clickable v-close-popup @click="openedDocumentsStore.closeAllDocuments()">
                  <q-item-section>Close all tabs without changes</q-item-section>
                  <q-item-section avatar>
                    <q-icon name="mdi-close-box-multiple-outline" />
                  </q-item-section>
                </q-item>
                <q-separator dark />
                <q-item clickable v-close-popup @click="openedDocumentsStore.forceCloseAllButCurrentDocuments(document)">
                  <q-item-section class="text-secondary"><b>Force close all tabs except for this</b></q-item-section>
                  <q-item-section avatar class="text-secondary">
                    <q-icon name="mdi-close-box" />
                  </q-item-section>
                </q-item>
                <q-item clickable v-close-popup @click="openedDocumentsStore.forceCloseAllDocuments()">
                  <q-item-section class="text-secondary"><b>Force close all tabs</b></q-item-section>
                  <q-item-section avatar class="text-secondary">
                    <q-icon name="mdi-close-box-multiple" />
                  </q-item-section>
                </q-item>
                <q-separator dark />
                <q-item clickable v-close-popup @click="deleteTabDocument(document)">
                  <q-item-section class="text-secondary"><b>Delete this document</b></q-item-section>
                  <q-item-section avatar class="text-secondary">
                    <q-icon name="mdi-text-box-remove-outline" />
                  </q-item-section>
                </q-item>
              </q-list>

            </q-menu>
        </q-route-tab>

      </transition-group>
    </q-tabs>

  </span>

</template>

<script setup lang="ts">
import { ref, watch } from "vue"
import { useRoute, useRouter } from "vue-router"

import deleteDocumentCheckDialog from "src/components/dialogs/DeleteDocumentCheck.vue"

import type { I_OpenedDocument } from "src/interfaces/I_OpenedDocument"
import closeDocumentCheckDialog from "src/components/dialogs/CloseDocumentCheck.vue"
import { createNewWithParent } from "src/scripts/documentActions/createNewWithParent"
import { copyDocumentName, copyDocumentTextColor, copyDocumentBackgroundColor } from "src/scripts/documentActions/uniqueFieldCopy"
import { copyDocument } from "src/scripts/documentActions/copyDocument"
import { extend, uid } from "quasar"
import documentPreview from "src/components/DocumentPreview.vue"

import { useAppStores } from "src/composables/useAppStores"
import { useDocumentHelpers } from "src/composables/useDocumentHelpers"

const route = useRoute()
const router = useRouter()

const {
  blueprintsStore,
  openedDocumentsStore,
  keybindsStore,
  dialogsStore,
  optionsStore
} = useAppStores()

const {
  generateUID,
  retrieveFieldValue,
  findRequestedOrActiveDocument,
  openDocumentPreviewPanel,
  refreshRoute,
  determineKeyBind
} = useDocumentHelpers()

/****************************************************************/
// App options
/****************************************************************/

const textShadow = ref(false)
const hideDeadCrossThrough = ref(false)
const preventPreviewsTabs = ref(true)

watch(() => optionsStore.getOptions, () => {
  const options = optionsStore.getOptions
  textShadow.value = options.textShadow
  hideDeadCrossThrough.value = options.hideDeadCrossThrough
  preventPreviewsTabs.value = options.preventPreviewsTabs
}, { immediate: true, deep: true })

/****************************************************************/
// Keybind handling
/****************************************************************/

watch(() => keybindsStore.getCurrentKeyBindData, () => {
  // Close tab dialog
  if (determineKeyBind("closeTab") && localDocuments.value.length > 0 && !dialogsStore.getDialogsState) {
    tryCloseTab()
  }

  // Next tab
  if (determineKeyBind("nextTab") && localDocuments.value.length > 0 && !dialogsStore.getDialogsState) {
    goToNextTab()
  }

  // Previous tab
  if (determineKeyBind("previousTab") && localDocuments.value.length > 0 && !dialogsStore.getDialogsState) {
    goToPreviousTab()
  }

  // Move tab left - SHIFT + ALT + LEFT ARROW
  if (determineKeyBind("moveTabLeft") && localDocuments.value.length > 0 && !dialogsStore.getDialogsState) {
    const currentDoc = findRequestedOrActiveDocument() as I_OpenedDocument
    tryMoveTabLeft(currentDoc)
  }

  // Move tab right - SHIFT + ALT + RIGHT ARROW
  if (determineKeyBind("moveTabRight") && localDocuments.value.length > 0 && !dialogsStore.getDialogsState) {
    const currentDoc = findRequestedOrActiveDocument() as I_OpenedDocument
    tryMoveTabRight(currentDoc)
  }

  // Close all tabs without changes except for this - CTRL + ALT + SHIFT + W
  if (determineKeyBind("closeAllTabsWithoutChangesButThis") && localDocuments.value.length > 0 && !dialogsStore.getDialogsState) {
    const currentDoc = findRequestedOrActiveDocument() as I_OpenedDocument
    openedDocumentsStore.closeAllButCurrentDocuments(currentDoc)
  }

  // Close all tabs without changes - CTRL + SHIFT + W
  if (determineKeyBind("closeAllTabsWithoutChanges") && localDocuments.value.length > 0 && !dialogsStore.getDialogsState) {
    openedDocumentsStore.closeAllDocuments()
  }

  // Force close all tabs except for this - NONE
  if (determineKeyBind("forceCloseAllTabsButThis") && localDocuments.value.length > 0 && !dialogsStore.getDialogsState) {
    const currentDoc = findRequestedOrActiveDocument() as I_OpenedDocument
    openedDocumentsStore.forceCloseAllButCurrentDocuments(currentDoc)
  }

  // Force close all tabs - NONE
  if (determineKeyBind("forceCloseAllTabs") && localDocuments.value.length > 0 && !dialogsStore.getDialogsState) {
    openedDocumentsStore.forceCloseAllDocuments()
  }
}, { deep: true })

/****************************************************************/
// Tab management
/****************************************************************/

watch(() => openedDocumentsStore.getAllDocuments, (val) => {
  localDocuments.value = []
  localDocuments.value = val.docs

  // Re-check the route after a change
  refreshRoute()
}, { deep: true })

const localDocuments = ref<I_OpenedDocument[]>([])

const dialogDoc = ref(null as unknown as I_OpenedDocument)

function tryCloseTab (doc?: I_OpenedDocument) {
  const matchingDocument = findRequestedOrActiveDocument(doc)

  if (matchingDocument) {
    dialogDoc.value = matchingDocument
    closeDocumentCheckDialogAssignUID()
  }
}

function tryMoveTabRight (doc?: I_OpenedDocument) {
  const currentIndex = localDocuments.value.findIndex(localDoc => {
    return localDoc._id === doc?._id
  })

  if (localDocuments.value.length > 1) {
    let newIndex = currentIndex + 1

    if (currentIndex === localDocuments.value.length - 1) {
      newIndex = 0
    }
    /* eslint-disable */
    // @ts-ignore
    Array.prototype.move = function (from, to) {
      this.splice(to, 0, this.splice(from, 1)[0])
      return this
    }
    const copy = localDocuments.value.map(doc => doc)
    // @ts-ignore
    copy.move(currentIndex, newIndex)
    localDocuments.value = copy
  }
}

function tryMoveTabLeft (doc?: I_OpenedDocument) {
  const currentIndex = localDocuments.value.findIndex(localDoc => {
    return localDoc._id === doc?._id
  })

  if (localDocuments.value.length > 1) {
    let newIndex = currentIndex - 1

    if (currentIndex === 0) {
      newIndex = localDocuments.value.length + 1
    }
    /* eslint-disable */
    // @ts-ignore
    Array.prototype.move = function (from, to) {
      this.splice(to, 0, this.splice(from, 1)[0])
      return this
    }
    const copy = localDocuments.value.map(doc => doc)
    // @ts-ignore
    copy.move(currentIndex, newIndex)
    localDocuments.value = copy
  }
}

function goToNextTab () {
  let index = -1
  const matchingDocument = localDocuments.value.find((e, i) => {
    index = i
    return e.url === route.path
  })

  if (matchingDocument && index !== localDocuments.value.length - 1) {
    router.push({ path: localDocuments.value[index + 1].url }).catch((e: {name: string}) => {
      if (e && e.name !== "NavigationDuplicated") {
        console.log(e)
      }
    })
  }
  if (matchingDocument && index === localDocuments.value.length - 1) {
    router.push({ path: localDocuments.value[0].url }).catch((e: {name: string}) => {
      if (e && e.name !== "NavigationDuplicated") {
        console.log(e)
      }
    })
  }
}

function goToPreviousTab () {
  let index = -1
  const matchingDocument = localDocuments.value.find((e, i) => {
    index = i
    return e.url === route.path
  })

  if (matchingDocument && index !== 0) {
    router.push({ path: localDocuments.value[index - 1].url }).catch((e: {name: string}) => {
      if (e && e.name !== "NavigationDuplicated") {
        console.log(e)
      }
    })
  }

  if (matchingDocument && index === 0) {
    router.push({ path: localDocuments.value[localDocuments.value.length - 1].url }).catch((e: {name: string}) => {
      if (e && e.name !== "NavigationDuplicated") {
        console.log(e)
      }
    })
  }
}

/****************************************************************/
// Document field copying
/****************************************************************/

function copyName (currentDoc: I_OpenedDocument) {
  copyDocumentName(currentDoc)
}

function copyTextColor (currentDoc: I_OpenedDocument) {
  copyDocumentTextColor(currentDoc)
}

function copyBackgroundColor (currentDoc: I_OpenedDocument) {
  copyDocumentBackgroundColor(currentDoc)
}

/****************************************************************/
// Document copy
/****************************************************************/

const documentPass = ref(null as unknown as I_OpenedDocument)

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
    const errorName: string = e.name
    if (errorName === "NavigationDuplicated") {
      return
    }
    console.log(e)
  })
}

/****************************************************************/
// Add new document under parent
/****************************************************************/
function addNewUnderParent (currentDoc: I_OpenedDocument) {
  createNewWithParent(currentDoc, {
    addNewObjectRoute: (obj: any) => router.push({ path: `/project/display-content/${obj._id}/${uid()}`, query: { parent: obj.parent ?? "", tag: obj.tag ?? "" } }).catch(console.log)
  })
}

/****************************************************************/
// Close document dialog
/****************************************************************/

const closeDocumentCheckDialogTrigger = ref("")
function closeDocumentCheckDialogClose () {
  closeDocumentCheckDialogTrigger.value = ""
}

function closeDocumentCheckDialogAssignUID () {
  closeDocumentCheckDialogTrigger.value = generateUID()
}

/****************************************************************/
// Delete dialog
/****************************************************************/

const deleteObjectDialogTrigger = ref("")
function deleteObjectDialogClose () {
  deleteObjectDialogTrigger.value = ""
}

function deleteObjectAssignUID () {
  deleteObjectDialogTrigger.value = generateUID()
}

const toDeleteID = ref("")
const toDeleteType = ref("")

function deleteTabDocument (targetDocument: I_OpenedDocument) {
  toDeleteID.value = targetDocument._id
  toDeleteType.value = targetDocument.type
  deleteObjectAssignUID()
}

function setDocumentPreviewClose () {
  documentPreviewClose.value = uid()
}

const documentPreviewClose = ref("")
</script>

<style lang="scss" scoped>
.headerTransitionWrapper {
  display: flex;
}

.tabsWrapper .fas,
.tabsWrapper .fab {
  font-size: 16px;
}

.tabsWrapper .mdi {
  font-size: 18px;
}
</style>

<style lang="scss">
.tabsWrapper {
  -webkit-app-region: no-drag;

  &.hasTextShadow {
    .q-tab__label,
    .q-tab__icon {
      $shadowColorOutline: #000;
      $shadowColorSurround: #000;

      filter: drop-shadow(0 0 1px #000);
      text-shadow:
        //-2px -2px 0 $shadowColorSurround,
        //2px -2px 0 $shadowColorSurround,
        //-2px 2px 0 $shadowColorSurround,
        //2px 2px 0 $shadowColorSurround,
        -1px -1px 0 $shadowColorOutline,
        1px -1px 0 $shadowColorOutline,
        -1px 1px 0 $shadowColorOutline,
        1px 1px 0 $shadowColorOutline;
    }
  }

  .q-tabs__arrow {
    text-shadow: none !important;
  }

  .isBold .q-tab__label {
    font-weight: 500 !important;
  }

  .q-tab {
    padding: 0 10px;

    &__content {
      min-width: 170px;
      width: 170px;
      justify-content: flex-start;
      text-align: left;
    }

    &__label {
      overflow: hidden;
      text-overflow: ellipsis;
      padding-top: 2px;
      font-weight: 400;
      font-size: 13px;
    }
  }

  .fas,
  .fab {
    font-size: 16px;
  }

  .mdi {
    font-size: 18px;
  }

  &.q-tabs--dense .q-tab {
    min-height: 40px;
  }

  .q-tab__alert-icon {
    font-size: 16px;
    top: 4px;
    right: -10px;
    color: $primary;
  }
}

body.body--dark {
  .topTabs {
    .q-tab {
      color: #dcdcdc;
    }
  }
}
</style>
