<template>
  <q-layout view="hHh LpR lfr">

     <!-- Repair project dialog -->
    <repairProjectDialog
      :dialog-trigger="repairProjectDialogTrigger"
      @trigger-dialog-close="repairProjectDialogClose"
    />

    <q-dialog v-model="pre017check" seamless position="bottom">
      <q-card style="width: 100vw; min-width: 100vw;" dark class="text-accent bg-secondary">

        <q-card-section class="row items-center no-wrap justify-center">
          <div>
            Please check your project for possible issues with documents. This needs to be done only once! <span class="q-mx-lg"><q-btn outline label="Repair your project" color="accent" @click="repairProjectAssignUID" /></span>
          </div>

          <q-btn outline round icon="close" v-close-popup class="notifClose" />
        </q-card-section>
      </q-card>
    </q-dialog>

    <!-- Header -->
    <appHeader/>

    <q-splitter
      v-model="splitterModel"
      unit="px"
      emit-immediately
      :class="{splitterClass, 'splitterHidden': (hideHierarchyTree || SGET_getDocumentPreviewVisible !== '')}"
      @input="onChange"
      :limits="[limiterWidth, Infinity]"
      class="pageSplitter"
      >
      <template
       #before>
        <!-- Left drawer -->
        <q-drawer
          content-class="bg-dark text-cultured sideWrapper"
          v-model="leftDrawerOpen"
          side="left"
          :width="splitterModel"
          :breakpoint="0"
          show-if-above
          >
            <objectTree
              v-if="!hideHierarchyTree"
            />
        </q-drawer>
      </template>
      <template #after>
        <q-page-container :style="compPadding">
          <documentControl/>
          <transition
            enter-active-class="animated fadeIn"
            leave-active-class="animated fadeOut"
            appear
            :duration="50"
          >
            <router-view :key="$route.path" />
          </transition>

          <!-- <q-page-sticky
            style="z-index: 1000;"
             position="top-right" :offset="[18, 75]">
            <q-btn
              icon="mdi-book-search-outline"
              color="red-13"
              fab
              v-if="legacyFieldsCheck018"
              @click="openLegacyDocuments"
            >
              <q-tooltip
                :delay="500"
                anchor="bottom middle"
                self="top middle"
              >
                Check for documents with legacy values
              </q-tooltip>
            </q-btn>
          </q-page-sticky> -->

          </q-page-container>
        </template>
    </q-splitter>
  </q-layout>
</template>

<script setup lang="ts">

import { ref, computed, watch, onMounted, nextTick } from "vue"
import objectTree from "src/components/ObjectTree.vue"
import appHeader from "src/components/AppHeader.vue"
import documentControl from "src/components/DocumentControl.vue"
import { engageBlueprints } from "src/scripts/databaseManager/blueprintManager"
import repairProjectDialog from "src/components/dialogs/RepairProject.vue"

import { extend, useQuasar } from "quasar"
import type { OptionsState as OptionsStateInteface } from "src/stores/options"
import type { I_Blueprint } from "src/interfaces/I_Blueprint"
import type { I_ShortenedDocument } from "src/interfaces/I_OpenedDocument"
import { documentApi } from "src/services/api/documentApi"
import { useAppStores } from "src/composables/useAppStores"
import { useDocumentHelpers } from "src/composables/useDocumentHelpers"

const q = useQuasar()
const {
  blueprintsStore,
  openedDocumentsStore,
  allDocumentsStore,
  optionsStore,
  floatingWindowsStore,
  projectStore
} = useAppStores()
const { mapShortDocument, checkForLegacyDocuments, generateUID } = useDocumentHelpers()

/****************************************************************/
// PROJECT SETTINGS FIRST LOAD
/****************************************************************/

/**
 * Load all blueprints and documents from the API on first render.
 */
async function processBluePrints (): Promise<void> {
  const projectId = projectStore.currentProjectId as string
  const allObjectBlueprints = (await engageBlueprints(projectId))
    .sort((a: I_Blueprint, b: I_Blueprint) => {
      if (a.order > b.order) return -1
      if (a.order < b.order) return 1
      return 0
    })

  blueprintsStore.setAllBlueprints(allObjectBlueprints)
}

async function loadAllProjectDocuments () {
  const projectId = projectStore.currentProjectId as string

  for (const blueprint of blueprintsStore.getAllBlueprints) {
    const docs = await documentApi.listByType(projectId, blueprint._id)

    const formattedDocuments: I_ShortenedDocument[] = docs.map(d =>
      mapShortDocument(
        {
          _id: d.id,
          id: d.id,
          icon: blueprint.icon,
          url: `/project/display-content/${d.type}/${d.id}`,
          type: d.type,
          extraFields: d.extraFields
        } as unknown as I_ShortenedDocument,
        docs as any
      )
    ).sort((a, b) => a.label.localeCompare(b.label))

    allDocumentsStore.mapNewDocumentType({ id: blueprint._id, docs: formattedDocuments })
  }

  allDocumentsStore.markAsNonFirstRun()
}

onMounted(async () => {
  if (allDocumentsStore.getFirstRunState) {
    await processBluePrints()
    await loadAllProjectDocuments()
  }

  await nextTick()
  projectStore.setProjecLoadingState(true)
})

/****************************************************************/
// BASIC COMPONENT DATA
/****************************************************************/

/**
 * Model for the left drawer of the app containing the hierarchical tree
 */
const leftDrawerOpen = ref(true)

/**
 * Width of the splitted model
 */
const splitterModel = ref(375)

const pre017check = ref(false)

/**
 * Special class for the splitter
 */
const splitterClass = computed(() => !leftDrawerOpen.value ? "splitt" : "")

/**
 * Special padding reset for the main page
 */
const compPadding = computed(() => leftDrawerOpen.value ? { paddingLeft: "0px" } : "")

/****************************************************************/
// LOCAL SETTINGS
/****************************************************************/

const legacyFieldsCheck018 = ref<boolean | undefined>(true)
const hideHierarchyTree = ref(false)

const limiterWidth = computed(() =>
  (!hideHierarchyTree.value && floatingWindowsStore.getDocumentPreviewVisible === "") ? 374 : 0
)

function resizeTreeWrapper () {
  if (floatingWindowsStore.getDocumentPreviewVisible !== "") {
    splitterModel.value = 600
  }
  else if (hideHierarchyTree.value) {
    splitterModel.value = 0
  }
  else if (optionsStore.getOptions.treeWidth && !hideHierarchyTree.value) {
    splitterModel.value = optionsStore.getOptions.treeWidth
  }
}

/**
 * React to changes on the options store
 */
watch(() => optionsStore.getOptions, () => {
  const options = optionsStore.getOptions
  hideHierarchyTree.value = options.hideHierarchyTree

  legacyFieldsCheck018.value = options.legacyFieldsCheck018

  // @ts-ignore
  pre017check.value = options.pre017check

  resizeTreeWrapper()
}, { immediate: true, deep: true })

watch(limiterWidth, () => {
  resizeTreeWrapper()
})

watch(() => floatingWindowsStore.getDocumentPreviewVisible, () => {
  resizeTreeWrapper()
})

/****************************************************************/
// OPTTION UPDATER
/****************************************************************/

/**
 * Debounce timer to prevent infinite dragging
 */
let pullTimer = null as any

/**
 * Snapshot of the current settings in the store for further modification
 */
let optionsSnapShot = {} as OptionsStateInteface

function openLegacyDocuments () {
  const legacyDocs = checkForLegacyDocuments()
  legacyDocs.forEach(doc => {
    const dataPass = {
      doc: doc,
      treeAction: false
    }

    // @ts-ignore
    openedDocumentsStore.addDocument(dataPass)
  })

  if (legacyDocs.length > 0) {
    q.notify({
      group: false,
      type: "warning",
      timeout: 0,
      html: true,
      actions: [{ icon: "mdi-close", color: "black" }],
      message: `
      ${legacyDocs.length} documents with legacy field values found and opened in your to tabs.
      <br>
      Please go through they one by one and remap the legacy fields manually to ensure proper functioning of FA.
      <br>
      After the remapping is done, rerun the tool to re-check.
      `
    })
  }

  if (legacyDocs.length === 0) {
    const snap = extend(true, {}, optionsStore.getOptions)
    // @ts-ignore
    snap.legacyFieldsCheck018 = false
    // @ts-ignore
    optionsStore.setOptions(snap)

    q.notify({
      group: false,
      type: "positive",
      timeout: 3000,
      message: "No legacy fields with active values found!"
    })
  }
}

/**
 * React to dragging of the splitter
 */
function onChange (value: number) {
  leftDrawerOpen.value = value > 0

  optionsSnapShot = extend(true, {}, optionsStore.getOptions)

  optionsSnapShot.treeWidth = splitterModel.value

  clearTimeout(pullTimer)

  pullTimer = setTimeout(() => {
    optionsStore.setOptions(optionsSnapShot)
  }, 500)
}

/****************************************************************/
// Repair project dialog
/****************************************************************/

const repairProjectDialogTrigger = ref<string | false>(false)

function repairProjectDialogClose () {
  repairProjectDialogTrigger.value = false
}

function repairProjectAssignUID () {
  repairProjectDialogTrigger.value = generateUID()
}

</script>

<style lang="scss">

.notifClose {
  position: absolute;
  right: 20px;
  top: 14px;
}

.sideWrapper {
  height: calc(100% - 40px) !important;
}

.q-layout {
  outline: none !important;
}

.splitt {
  .q-splitter__before {
    transition: width 0.2s ease-out;
    width: 0 !important;
  }
}

.pageSplitter {
  aside {
    height: calc(100% - 55px) !important;
    margin-top: 55px !important;
  }

  &.splitterHidden {
    .q-splitter__separator {
      display: none;
    }
  }

  .q-splitter__separator {
    background-color: transparent;
    height: calc(100vh - 95px);
    bottom: 0;
    top: 95px;
    position: sticky;
  }
}

</style>
