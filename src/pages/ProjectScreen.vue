<template>
  <q-page
  class="column items-center justify-center no-wrap projectScreen"
  :class="{
    'q-pb-xl q-pl-xl q-pr-xl': disableDocumentControlBar,
    'q-pa-xl': !disableDocumentControlBar,
    }"
  >
      <!-- New document dialog -->
      <newDocumentDialog
        :dialog-trigger="newObjectDialogTrigger"
        @trigger-dialog-close="newObjectDialogClose"
      />

      <!-- Delele document dialog -->
      <deleteDocumentCheckDialog
        :dialog-trigger="deleteObjectDialogTrigger"
        :document-id="toDeleteID"
        :document-type="toDeleteType"
        @trigger-dialog-close="deleteObjectDialogClose"
      />

      <div class="col-12">
        <h5 class="mainProjectSubTitle">Project overview for </h5>
      </div>
      <div class="col-12">
        <h2 class="mainProjectTitle"> {{projectName}}</h2>
      </div>
      <div class="hintWrapper" v-if="!hideTooltipsProject && allDocuments > 0">

        <div v-if="hidePlushes">
          <q-icon name="mdi-help" size="30px" class="q-mr-md" />
        </div>

        <div class="mascotWrapper" v-if="!hidePlushes">
          <q-img
          :src="plusheForm"
          style="max-width: 135px; height: 100%;"
          contain
        />
        </div>
        <div>
          <div class="text-subtitle1 text-dark text-bold text-left">
            Did you know?
          </div>
          <div class="text-weight-medium text-dark text-left">
            {{tipTrickMessage}}
          </div>
        </div>

      </div>

    <div class="projectContentWrapper">
      <div
        class="documentGraphParent"
        :class="{'-fullsize': !graphDataShowing}"
        >
        <q-card
          dark
          class="documentGraphWrapper"
          :class="{'-fullsize': !graphDataShowing}"
        >
          <transition
            enter-active-class="animated fadeIn"
            leave-active-class="animated fadeOut"
            :duration="600"
          >
            <q-card-section
              v-show="!graphDataLoaded"
              transition-show="scale"
              transition-hide="scale"
              style="height: 500px;"
              class="flex justify-center flex-center"
            >
              <q-spinner-gears
                color="primary"
                size="160px"
              />
            </q-card-section>
          </transition>

          <transition
            enter-active-class="animated fadeIn"
            leave-active-class="animated fadeOut"
            :duration="600"
          >
            <q-card-section
              v-show="graphDataShowing && allDocuments === 0"
              transition-show="scale"
              transition-hide="scale"
              style="height: 500px;"
              class="flex justify-center flex-center column"
            >
            <div class="row justify-center flex-center">
              <div class="col-12 q-mb-xl">
                <h6 class="q-my-xs text-center">Welcome to your new project! Feel free to look around or...</h6>
              </div>
              <div class="col-12 q-mt-md q-mb-xl text-center">
                <q-btn
                  color="primary"
                  size="lg"
                  outline
                  class="q-px-xl q-py-xs"
                  @click="newObjectAssignUID"
                >
                Create your first document!
                </q-btn>
              </div>
            </div>

            </q-card-section>
          </transition>

          <transition
            enter-active-class="animated fadeIn"
            leave-active-class="animated fadeOut"
            appear
            :duration="600"
          >
            <q-card-section
              v-show="graphDataShowing && allDocuments > 0"
              transition-show="scale"
              transition-hide="scale"
            >
              <h5 class="q-px-xl q-my-lg">
                Document distribution - <span class="text-bold text-primary">{{allDocuments}}</span> total
              </h5>
              <apexchart v-if="graphDataShowing" type="bar" height="350" width="900" :options="chartOptions" :series="series" />
            </q-card-section>
          </transition>

        </q-card>
      </div>

      <div class="lastOpenedList" v-if="allDocuments > 0 && graphDataShowing">
        <q-card
          dark
        >
          <transition
            enter-active-class="animated fadeIn"
            leave-active-class="animated fadeOut"
            :duration="600"
            >
              <q-card-section
                v-show="!graphDataLoaded"
                transition-show="scale"
                transition-hide="scale"
                style="height: 500px;"
                class="flex justify-center flex-center"
              >
                <q-spinner-gears
                  color="primary"
                  size="160px"
                />
              </q-card-section>
            </transition>

          <transition
            enter-active-class="animated fadeIn"
            leave-active-class="animated fadeOut"
            :duration="600"
            >
            <q-card-section
              v-show="graphDataShowing"
            >

              <h5 class="q-px-md q-mt-lg q-mb-xs">Last opened</h5>

              <q-list
                v-if="lastOpenedDocuments.length > 0"
                class="q-pa-md lastOpenedListInner"
                >
                <div
                  v-for="single in lastOpenedDocuments"
                  :key="single._id"
                  class="lastOpenedItem"
                >

                <q-item
                  clickable
                  class="text-accent q-px-sm"
                  @mouseleave="setDocumentPreviewClose"
                  :to="single.url"
                >
                  <documentPreview
                    v-if="!preventPreviewsDocuments"
                    :custom-anchor="'center left'"
                    :custom-self="'center right'"
                    :document-id="single._id"
                    :external-close-trigger="documentPreviewClose"
                  />
                  <q-item-section avatar class="q-px-sm">
                    <q-icon
                      :size="((single.icon.includes('fas') || single.icon.includes('fab')) ? '16px': '21px')"
                      :name="(single.isCategory) ? 'fas fa-folder-open' : single.icon"
                    />
                  </q-item-section>
                  <q-item-section
                    >
                      <span class="text-weight-medium">
                        <span class="isDeadIndicator" v-if="single.isDead">
                          †
                        </span>
                        <span :class="{'isDead': (single.isDead && !hideDeadCrossThrough)}">
                            {{stripTags(single.label)}}
                        </span>
                      </span>
                  </q-item-section>
                  <q-menu
                    touch-position
                    context-menu
                    auto-close
                    separate-close-popup
                  >

                    <q-list class="bg-gunmetal-light text-accent">

                      <template>
                        <q-item clickable @click="copyName(single)">
                          <q-item-section>Copy name</q-item-section>
                          <q-item-section avatar>
                            <q-icon name="mdi-text-recognition" />
                          </q-item-section>
                        </q-item>
                        <q-item clickable @click="copyTextColor(single)">
                          <q-item-section>Copy text color</q-item-section>
                          <q-item-section avatar>
                            <q-icon name="mdi-eyedropper" />
                          </q-item-section>
                        </q-item>
                        <q-item clickable @click="copyBackgroundColor(single)">
                          <q-item-section>Copy background color</q-item-section>
                          <q-item-section avatar>
                            <q-icon name="mdi-format-color-fill" />
                          </q-item-section>
                        </q-item>
                        <q-separator dark />
                        <q-item clickable @click="openExistingInput(single)">
                          <q-item-section>Open document</q-item-section>
                          <q-item-section avatar>
                            <q-icon name="mdi-book-open-page-variant-outline" />
                          </q-item-section>
                        </q-item>
                        <q-item clickable @click="editExistingInput(single)">
                          <q-item-section>Edit document</q-item-section>
                          <q-item-section avatar>
                            <q-icon name="mdi-pencil" />
                          </q-item-section>
                        </q-item>
                        <q-item clickable @click="openDocumentPreviewPanel(single._id)">
                          <q-item-section>Preview document in split-view mode</q-item-section>
                          <q-item-section avatar>
                            <q-icon name="mdi-file-search-outline" />
                          </q-item-section>
                        </q-item>
                        <q-item clickable @click="addNewUnderParent(single)">
                          <q-item-section>Create new document with this document as parent</q-item-section>
                          <q-item-section avatar>
                            <q-icon color="primary" name="mdi-file-tree" />
                          </q-item-section>
                        </q-item>
                        <q-item clickable @click="copyTargetDocument(single)">
                          <q-item-section>Copy this document</q-item-section>
                          <q-item-section avatar>
                            <q-icon color="primary" name="mdi-content-copy" />
                          </q-item-section>
                        </q-item>
                        <q-separator dark />
                        <q-item clickable v-close-popup @click="triggerExport(single)">
                          <q-item-section>Export document</q-item-section>
                          <q-item-section avatar>
                            <q-icon name="mdi-database-export-outline" />
                          </q-item-section>
                        </q-item>
                        <q-separator dark />
                        <q-item clickable v-close-popup @click="deleteTabDocument(single)">
                          <q-item-section class="text-secondary"><b>Delete this document</b></q-item-section>
                          <q-item-section avatar class="text-secondary">
                            <q-icon name="mdi-text-box-remove-outline" />
                          </q-item-section>
                        </q-item>
                      </template>
                    </q-list>

                  </q-menu>

                </q-item>

                <q-separator dark />

                </div>

              </q-list>
            </q-card-section>
          </transition>

        </q-card>

      </div>
    </div>

  </q-page>
</template>

<script setup lang="ts">
import { ref, watch } from "vue"
import { Loading, colors, uid, extend, getCssVar } from "quasar"
import { useRouter } from "vue-router"
import newDocumentDialog from "src/components/dialogs/NewDocument.vue"
import { retrieveLastOpenedDocuments } from "src/scripts/projectManagement/projectManagent"
import { tipsTricks } from "src/scripts/utilities/tipsTricks"
import { summonAllPlusheForms } from "src/scripts/utilities/plusheMascot"
import type { I_ShortenedDocument } from "src/interfaces/I_OpenedDocument"
import { copyDocumentBackgroundColor, copyDocumentName, copyDocumentTextColor } from "src/scripts/documentActions/uniqueFieldCopy"
import { copyDocument } from "src/scripts/documentActions/copyDocument"
import { createNewWithParent } from "src/scripts/documentActions/createNewWithParent"
import deleteDocumentCheckDialog from "src/components/dialogs/DeleteDocumentCheck.vue"
import documentPreview from "src/components/DocumentPreview.vue"
import { useAppStores } from "src/composables/useAppStores"
import { useDocumentHelpers } from "src/composables/useDocumentHelpers"

const router = useRouter()
const {
  blueprintsStore,
  openedDocumentsStore,
  allDocumentsStore,
  dialogsStore,
  optionsStore,
  projectStore
} = useAppStores()

const {
  generateUID,
  sleep,
  stripTags,
  openExistingDocumentRoute,
  openExistingDocumentRouteWithEdit,
  openDocumentPreviewPanel,
  addNewObjectRoute
} = useDocumentHelpers()

/****************************************************************/
// LOCAL SETTINGS
/****************************************************************/

const hideDeadCrossThrough = ref(false)
const preventPreviewsDocuments = ref(false)
const hidePlushes = ref(false)
const disableDocumentControlBar = ref(false)
const hideTooltipsProject = ref(false)

watch(() => optionsStore.getOptions, (options) => {
  hideTooltipsProject.value = options.hideTooltipsProject
  hidePlushes.value = options.hidePlushes
  disableDocumentControlBar.value = options.disableDocumentControlBar
  hideDeadCrossThrough.value = options.hideDeadCrossThrough
  preventPreviewsDocuments.value = options.preventPreviewsDocuments
}, { immediate: true, deep: true })

/****************************************************************/
// BASIC DATA & FUNCTIONALITY
/****************************************************************/

const projectName = ref("")
const tipTrickMessage = ref("")
const plusheForm = ref("")

/****************************************************************/
// GRAPH FUNCTIONALITY
/****************************************************************/

const allDocuments = ref(0)
const graphDataLoaded = ref(false)
const graphDataShowing = ref(false)

/**
 * Graph series data
 */
const series = ref([{
  name: "Documents",
  data: [] as number[]
}])

/**
 * Empty chart options
 * This needs to load after load, otherwise the graph doesn't reload properly if the settings for dark/light mode change
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const chartOptions = ref({} as any)

// Setup equivalent of created()
projectName.value = projectStore.getProjectName
Loading.hide()
tipTrickMessage.value = tipsTricks[Math.floor(Math.random() * tipsTricks.length)]
plusheForm.value = summonAllPlusheForms[Math.floor(Math.random() * summonAllPlusheForms.length)]

if (projectStore.getProjectLoadedStatus) {
  loadGraphData().catch(e => console.log(e))
  loadLastOpenedList().catch(e => console.log(e))
}

watch(() => projectStore.getProjectName, (val) => {
  projectName.value = val
})

watch(() => projectStore.getProjectLoadedStatus, (val) => {
  if (val) {
    loadGraphData().catch(e => console.log(e))
    loadLastOpenedList().catch(e => console.log(e))
  }
})

/**
 * Loads up proper chart options into the object
 */
function populateChartOptions () {
  chartOptions.value = {
    colors: [getCssVar("primary")],
    animations: {
      enabled: true,
      easing: "easeinout",
      speed: 1000
    },
    grid: {
      show: false
    },
    states: {
      hover: {
        filter: {
          type: "none"
        }
      },
      active: {
        filter: {
          type: "none"
        }
      }
    },
    chart: {
      height: 350,
      type: "bar",
      toolbar: {
        show: false
      }
    },
    plotOptions: {
      bar: {
        borderRadius: 4,
        dataLabels: {
          position: "center" // top, center, bottom
        }
      }
    },
    dataLabels: {
      dropShadow: {
        enabled: true,
        top: 1,
        left: 1,
        blur: 1,
        color: "#000",
        opacity: 0.65
      },
      enabled: true,
      formatter: function (val: string) {
        return val
      },
      offsetY: 20,
      style: {
        fontSize: "14px",
        fontFamily: "Roboto, -apple-system, Helvetica Neue, Helvetica, Arial, sans-serif;",
        colors: ["#fff"]
      }
    },
    xaxis: {
      categories: [] as string[],
      position: "bottom",
      labels: {
        style: {
          fontFamily: "Roboto, -apple-system, Helvetica Neue, Helvetica, Arial, sans-serif;",
          colors: getCssVar("accent"),
          cssClass: "docCountLabel"
        }
      },
      axisBorder: {
        show: true
      },
      axisTicks: {
        show: false
      },
      tooltip: {
        enabled: false
      },
      crosshairs: {
        fill: {
          type: "gradient",
          gradient: {
            colorFrom: "transparent",
            colorTo: "transparent",
            stops: [0, 100],
            opacityFrom: 0,
            opacityTo: 0
          }
        }
      }
    },
    yaxis: {
      axisBorder: {
        show: false
      },
      tooltip: {
        enabled: false
      },
      axisTicks: {
        show: false
      },
      labels: {
        show: false,
        formatter: function (val: string) {
          return val
        },
        style: {
          fontSize: "14px",
          fontFamily: "Roboto, -apple-system, Helvetica Neue, Helvetica, Arial, sans-serif;",
          colors: "#dcdcdc"
        }
      }
    }
  }
}

/**
 * Loads graph data
 */
async function loadGraphData () {
  populateChartOptions()

  const allBlueprints = blueprintsStore.getAllBlueprints

  // Retrieve all documents
  for (const blueprint of allBlueprints) {
    const docCount = (allDocumentsStore.getDocumentsByType(blueprint._id)?.docs ?? []).length

    allDocuments.value = allDocuments.value + docCount

    series.value[0].data.push(docCount)
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    chartOptions.value.xaxis.categories.push(blueprint.namePlural)
  }
  graphDataLoaded.value = true

  await sleep(600)
  graphDataShowing.value = true
}

/****************************************************************/
// Add new document under parent
/****************************************************************/
function addNewUnderParent (currentDoc: I_ShortenedDocument) {
  createNewWithParent(currentDoc, { addNewObjectRoute })
}

watch(() => allDocumentsStore.getAllDocuments, () => {
  if (!allDocumentsStore.getFirstRunState) {
    loadLastOpenedList().catch(e => console.log(e))
  }
}, { deep: true })

/**
 * Loads last opened documents list
 */
async function loadLastOpenedList () {
  const idList = await retrieveLastOpenedDocuments(projectStore.currentProjectId)
  lastOpenedDocuments.value = idList.map(id => allDocumentsStore.getDocument(id)).filter(e => !!e) as I_ShortenedDocument[]
}

const lastOpenedDocuments = ref<I_ShortenedDocument[]>([])

function copyName (currentDoc: I_ShortenedDocument) {
  copyDocumentName(currentDoc)
}

function copyTextColor (currentDoc: I_ShortenedDocument) {
  copyDocumentTextColor(currentDoc)
}

function copyBackgroundColor (currentDoc: I_ShortenedDocument) {
  copyDocumentBackgroundColor(currentDoc)
}

const documentPass = ref<I_ShortenedDocument | null>(null)

function copyTargetDocument (currentDoc: I_ShortenedDocument) {
  documentPass.value = extend(true, {}, currentDoc)

  const blueprint = blueprintsStore.getBlueprint(documentPass.value!.type)
  const newDocument = copyDocument(documentPass.value!, generateUID(), blueprint!)

  const dataPass = {
    doc: newDocument,
    treeAction: false
  }

  openedDocumentsStore.addDocument(dataPass)
  router.push({
    path: newDocument.url
  }).catch((e: { name: string }) => {
    const errorName: string = e.name
    if (errorName === "NavigationDuplicated") {
      return
    }
    console.log(e)
  })
}

/**
 * Opens the existing document
 */
function openExistingInput (e: I_ShortenedDocument) {
  // @ts-ignore
  e = (Array.isArray(e)) ? e[0] : e
  openExistingDocumentRoute(e)
}

/**
 * Opens the existing document in edit mode
 */
function editExistingInput (e: I_ShortenedDocument) {
  // @ts-ignore
  e = (Array.isArray(e)) ? e[0] : e
  openExistingDocumentRouteWithEdit(e)
}

function triggerExport (node: { _id: string }) {
  dialogsStore.setExportDialogState([node._id])
}

const documentPreviewClose = ref("")

function setDocumentPreviewClose () {
  documentPreviewClose.value = uid()
}

/****************************************************************/
// NEW DOCUMENT DIALOG
/****************************************************************/

const newObjectDialogTrigger = ref("")

function newObjectDialogClose () {
  newObjectDialogTrigger.value = ""
}

function newObjectAssignUID () {
  newObjectDialogTrigger.value = generateUID()
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

function deleteTabDocument (targetDocument: I_ShortenedDocument) {
  toDeleteID.value = targetDocument._id
  toDeleteType.value = targetDocument.type
  deleteObjectAssignUID()
}
</script>

<style lang="scss">

.projectScreen {
  max-width: 1450px;
  margin: auto;
}

.mascotWrapper {
  height: 135px;
  width: 135px;
  margin-right: 30px;
  flex-shrink: 0;
}

.hintWrapper {
  width: 100%;
  display: flex;
  align-items: center;
  padding: 15px 20px;
  background-color: lighten(#d7ac47, 35);
  border-radius: 5px;
  margin-bottom: 30px;
  color: var(--q-color-dark);
  border: 2px solid var(--q-color-dark);
}

.mainProjectTitle {
  margin-bottom: 30px;
  color: var(--q-color-dark);
}

body.body--dark {
  .mainProjectTitle {
    color: var(--q-color-primary);
  }
}

.apexcharts-tooltip {
  display: none !important;
}

.apexcharts-canvas {
  padding-bottom: 50px;
  padding-left: 30px;
  padding-right: 30px;
  box-sizing: content-box !important;

  path {
    stroke: none !important;
  }

  svg {
    height: 425px;
    overflow: visible;
  }

  .apexcharts-series path {
    fill: var(--q-color-primary);
  }
}

.projectContentWrapper {
  width: 100%;
  display: flex;
}

.documentGraphParent {
  min-height: 525px;
  max-height: 525px;
  overflow-x: auto;
  overflow-y: hidden;
  max-width: calc(100% - 110px);
  width: 990px;
  margin: auto;

  &.-fullsize {
    width: 100%;
    max-width: 100%;
  }
}

.documentGraphWrapper {
  min-height: 525px;
  max-height: 525px;
  overflow: hidden;
  width: 990px;

  &.-fullsize {
    width: 100%;
  }
}

.lastOpenedList {
  width: 334px;
  margin-left: 30px;
  flex-grow: 0;
  flex-shrink: 0;

  > div {
    height: 100%;
  }
}

.lastOpenedListInner {
  max-height: 425px;
  overflow: auto;
}

.docCountLabel {
  font-size: 15px;
  font-weight: 500;
  letter-spacing: 0.3px;
}
</style>

<style scoped lang="scss">

.mainProjectSubTitle {
  margin-top: 40px;
  margin-bottom: 0;
  opacity: 0.8;
}

.mainProjectTitle {
  position: relative;
  margin-top: 10px;
  font-weight: 500;
}

.lastOpenedItem {
  position: relative;

  .q-item__section--avatar {
    min-width: 44px;
  }
}
</style>
