<template>

  <span>

    <!-- Delele document dialog -->
    <deleteDocumentCheckDialog
      :dialog-trigger="deleteObjectDialogTrigger"
      :document-id="toDeleteID"
      :document-type="toDeleteType"
      @trigger-dialog-close="deleteObjectDialogClose"
    />

    <!-- Rename tag dialog -->
    <renameTagDialog
      :dialog-trigger="renameTagDialogTrigger"
      :document-id-list="toRenameTagDocumentIdList"
      :target-tag="toRenameTag"
      :all-tags="allTags"
      @trigger-dialog-close="renameTagDialogClose"
    />

    <!-- Delete tag dialog -->
    <deleteTagDialog
      :dialog-trigger="deleteTagDialogTrigger"
      :document-id-list="toDeleteTagDocumentIdList"
      :target-tag="toDeleteTag"
      @trigger-dialog-close="deleteTagDialogClose"
    />

    <!-- Delete tag dialog -->
    <massDeleteDocumentsCheckDialog
      :dialog-trigger="massDocumentDelteDialogTrigger"
      :prepicked-ids="toDeleteIDs"
      @trigger-dialog-close="massDocumentDelteDialogClose"
    />

    <div
      class="treeSearchWrapper"
      :class="{'fullWidth': disableDocumentControlBar}"
    >
      <q-input
        ref="treeFilter"
        filled
        dark
        debounce="200"
        v-model="treeFilter"
        :disable="floatingWindowsStore.getDocumentPreviewVisible !== ''"
        label="Filter document tree..."
      >
        <template v-slot:append>
          <q-icon name="mdi-text-search" />
        </template>
        <template v-slot:prepend>
          <q-icon v-if="treeFilter !== ''" name="clear" class="cursor-pointer text-secondary" @click="resetTreeFilter" />
        </template>
      </q-input>
    </div>

    <h6 class="projectTitle text-cultured" v-if="!noProjectName">
      <span>
        {{projectName}}
          <q-tooltip
            :delay="1000"
          >
            This is your currently opened project's name.
          </q-tooltip>
      </span>
    </h6>

    <q-tree
      class="objectTree q-pa-sm"
      :class="{'hasTextShadow': textShadow}"
      :nodes="hierarchicalTree"
      node-key="key"
      no-connectors
      ref="tree"
      dark
      :duration="200"
      :filter="treeFilter"
      :selected.sync="selectedTreeNode"
      :expanded.sync="expandedTreeNodes"
      no-nodes-label="Loading your project..."
      no-results-label="Nothing matches your request"
      >
      <template v-slot:default-header="prop">
        <div
          class="row items-center col-grow documentWrapper"
          :ref="`treeNode-${prop.node._id}`"
          :class="{'isMinor': prop.node.isMinor, 'isDeadTree': prop.node.isDead}"
          :style="`background-color: ${prop.node.bgColor};`"
          @click.stop.prevent="processNodeClick(prop.node)"
          @click.stop.prevent.middle="processNodeLabelMiddleClick(prop.node)"
          @mouseleave="setDocumentPreviewClose"
        >
         <documentPreview
          v-if="!preventPreviewsTree && !prop.node.isRoot && !prop.node.isTag && !prop.node.specialLabel && !prop.node.isModule"
          :document-id="prop.node._id"
          :custom-anchor="'center right'"
          :custom-self="'center left'"
          :external-close-trigger="documentPreviewClose"
        />

          <div class="documentLabel"
            :class="{'text-satin-sheen-gold-bright-imp': prop.node.isModule, 'text-weight-bold': prop.node.isModule}"
            :style="`color: ${prop.node.color};`"
           >
          <q-icon
            :style="`color: ${determineNodeColor(prop.node)}; width: 22px !important;`"
            :size="((prop.node.icon.includes('fas') || prop.node.icon.includes('fab')) ? '16px': '21px')"
            :name="prop.node.icon"
            class="q-mr-sm self-center" />
            <span v-if="prop.node.isDead" class="documentLabel__isDeadMarker">†</span>
            <span :class="{'documentLabel__content': !hideDeadCrossThrough}">
              {{ prop.node.label }}
            </span>

            <span
              class="text-grey-5 text-weight-medium q-ml-xs"
              v-if="(prop.node.isRoot || prop.node.isTag) && !disableDocumentCounts">
                <span v-html="determineCategoryString(prop.node)"/>
                <q-tooltip
                  :delay="500"
                >
                Document & Categories count: <span class="text-bold text-satin-sheen-gold-dark">{{prop.node.allCount}}</span>
                <br>
                Document count: <span class="text-bold text-satin-sheen-gold-dark">{{prop.node.documentCount}}</span>
                <br>
                Category count: <span class="text-bold text-satin-sheen-gold-dark">{{prop.node.categoryCount}}</span>
                </q-tooltip>
              </span>
            <q-badge
              class="treeBadge"
              :class="{'noChilden': prop.node.children.length === 0}"
              v-if="typeof prop.node.sticker === 'number' && !hideTreeOrderNumbers"
              color="primary"
              outline
              floating
            >
              {{prop.node.sticker}}
              <q-tooltip
                :delay="500"
              >
                Order priority of the document
              </q-tooltip>
            </q-badge>
            <div class="treeButtonGroup">
              <q-btn
                tabindex="-1"
                v-if="((prop.node.children && prop.node.children.length > 0) || !hideTreeExtraIcons) && !prop.node.isRoot && !prop.node.isTag && !hideTreeIconView && !prop.node.specialLabel && !prop.node.isModule"
                round
                flat
                dense
                color="dark"
                class="z-1 q-ml-sm treeButton treeButton--edit"
                icon="mdi-book-open-page-variant-outline"
                size="10px"
                @click.stop.prevent="openExistingDocumentRoute(prop.node)"
              >
                <q-tooltip
                  :delay="300"
                >
                Open {{ prop.node.label }}
                </q-tooltip>
              </q-btn>
              <q-btn
                tabindex="-1"
                v-if="!prop.node.isRoot && !prop.node.isTag && !hideTreeIconEdit && !prop.node.specialLabel && !prop.node.isModule"
                round
                flat
                dense
                color="dark"
                class="z-1 q-ml-sm treeButton treeButton--edit"
                icon="mdi-pencil"
                size="10px"
                @click.stop.prevent="openExistingDocumentRouteWithEdit(prop.node)"
              >
                <q-tooltip
                  :delay="300"
                >
                Edit {{ prop.node.label }}
                </q-tooltip>
              </q-btn>
              <q-btn
                tabindex="-1"
                v-if="!prop.node.specialLabel && !prop.node.isRoot && !prop.node.isTag && !hideTreeIconAddUnder && !prop.node.isModule"
                round
                flat
                dense
                color="dark"
                class="z-1 q-ml-sm treeButton treeButton--add"
                icon="mdi-file-tree"
                size="10px"
                @click.stop.prevent="processNodeNewDocumentButton(prop.node)"
                >
                <q-tooltip
                  :delay="300"
                >
                  Add a new document belonging under {{ prop.node.label }}
                </q-tooltip>
              </q-btn>
            </div>
            <q-menu
              touch-position
              context-menu
            >

              <q-list class="bg-gunmetal-light text-accent" v-if="!prop.node.isTag" dense>

                <template v-if="prop.node.isRoot || prop.node.children.length > 0 || prop.node.isModule">
                  <q-item clickable v-close-popup @click="recursivelyExpandNodeDownwards(prop.node.key)">
                    <q-item-section>Expand all under this node</q-item-section>
                    <q-item-section avatar>
                      <q-icon name="mdi-expand-all-outline" />
                    </q-item-section>
                  </q-item>
                  <q-item clickable v-close-popup @click="collapseAllNodesForce(prop.node)">
                    <q-item-section>Collapse all under this node</q-item-section>
                    <q-item-section avatar>
                      <q-icon name="mdi-collapse-all-outline" />
                    </q-item-section>
                  </q-item>
                </template>

                <template v-if="prop.node.isRoot && !prop.node.isModule">
                  <q-separator dark />
                  <q-item clickable v-close-popup @click="addNewObjectRoute(prop.node)">
                    <q-item-section>Add new document of type: {{prop.node.label}}</q-item-section>
                    <q-item-section avatar>
                      <q-icon name="mdi-plus" />
                    </q-item-section>
                  </q-item>

                  <q-separator dark />
                  <q-item
                    clickable
                    v-close-popup
                    @click="massExportDocuments(prop.node)"
                    v-if="prop.node.children && prop.node.children.length > 1"
                    >
                    <q-item-section>Export documents belonging under this</q-item-section>
                    <q-item-section avatar>
                      <q-icon name="mdi-database-export" />
                    </q-item-section>
                  </q-item>
                  <q-item
                    clickable
                    v-close-popup
                    @click="massDeleteDocuments(prop.node)"
                    v-if="prop.node.children && prop.node.children.length > 1"
                    >
                    <q-item-section class="text-secondary"><b>Delete documents belonging under this</b></q-item-section>
                      <q-item-section avatar class="text-secondary">
                      <q-icon name="mdi-text-box-remove-outline" />
                    </q-item-section>
                  </q-item>
                </template>

                <template v-if="!prop.node.isRoot && !prop.node.isModule">
                  <q-separator dark />
                  <q-item clickable v-close-popup @click="copyName(prop.node)">
                    <q-item-section>Copy name</q-item-section>
                    <q-item-section avatar>
                      <q-icon name="mdi-text-recognition" />
                    </q-item-section>
                  </q-item>
                  <q-item clickable v-close-popup @click="copyTextColor(prop.node)">
                    <q-item-section>Copy text color</q-item-section>
                    <q-item-section avatar>
                      <q-icon name="mdi-eyedropper" />
                    </q-item-section>
                  </q-item>
                  <q-item clickable v-close-popup @click="copyBackgroundColor(prop.node)">
                    <q-item-section>Copy background color</q-item-section>
                    <q-item-section avatar>
                      <q-icon name="mdi-format-color-fill" />
                    </q-item-section>
                  </q-item>
                  <q-separator dark />
                    <q-item clickable v-close-popup @click="openExistingDocumentRoute(prop.node)">
                    <q-item-section>Open document</q-item-section>
                    <q-item-section avatar>
                      <q-icon name="mdi-book-open-page-variant-outline" />
                    </q-item-section>
                  </q-item>
                  <q-item clickable v-close-popup @click="openExistingDocumentRouteWithEdit(prop.node)">
                    <q-item-section>Edit document</q-item-section>
                    <q-item-section avatar>
                      <q-icon name="mdi-pencil" />
                    </q-item-section>
                  </q-item>
                  <q-item clickable v-close-popup @click="openDocumentPreviewPanel(prop.node._id)">
                    <q-item-section>Preview document in split-view mode</q-item-section>
                    <q-item-section avatar>
                      <q-icon name="mdi-file-search-outline" />
                    </q-item-section>
                  </q-item>
                  <q-item clickable v-close-popup @click="addNewUnderParent(prop.node)">
                    <q-item-section>Create new document with this document as parent</q-item-section>
                    <q-item-section avatar>
                      <q-icon name="mdi-file-tree" />
                    </q-item-section>
                  </q-item>
                  <q-item clickable v-close-popup @click="copyTargetDocument(prop.node)">
                    <q-item-section>Copy this document</q-item-section>
                    <q-item-section avatar>
                      <q-icon name="mdi-content-copy" />
                    </q-item-section>
                  </q-item>
                  <q-separator dark />
                  <q-item clickable v-close-popup @click="triggerExport(prop.node)">
                    <q-item-section>Export document</q-item-section>
                    <q-item-section avatar>
                      <q-icon name="mdi-database-export-outline" />
                    </q-item-section>
                  </q-item>
                  <q-item
                    clickable
                    v-close-popup
                    @click="massExportDocuments(prop.node)"
                    v-if="prop.node.children && prop.node.children.length > 0"
                    >
                    <q-item-section>Export documents belonging under this</q-item-section>
                    <q-item-section avatar>
                      <q-icon name="mdi-database-export" />
                    </q-item-section>
                  </q-item>
                  <q-separator dark />
                  <q-item clickable v-close-popup @click="deleteTabDocument(prop.node)">
                    <q-item-section class="text-secondary"><b>Delete this document</b></q-item-section>
                    <q-item-section avatar class="text-secondary">
                      <q-icon name="mdi-text-box-remove-outline" />
                    </q-item-section>
                  </q-item>

                  <q-item
                    clickable
                    v-close-popup
                    @click="massDeleteDocuments(prop.node)"
                    v-if="prop.node.children && prop.node.children.length > 0"
                    >
                    <q-item-section class="text-secondary"><b>Delete documents belonging under this</b></q-item-section>
                     <q-item-section avatar class="text-secondary">
                      <q-icon name="mdi-text-box-remove-outline" />
                    </q-item-section>
                  </q-item>
                </template>

              </q-list>

                <q-list class="bg-gunmetal-light text-accent" v-if="prop.node.isTag" dense>

                  <q-item clickable v-close-popup @click="recursivelyExpandNodeDownwards(prop.node.key, true)">
                    <q-item-section>Expand all under this node</q-item-section>
                    <q-item-section avatar>
                      <q-icon name="mdi-expand-all-outline" />
                    </q-item-section>
                  </q-item>
                  <q-item clickable v-close-popup @click="collapseAllNodesForce(prop.node)">
                    <q-item-section>Collapse all under this node</q-item-section>
                    <q-item-section avatar>
                      <q-icon name="mdi-collapse-all-outline" />
                    </q-item-section>
                  </q-item>
                  <template v-if="!prop.node.isTagWrapper">
                    <q-separator dark />
                      <q-item clickable>
                        <q-item-section>Add new document to this tag</q-item-section>
                        <q-item-section avatar>
                          <q-icon name="keyboard_arrow_right" />
                        </q-item-section>
                          <q-menu anchor="top end" self="top start">
                          <q-list class="bg-gunmetal text-accent" dense>

                            <q-item
                              v-for="newObject in newObjectList"
                              :key="newObject._id"
                              v-close-popup
                              clickable
                              active-class="bg-gunmetal-light text-cultured"
                              @click="processNodeNewUnderTag(prop.node, newObject)"
                            >
                              <q-item-section>{{newObject.specialLabel}}</q-item-section>
                              <q-item-section avatar>
                                <q-icon :name="newObject.icon" />
                              </q-item-section>
                            </q-item>

                          </q-list>
                        </q-menu>
                    </q-item>
                    <q-item clickable v-close-popup @click="renameTag(prop.node)">
                      <q-item-section>Rename tag</q-item-section>
                      <q-item-section avatar>
                        <q-icon name="mdi-tag-multiple" />
                      </q-item-section>
                    </q-item>
                     <q-item clickable v-close-popup @click="deleteTag(prop.node)">
                      <q-item-section class="text-secondary"><b>Delete tag</b></q-item-section>
                      <q-item-section avatar class="text-secondary">
                        <q-icon name="mdi-tag-off-outline" />
                      </q-item-section>
                    </q-item>
                    <q-separator dark />
                    <q-item
                      clickable
                      v-close-popup
                      @click="massExportDocuments(prop.node)"
                      v-if="prop.node.children && prop.node.children.length > 0"
                      >
                      <q-item-section>Export documents belonging under this</q-item-section>
                      <q-item-section avatar>
                        <q-icon name="mdi-database-export" />
                      </q-item-section>
                    </q-item>
                    <q-item
                    clickable
                    v-close-popup
                    @click="massDeleteDocuments(prop.node)"
                    v-if="prop.node.children && prop.node.children.length > 0"
                    >
                    <q-item-section class="text-secondary"><b>Delete documents belonging under this</b></q-item-section>
                     <q-item-section avatar class="text-secondary">
                      <q-icon name="mdi-text-box-remove-outline" />
                    </q-item-section>
                  </q-item>
                  </template>
                </q-list>
            </q-menu>
        </div>
        </div>

      </template>
    </q-tree>

      <!--
            <q-list>
              <q-separator
              color="white"
              inset
              class="q-mt-md"
            />
            <q-item
              v-ripple
              clickable
              class="q-mt-md"
              >
              <q-item-section avatar>
                <q-icon :name="menuAddNewItem.icon" />
              </q-item-section>
              <q-item-section>
                {{ menuAddNewItem.label }}
              </q-item-section>
            </q-item>

            </q-list>

      -->
  </span>

</template>

<script setup lang="ts">

interface NewObjectDocument {
  label: string
  icon: string
  order: number
  _id: string
  specialLabel: string
}

import { ref, watch } from "vue"
import { useRoute, useRouter } from "vue-router"

import type { I_ExtraDocumentFields, I_OpenedDocument, I_ShortenedDocument } from "src/interfaces/I_OpenedDocument"
import deleteDocumentCheckDialog from "src/components/dialogs/DeleteDocumentCheck.vue"
import renameTagDialog from "src/components/dialogs/RenameTag.vue"
import deleteTagDialog from "src/components/dialogs/DeleteTag.vue"
import massDeleteDocumentsCheckDialog from "src/components/dialogs/MassDeleteDocumentsCheck.vue"

import { extend, colors, uid } from "quasar"
import { tagListBuildFromBlueprints } from "src/scripts/utilities/tagListBuilder"
import { createNewWithParent } from "src/scripts/documentActions/createNewWithParent"
import { copyDocumentName, copyDocumentTextColor, copyDocumentBackgroundColor } from "src/scripts/documentActions/uniqueFieldCopy"
import { copyDocument } from "src/scripts/documentActions/copyDocument"

import { useAppStores } from "src/composables/useAppStores"
import { useDocumentHelpers } from "src/composables/useDocumentHelpers"

const route = useRoute()
const router = useRouter()

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
  retrieveFieldValue,
  findRequestedOrActiveDocument,
  addNewObjectRoute,
  openExistingDocumentRoute,
  openExistingDocumentRouteWithEdit,
  openDocumentPreviewPanel,
  determineKeyBind
} = useDocumentHelpers()

// lazy import documentPreview
import documentPreview from "src/components/DocumentPreview.vue"

/****************************************************************/
// KEYBINDS MANAGEMENT
/****************************************************************/
const treeFilterRef = ref<HTMLInputElement | null>(null)

watch(() => keybindsStore.getCurrentKeyBindData, () => {
  // Focus left tree search
  if (determineKeyBind("focusHierarchicalTree") && !dialogsStore.getDialogsState) {
    const treeFilterDOM = treeFilterRef.value as unknown as HTMLInputElement
    treeFilterDOM?.focus()
  }

  // Clear input in the left tree search
  if (determineKeyBind("clearInputHierarchicalTree") && !dialogsStore.getDialogsState) {
    resetTreeFilter()
  }
}, { deep: true })

/****************************************************************/
// GENERIC FUNCTIONALITY
/****************************************************************/

const projectName = ref("")

// created
checkProjectStatus()

watch(() => projectStore.getProjectName, () => {
  checkProjectStatus()
})

function checkProjectStatus () {
  projectName.value = projectStore.getProjectName
}

const tagsAtTop = ref(false)
const compactTags = ref(false)
const noTags = ref(false)
const noProjectName = ref(false)
const invertTreeSorting = ref(false)
const doNotcollaseTreeOptions = ref(false)
const disableDocumentControlBar = ref(false)
const textShadow = ref(false)
const disableDocumentCounts = ref(false)
const compactDocumentCount = ref(false)
const invertCategoryPosition = ref(false)
const doubleDashDocCount = ref(false)
const hideDeadCrossThrough = ref(false)
const hideTreeOrderNumbers = ref(false)
const hideTreeExtraIcons = ref(false)
const hideTreeIconAddUnder = ref(false)
const hideTreeIconEdit = ref(false)
const hideTreeIconView = ref(false)
const preventPreviewsTree = ref(true)

watch(() => optionsStore.getOptions, () => {
  const options = optionsStore.getOptions
  tagsAtTop.value = options.tagsAtTop
  compactTags.value = options.compactTags
  noTags.value = options.noTags
  noProjectName.value = options.noProjectName
  invertTreeSorting.value = options.invertTreeSorting
  doNotcollaseTreeOptions.value = options.doNotcollaseTreeOptions
  disableDocumentControlBar.value = options.disableDocumentControlBar
  textShadow.value = options.textShadow
  disableDocumentCounts.value = options.disableDocumentCounts
  compactDocumentCount.value = options.compactDocumentCount
  invertCategoryPosition.value = options.invertCategoryPosition
  doubleDashDocCount.value = options.doubleDashDocCount
  hideDeadCrossThrough.value = options.hideDeadCrossThrough
  hideTreeOrderNumbers.value = options.hideTreeOrderNumbers
  hideTreeExtraIcons.value = options.hideTreeExtraIcons
  hideTreeIconAddUnder.value = options.hideTreeIconAddUnder
  hideTreeIconEdit.value = options.hideTreeIconEdit
  hideTreeIconView.value = options.hideTreeIconView
  preventPreviewsTree.value = options.preventPreviewsTree
  buildCurrentObjectTree()
}, { immediate: true, deep: true })

/****************************************************************/
// HIERARCHICAL TREE - HELPERS AND MODELS
/****************************************************************/

watch(route, async () => {
  // Wait for animations
  await sleep(200)
  if (openedDocumentsStore.getAllDocuments.docs.length > 0) {
    const currentDoc = findRequestedOrActiveDocument() as unknown as I_OpenedDocument
    selectedTreeNode.value = currentDoc._id
  }
  else {
    selectedTreeNode.value = null
  }
}, { deep: true })

watch(() => openedDocumentsStore.getAllDocuments, (val: { treeAction: boolean, docs: I_OpenedDocument[]}) => {
  if (val.treeAction) {
    buildCurrentObjectTree()
    buildTreeExpands(val?.docs)
    lastDocsSnapShot.value = extend(true, [], val.docs)
  }
  else if (val.docs.length !== lastDocsSnapShot.value.length) {
    lastDocsSnapShot.value = extend(true, [], val.docs)
  }
}, { deep: true })

const lastDocsSnapShot = ref<I_OpenedDocument[]>([])

watch(() => allDocumentsStore.getAllDocuments, () => {
  if (!allDocumentsStore.getFirstRunState) {
    buildCurrentObjectTree()
  }
}, { deep: true })

watch(() => allDocumentsStore.getFirstRunState, (val: boolean) => {
  if (!val) {
    buildCurrentObjectTree()
  }
})

const menuAddNewItem = ref({
  icon: "mdi-plus",
  label: "Add new object type"
})

const hierarchicalTree = ref<{children: I_ShortenedDocument[], icon: string, label: string}[]>([])

const selectedTreeNode = ref<null | string>(null)

const expandedTreeNodes = ref<string[]>([])

const treeFilter = ref("")

const treeRef = ref<any>(null)

function resetTreeFilter () {
  treeFilter.value = ""
  const treeFilterDOM = treeFilterRef.value as unknown as HTMLInputElement
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  treeFilterDOM?.focus()
}

/****************************************************************/
// HIERARCHICAL TREE - CONTENT CONSTRUCTION
/****************************************************************/

function sortDocuments (input: I_ShortenedDocument[]) {
  input
    .sort((a, b) => a.label.localeCompare(b.label))
    .sort((a, b) => {
      let order1 = 0
      let order2 = 0

      if (!invertTreeSorting.value) {
        order1 = a.extraFields.find(e => e.id === "order")?.value
        order2 = b.extraFields.find(e => e.id === "order")?.value
      }
      else {
        order2 = a.extraFields.find(e => e.id === "order")?.value
        order1 = b.extraFields.find(e => e.id === "order")?.value
      }

      if (order1 > order2) {
        return 1
      }
      if (order1 < order2) {
        return -1
      }

      return 0
    })

  input = [
    ...input.filter(e => typeof e.extraFields.find(e => e.id === "order")?.value === "number"),
    ...input.filter(e => typeof e.extraFields.find(e => e.id === "order")?.value !== "number")
  ]

  input.forEach((e, i) => {
    if (e.children.length > 0) {
      input[i].children = sortDocuments(input[i].children)
    }
  })

  return input
}

function buildTreeHierarchy (input: I_ShortenedDocument[]) {
  const map: number[] = []
  let node
  const roots = []
  let i

  for (i = 0; i < input.length; i += 1) {
    map[input[i]._id] = i
  }

  for (i = 0; i < input.length; i += 1) {
    node = input[i]
    if (node.parentDoc !== false) {
      if (input[map[node.parentDoc]]) {
        input[map[node.parentDoc]].children.push(node)
      }
      else {
        roots.push(node)
      }
    }
    else {
      roots.push(node)
    }
  }

  const sortedRoots = sortDocuments(roots)

  return sortedRoots
}

function mapImportantExtraFields (extraFields: I_ExtraDocumentFields[]) {
  const impotantFieldIDList: string[] = [
    "name",
    "parentDoc",
    "documentColor",
    "documentBackgroundColor",
    "finishedSwitch",
    "minorSwitch",
    "deadSwitch",
    "categorySwitch",
    "order",
    "tags",
    "otherNames"
  ]
  extraFields = extraFields.filter(field => {
    return impotantFieldIDList.includes(field.id)
  })
  return extraFields
}

const newObjectList = ref<NewObjectDocument[]>([])

watch(() => projectStore.getProjectLoadedStatus, () => {
  if (projectStore.getProjectLoadedStatus) {
    buildCurrentObjectTree()
  }
})

function buildCurrentObjectTree () {
  if (!projectStore.getProjectLoadedStatus) {
    return
  }

  hierarchicalTree.value = []

  const moduleCategories: {
    label: string
    maxOrder: number
  }[] = []

  const allBlueprings = blueprintsStore.getAllBlueprints
  let treeObject: any[] = []

  let allTreeDocuments: I_ShortenedDocument[] = []

  // @ts-ignore
  newObjectList.value = blueprintsStore.getAllBlueprints.map(blueprint => {
    return {
      label: blueprint.namePlural,
      icon: blueprint.icon,
      order: blueprint.order,
      _id: blueprint._id,
      specialLabel: blueprint.nameSingular
    }
  }).sort((a, b) => {
    if (a.order < b.order) {
      return 1
    }

    if (a.order > b.order) {
      return -1
    }
    return 0
  })

  for (const blueprint of allBlueprings) {
    const allDocuments = allDocumentsStore.getDocumentsByType(blueprint._id)
    let allDocumentsRows: I_ShortenedDocument[] = []

    if (allDocuments && allDocuments.docs) {
      allDocumentsRows = allDocuments.docs
        .map((doc) => {
          const parentDocID = doc.extraFields.find(e => e.id === "parentDoc")?.value.value as unknown as {_id: string}
          const color = doc.extraFields.find(e => e.id === "documentColor")?.value as unknown as string
          const bgColor = doc.extraFields.find(e => e.id === "documentBackgroundColor")?.value as unknown as string

          const isCategory = doc.extraFields.find(e => e.id === "categorySwitch")?.value as unknown as boolean
          const isMinor = doc.extraFields.find(e => e.id === "minorSwitch")?.value as unknown as boolean
          const isDead = doc.extraFields.find(e => e.id === "deadSwitch")?.value as unknown as boolean

          return {
            label: doc.extraFields.find(e => e.id === "name")?.value,
            icon: (isCategory) ? "fas fa-folder-open" : doc.icon,
            isCategory: !!(isCategory),
            isMinor: isMinor,
            isDead: isDead,
            sticker: doc.extraFields.find(e => e.id === "order")?.value,
            parentDoc: (parentDocID) ? parentDocID._id : false,
            handler: openExistingDocumentRoute,
            expandable: true,
            color: color,
            bgColor: bgColor,
            type: doc.type,
            children: [],
            hasEdits: false,
            isNew: false,
            url: doc.url,
            extraFields: (doc?.extraFields) ? mapImportantExtraFields(doc.extraFields) : [],
            _id: doc._id,
            key: doc._id
          } as I_ShortenedDocument
        })
    }
    const documentCount = allDocumentsRows.filter(e => !e.isCategory).length
    const categoryCount = allDocumentsRows.filter(e => e.isCategory).length
    const allCount = allDocumentsRows.length

    // @ts-ignore
    allTreeDocuments = [...allTreeDocuments, ...extend(true, [], allDocumentsRows)]

    const hierarchicalTreeContent = buildTreeHierarchy(allDocumentsRows)

    const treeRow = {
      label: blueprint.namePlural,
      icon: blueprint.icon,
      order: blueprint.order,
      _id: blueprint._id,
      key: blueprint._id,
      handler: addNewObjectRoute,
      specialLabel: blueprint.nameSingular.toLowerCase(),
      isRoot: true,
      cat: blueprint.category,
      allCount: allCount,
      documentCount: documentCount,
      categoryCount: categoryCount,
      children: [
        ...hierarchicalTreeContent,
        {
          label: `Add new ${blueprint.nameSingular.toLowerCase()}`,
          icon: "mdi-plus",
          handler: addNewObjectRoute,
          children: false,
          key: `${blueprint._id}_add`,
          _id: blueprint._id,
          specialLabel: blueprint.nameSingular.toLowerCase()

        }
      ]
    }

    const matchedCategoryIndex = moduleCategories.findIndex(e => e.label === blueprint.category)

    if (matchedCategoryIndex < 0) {
      moduleCategories.push({
        label: blueprint.category,
        maxOrder: blueprint.order
      })
    }
    else if (moduleCategories[matchedCategoryIndex].maxOrder < blueprint.order) {
      moduleCategories[matchedCategoryIndex].maxOrder = blueprint.order
    }

    treeObject.push(treeRow)
  }

  treeObject.sort((a, b) => {
    if (a.order < b.order) {
      return 1
    }

    if (a.order > b.order) {
      return -1
    }
    return 0
  })

  moduleCategories.sort((a, b) => {
    if (a.maxOrder < b.maxOrder) {
      return 1
    }

    if (a.maxOrder > b.maxOrder) {
      return -1
    }
    return 0
  })

  if (!noTags.value) {
    const tagList = tagListBuildFromBlueprints(allDocumentsStore.getAllDocuments.docs)

    let allTagsCount = 0
    let allTagsCategories = 0
    let allTagsDocuments = 0

    allTags.value = tagList

    let tagNodeList = tagList.map((tag: string) => {
      const tagDocs = allTreeDocuments
        .filter(doc => {
          const docTags = doc.extraFields.find(e => e.id === "tags")?.value as unknown as string[]
          return (docTags && docTags.includes(tag))
        })
        .map((doc: I_ShortenedDocument) => {
        // @ts-ignore
          doc.key = `${tag}${doc._id}`
          return doc
        })
        .sort((a, b) => a.label.localeCompare(b.label))

      const documentCount = tagDocs.filter(e => !e.isCategory).length
      const categoryCount = tagDocs.filter(e => e.isCategory).length
      const allCount = tagDocs.length

      allTagsCount += allCount
      allTagsCategories += categoryCount
      allTagsDocuments += documentCount

      return {
        label: `${tag}`,
        icon: "mdi-tag",
        _id: `tag-${tag}`,
        key: `tag-${tag}`,
        allCount: allCount,
        documentCount: documentCount,
        categoryCount: categoryCount,
        isRoot: !compactTags.value,
        isTag: true,
        children: sortDocuments(tagDocs)
      }
    })

    if (compactTags.value && tagNodeList.length > 0) {
      tagNodeList = [
        {
          label: "Tags",
          icon: "mdi-tag",
          _id: "tagsList",
          key: "tagList",
          isRoot: true,
          allCount: allTagsCount,
          documentCount: allTagsDocuments,
          categoryCount: allTagsCategories,
          isTag: true,
          isTagWrapper: true,
          // @ts-ignore
          children: tagNodeList.map(e => {
            e.isRoot = false
            return e
          })
        }
      ]
    }

    treeObject = [...tagNodeList, ...treeObject]
  }

  treeObject = [
    ...(tagsAtTop.value) ? treeObject.filter(branch => branch.isTag) : [],
    ...moduleCategories.map(cat => {
      return {
        label: cat.label,
        icon: "mdi-database",
        _id: `module-${cat.label}`,
        key: `module-${cat.label}`,
        isModule: true,
        // @ts-ignore
        children: treeObject.filter(e => e.cat === cat.label)
      }
    }),
    ...(tagsAtTop.value) ? [] : treeObject.filter(branch => branch.isTag)
  ]

  if (firstTimeRender.value && moduleCategories.length > 0) {
    expandedTreeNodes.value = [...new Set([
      ...expandedTreeNodes.value,
      ...moduleCategories.map(e => `module-${e.label}`)
    ])]

    firstTimeRender.value = false
  }

  treeObject.forEach(cat => recursivelyFreezeChildren(cat.children))
  // @ts-ignore
  hierarchicalTree.value = treeObject
}

const firstTimeRender = ref(true)

function recursivelyFreezeChildren (children: {children: []}) {
  Object.freeze(children)
  if (children.children) {
    // @ts-ignore
    recursivelyFreezeChildren(children.children)
  }
}

function processNodeNewDocumentButton (node: {
  key: string
  _id: string
  children: []
  type: string
  isRoot: boolean
  specialLabel: string|boolean
}) {
  if (node.isRoot) {
    // @ts-ignore
    addNewObjectRoute(node)
  }
  else {
    const routeObject = {
      _id: node.type,
      parent: node._id
    }
    // @ts-ignore
    addNewObjectRoute(routeObject)
  }
}

function processNodeNewUnderTag (node: {
  key: string
  _id: string
  children: []
  type: string
  isRoot: boolean
  label: string
  specialLabel: string|boolean
}, documentType: {_id: string}) {
  const routeObject = {
    _id: documentType._id,
    tag: node.label
  }

  // @ts-ignore
  addNewObjectRoute(routeObject)
}

function buildTreeExpands (newDocs: I_OpenedDocument[]) {
  const expandIDs: string[] = []

  let newDocsSnapshot: I_OpenedDocument[] = extend(true, [], newDocs)

  newDocsSnapshot.forEach((s, index) => {
    const oldParentDoc = lastDocsSnapShot.value.find(doc => doc._id === s._id)
    if (!oldParentDoc) {
      return false
    }

    const oldParentDocField = retrieveFieldValue(oldParentDoc, "parentDoc")
    // @ts-ignore
    const oldParentDocID = (oldParentDocField?.value) ? oldParentDocField.value.value : ""

    const newParentDocField = retrieveFieldValue(s, "parentDoc")

    // @ts-ignore
    const newParentDocID = (newParentDocField?.value) ? newParentDocField.value.value : ""
    if ((newParentDocID !== oldParentDocID) || (newParentDocID && oldParentDoc.isNew)) {
      expandIDs.push(newParentDocID)
    }
  })

  newDocsSnapshot.forEach(s => {
    const newParentDocField = retrieveFieldValue(s, "parentDoc")
    const oldParentDoc = lastDocsSnapShot.value.find(doc => doc._id === s._id)
    // @ts-ignore
    const oldParentDocField = retrieveFieldValue(oldParentDoc, "parentDoc")

    // @ts-ignore
    const oldParentDocID = (oldParentDocField?.value) ? oldParentDocField.value.value : false

    // @ts-ignore
    const newParentDocID = (newParentDocField?.value) ? newParentDocField.value.value : false

    if (!newParentDocID && oldParentDocID !== newParentDocID) {
      expandIDs.push(s.type)
    }
  })

  // @ts-ignore
  newDocsSnapshot = null

  expandIDs.forEach(s => {
    recursivelyExpandNodeUpwards(s)
  })
}

function recursivelyExpandNodeUpwards (nodeID: string) {
  const treeDOM = treeRef.value as unknown as {
    setExpanded: (key:string, state: boolean)=> void
    getNodeByKey: (key:string)=> void
  }

  // @ts-ignore
  expandedTreeNodes.value = [...new Set([
    ...expandedTreeNodes.value,
    nodeID
  ])]

  const currentTreeNode = (treeDOM?.getNodeByKey(nodeID)) as unknown as {parentDoc: string, type: string}

  if (currentTreeNode?.parentDoc) {
    recursivelyExpandNodeUpwards(currentTreeNode.parentDoc)
  }
  else if (currentTreeNode?.type) {
    // @ts-ignore
    expandedTreeNodes.value = [...new Set([
      ...expandedTreeNodes.value,
      currentTreeNode.type
    ])]
  }
}

function recursivelyExpandNodeDownwards (nodeID: string, tagParent = false) {
  const treeDOM = treeRef.value as unknown as {
    setExpanded: (key:string, state: boolean)=> void
    getNodeByKey: (key:string)=> void
  }

  // @ts-ignore
  expandedTreeNodes.value = [...new Set([
    ...expandedTreeNodes.value,
    nodeID
  ])]

  const currentTreeNode = (treeDOM?.getNodeByKey(nodeID)) as unknown as {children: any[], type: string, isTag: boolean}

  if (currentTreeNode?.children && currentTreeNode?.children.length > 0) {
    for (const child of currentTreeNode.children) {
      recursivelyExpandNodeDownwards(child.key, tagParent)
    }
  }
  else if (currentTreeNode?.type && !tagParent) {
    // @ts-ignore
    expandedTreeNodes.value = [...new Set([
      ...expandedTreeNodes.value,
      currentTreeNode.type
    ])]
  }
}

function processNodeLabelMiddleClick (node: {
  key: string
  _id: string
  children: []
  type: string
  isRoot: boolean
  isTag: boolean
  isModule: boolean
  specialLabel: string|boolean
}) {
  if ((node.isRoot && node.isTag) || node.isModule) {
    return
  }

  if (!node.specialLabel && !node.isRoot) {
    // @ts-ignore
    openExistingDocumentRoute(node)
  }
  else {
    addNewObjectRoute(node)
  }
}

function processNodeClick (node: {
  key: string
  children: []
  specialLabel: string|boolean
}) {
  if (node.children.length > 0) {
    expandeCollapseNode(node)
  }
  else if (!node.specialLabel) {
    // @ts-ignore
    openExistingDocumentRoute(node)
  }
  else {
    // @ts-ignore
    addNewObjectRoute(node)
  }
}

function expandeCollapseNode (node: {key: string, children: []}) {
  const treeDOM = treeRef.value as unknown as {
    setExpanded: (key:string, state: boolean)=> void,
    isExpanded: (key:string)=> boolean
  }

  const isExpanded = treeDOM?.isExpanded(node.key)

  if (isExpanded) {
    collapseAllNodes(node)
  }
  else {
    treeDOM?.setExpanded(node.key, true)
  }
}

function determineNodeColor (node: {color: string, isTag: boolean, isRoot: boolean, isModule: boolean}) {
  // @ts-ignore
  return (node?.isTag || node?.isModule) ? colors.getBrand("primary") : node.color
}

function collapseAllNodes (node: {key: string, children: []}) {
  if (node.children && !doNotcollaseTreeOptions.value) {
    for (const child of node.children) {
      if (expandedTreeNodes.value.includes(node.key)) {
        collapseAllNodes(child)
      }
    }
  }
  if (expandedTreeNodes.value.includes(node.key)) {
    expandedTreeNodes.value = expandedTreeNodes.value.filter(n => n !== node.key)
  }
}

function collapseAllNodesForce (node: {key: string, children: []}) {
  if (node.children) {
    for (const child of node.children) {
      if (expandedTreeNodes.value.includes(node.key)) {
        collapseAllNodesForce(child)
      }
    }
  }
  if (expandedTreeNodes.value.includes(node.key)) {
    expandedTreeNodes.value = expandedTreeNodes.value.filter(n => n !== node.key)
  }
}

function determineCategoryString (node: {
  documentCount: string
  categoryCount: string
}) {
  let extraDivider = ""
  if (doubleDashDocCount.value) {
    extraDivider = "|"
  }

  if (compactDocumentCount.value) {
    return `(<span class="docCount">${node.documentCount}</span>)`
  }
  if (invertCategoryPosition.value) {
    return `(<span class="catCount">${node.categoryCount}</span>&nbsp;|${extraDivider}&nbsp;<span class="docCount">${node.documentCount}</span>)`
  }
  else {
    return `(<span class="docCount">${node.documentCount}</span>&nbsp;|${extraDivider}&nbsp;<span class="catCount">${node.categoryCount}</span>)`
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
  documentPass.value = extend(true, {}, allDocumentsStore.getDocument(currentDoc._id))

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

function triggerExport (node: {_id: string}) {
  dialogsStore.setExportDialogState([node._id])
}

function massExportDocuments (node: { children: { _id: string}[]}) {
  /*eslint-disable */
  // @ts-ignore
  const exExportIDs: string[] = (flatten(node.children))
    .filter((e: {extraFields?: string}) => e?.extraFields)
    .map((e: {_id: string}) => e._id)
  /* eslint-enable */

  dialogsStore.setExportDialogState(exExportIDs)
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

const toDeleteID = ref("")
const toDeleteType = ref("")

function deleteTabDocument (targetDocument: I_OpenedDocument) {
  toDeleteID.value = targetDocument._id
  toDeleteType.value = targetDocument.type
  deleteObjectAssignUID()
}

/****************************************************************/
// Rename tag dialog
/****************************************************************/

const renameTagDialogTrigger = ref<string | false>(false)
function renameTagDialogClose () {
  renameTagDialogTrigger.value = false
}

function renameTagAssignUID () {
  renameTagDialogTrigger.value = generateUID()
}

function renameTag (node: { label: string, children: { _id: string}[]}) {
  toRenameTag.value = node.label
  toRenameTagDocumentIdList.value = node.children.map(child => child._id)

  renameTagAssignUID()
}

const toRenameTag = ref("")
const toRenameTagDocumentIdList = ref<string[]>([])

/****************************************************************/
// Delete tag dialog
/****************************************************************/

const deleteTagDialogTrigger = ref<string | false>(false)
function deleteTagDialogClose () {
  deleteTagDialogTrigger.value = false
}

function deleteTagAssignUID () {
  deleteTagDialogTrigger.value = generateUID()
}

function deleteTag (node: { label: string, children: { _id: string}[]}) {
  toDeleteTag.value = node.label
  toDeleteTagDocumentIdList.value = node.children.map(child => child._id)

  deleteTagAssignUID()
}

const toDeleteTag = ref("")
const toDeleteTagDocumentIdList = ref<string[]>([])

function setDocumentPreviewClose () {
  documentPreviewClose.value = uid()
}

const documentPreviewClose = ref("")

const allTags = ref<string[]>([])

/****************************************************************/
// Mass delete documents dialog
/****************************************************************/

const massDocumentDelteDialogTrigger = ref<string | false>(false)
function massDocumentDelteDialogClose () {
  massDocumentDelteDialogTrigger.value = false
}

function massDocumentDelteDialogAssignUID () {
  massDocumentDelteDialogTrigger.value = generateUID()
}

function flatten (data: { children: { _id: string}[]}) {
  /*eslint-disable */
  // @ts-ignore
  return data.reduce((r, { children, ...rest }) => {
    r.push(rest)
    if (children) {
      // @ts-ignore
      r.push(...flatten(children))
    }
    return r
  }, [])
  /* eslint-enable */
}

const toDeleteIDs = ref<string[]>([])

function massDeleteDocuments (node: { children: { _id: string}[]}) {
  /*eslint-disable */
  // @ts-ignore
  const toDeleteDocumentIDs: string[] = (flatten(node.children))
    .filter((e: {extraFields?: string}) => e?.extraFields)
    .map((e: {_id: string}) => e._id)
  /* eslint-enable */

  toDeleteIDs.value = toDeleteDocumentIDs
  massDocumentDelteDialogAssignUID()
}
</script>

<style lang="scss">

.projectTitle {
  margin: 0 0 -5px 0;
  padding: 10px 10px 0;
}

.objectTree {
  &.hasTextShadow {
    .documentLabel {
      font-weight: 500;
      $shadowColorOutline: #000;
      $shadowColorSurround: #000;

      filter: drop-shadow(0 0 1px #000);
      text-shadow:
        //-2px -2px 0 $shadowColorSurround,
        //2px -2px 0 $shadowColorSurround,
        // -2px 2px 0 $shadowColorSurround,
        //2px 2px 0 $shadowColorSurround,
        -1px -1px 0 $shadowColorOutline,
        1px -1px 0 $shadowColorOutline,
        -1px 1px 0 $shadowColorOutline,
        1px 1px 0 $shadowColorOutline;
    }
  }

  .catCount {
    color: var(--q-color-accent);
  }

  .docCount {
    color: var(--q-color-primary);
  }

  > .q-tree__node {
    padding-left: 0 !important;
  }

  .q-tree__children {
    padding-left: 5px;
  }

  .q-tree__arrow {
    margin-right: 0;
    padding: 4px 4px 4px 0;
    position: absolute;
    pointer-events: none;
  }

  .q-tree__node {
    padding: 0 0 0 22px;
  }

  .q-tree__node-header {
    padding: 0;

    &:focus {
      > .q-focus-helper {
        opacity: 0 !important;
      }
    }

    &:hover {
      > .q-focus-helper {
        opacity: 0.15 !important;
      }
    }

    &.q-tree__node--selected {
      > .q-focus-helper {
        opacity: 0.22 !important;
      }
    }
  }

  .documentWrapper {
    border-radius: 3px;

    &.isMinor {
      filter: grayscale(100) brightness(0.7);
    }

    &.isDeadTree {
      .documentLabel__content {
        text-decoration: line-through;
        text-decoration-color: #fff;
      }

      .documentLabel__isDeadMarker {
        margin-right: 5px;
        font-weight: 600;
      }
    }
  }

  .documentLabel {
    width: 100%;
    display: flex;
    justify-content: space-between;
    padding: 4px 4px 4px 25px;
    align-items: center;

    &__content {
      word-break: break-word;
    }
  }

  .treeButtonGroup {
    flex-grow: 0;
    flex-shrink: 0;
    display: flex;
    height: fit-content;
    margin-left: auto;
    align-self: center;
  }
}

.treeBadge {
  left: inherit;
  right: calc(100% + 3px);
  padding: 3px 2px;
  border: none;
  background: rgba($primary, 0.15);
  top: 50%;
  transform: translateY(-50%);
  min-width: 24px;
  justify-content: center;

  &.noChilden {
    right: calc(100% + 3px);
  }
}

.treeSearchWrapper {
  top: -55px;
  left: 0;
  position: fixed;
  width: 375px;
  z-index: 555;
  background-color: $dark;

  &.fullWidth {
    width: 100%;
  }

  > div {
    width: 100%;
  }

  label {
    background-color: $dark;

    &.q-field--focused {
      width: 100vw;
      max-width: inherit;
    }
  }
}

.treeButton {
  &--add {
    .q-icon {
      font-size: 20px;
      color: $primary;
    }
  }

  &--edit {
    .q-icon {
      font-size: 14px;
      color: #fff;
    }
  }
}

body.body--dark {
  .objectTree {
    .documentLabel {
      color: #dcdcdc;
    }
  }

  .projectTitle {
    color: #dcdcdc;
  }
}
</style>
