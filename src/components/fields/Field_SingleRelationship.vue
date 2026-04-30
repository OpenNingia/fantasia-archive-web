<template>
  <div v-if="!isMasterOnlyField || canEditMasterOnlyField">
    <div class="documentLabelWrapper text-weight-bolder q-mb-sm q-mt-md">
      <q-icon v-if="inputIcon" :name="inputIcon" :size="(inputIcon.includes('fas') || inputIcon.includes('fab'))? '15px': '20px'" class="documentLabelIcon"/>
      <div class="documentLabelContent">
        {{inputDataBluePrint.name}}
      </div>
      <q-icon v-if="toolTip && !disableDocumentToolTips" name="mdi-help-circle" size="16px" class="documentLabelTooltip">
         <q-tooltip :delay="500">
           <span v-html="toolTip"/>
        </q-tooltip>
      </q-icon>
      <q-icon v-if="isOneWayRelationship" name="mdi-arrow-right-bold" size="17px" class="documentLabelExtra" color="amber-14">
        <q-tooltip :delay="500" v-if="!disableDocumentToolTips">
            This is a one-way relationship. <br> Editing this value <span class="text-secondary">WILL NOT</span> have any effect on the connected document/s.
            <br>
            <br>
            Left-clicking the linked document in non-edit mode will open it in new tab and focuses on it.
            <br>
            Middle-clicking the linked document in non-edit mode will open it in new tab and not focus on it.
        </q-tooltip>
      </q-icon>
      <q-icon v-if="!isOneWayRelationship" name="mdi-arrow-left-right-bold" size="17px" class="documentLabelExtra" color="teal-14">
         <q-tooltip :delay="500" v-if="!disableDocumentToolTips">
            This is a two-way relationship. <br> Editing this value <span class="text-secondary">WILL</span> also affect the connected document/s.
            <br>
            <br>
            Left-clicking the linked document in non-edit mode will open it in new tab and focuses on it.
            <br>
            Middle-clicking the linked document in non-edit mode will open it in new tab and not focus on it.
        </q-tooltip>
      </q-icon>

    </div>

    <q-list
      v-if="!editMode && localInput"
      class="connectionList"
      dense>
      <div
        class="relationsViewList"
      >
        <div
          class="relationshipOpeningButton q-btn q-btn-item non-selectable no-outline q-btn--flat q-btn--round text-primary q-btn--actionable q-focusable q-hoverable q-btn--wrap q-btn--dense"
          @click.stop.prevent.left="openNewTab(localInput)"
          v-ripple
        >
        <span class="q-focus-helper"></span>
          <i
          style="font-size: 20px;"
          class="mdi mdi-open-in-new q-icon notranslate  text-primary"
          />
          <q-tooltip :delay="500">
            Open in new tab without leaving this one
          </q-tooltip>
        </div>

        <div
          v-if="recursive || sideDocumentPreview"
          class="relationshipChangeParent q-btn q-btn-item non-selectable no-outline q-btn--flat q-btn--round text-primary q-btn--actionable q-focusable q-hoverable q-btn--wrap q-btn--dense"
          @click.stop.prevent.left="setNewParentId(localInput._id)"
          v-ripple
        >
        <span class="q-focus-helper"></span>
          <i
          style="font-size: 20px;"
          class="mdi mdi-eye-outline q-icon notranslate  text-primary"
          />
          <q-tooltip :delay="500">
          Change preview to this document
          </q-tooltip>
        </div>

        <q-item
        clickable
        class="text-primary"
        :class="{'hasSetParentButton': recursive}"
        @mouseleave="setDocumentPreviewClose"
        >
          <q-item-section
            @click.stop.prevent.left="openExistingDocumentRoute(localInput)"
            @click.stop.prevent.middle="openNewTab(localInput)"
            >
            <span class="text-weight-medium">
              <span class="isDeadIndicator" v-if="localInput.isDead">
                †
              </span>
              <span :class="{'isDead': (localInput.isDead && !hideDeadCrossThrough)}">
                  {{stripTags(localInput.label)}}
              </span>
            </span>
            <span class="inline-block q-ml-xs text-italic connectionNote">
              {{retrieveNoteText()}}
            </span>
          </q-item-section>
          <q-menu
                v-if="!quickInsertMode"
                touch-position
                context-menu
                auto-close
                separate-close-popup
                @before-show="menuMode(true)"
                @before-hide="menuMode(false)"
                @mouseleave="menuLeave"
                @mouseenter="menuEnter"
                :dense="recursive"
                :content-style="`z-index: ${(specialZIndex !== 999) ? specialZIndex+1 : '' } !important;`"
              >

                <q-list class="bg-gunmetal-light text-accent">

                  <template>
                    <q-item clickable  @click="copyName(fixGetCorrectDocument(localInput))">
                      <q-item-section>Copy name</q-item-section>
                      <q-item-section avatar>
                        <q-icon name="mdi-text-recognition" />
                      </q-item-section>
                    </q-item>
                    <q-item clickable @click="copyTextColor(fixGetCorrectDocument(localInput))">
                      <q-item-section>Copy text color</q-item-section>
                      <q-item-section avatar>
                        <q-icon name="mdi-eyedropper" />
                      </q-item-section>
                    </q-item>
                    <q-item clickable @click="copyBackgroundColor(fixGetCorrectDocument(localInput))">
                      <q-item-section>Copy background color</q-item-section>
                      <q-item-section avatar>
                        <q-icon name="mdi-format-color-fill" />
                      </q-item-section>
                    </q-item>
                    <q-separator dark />
                      <q-item clickable @click="openExistingInput(fixGetCorrectDocument(localInput))">
                      <q-item-section>Open document</q-item-section>
                      <q-item-section avatar>
                        <q-icon name="mdi-book-open-page-variant-outline" />
                      </q-item-section>
                    </q-item>
                    <q-item clickable @click="editExistingInput(fixGetCorrectDocument(localInput))">
                      <q-item-section>Edit document</q-item-section>
                      <q-item-section avatar>
                        <q-icon name="mdi-pencil" />
                      </q-item-section>
                    </q-item>
                    <q-item clickable @click="openDocumentPreviewPanel(localInput._id)">
                      <q-item-section>Preview document in split-view mode</q-item-section>
                      <q-item-section avatar>
                        <q-icon name="mdi-file-search-outline" />
                      </q-item-section>
                    </q-item>
                    <q-item clickable @click="addNewUnderParent(fixGetCorrectDocument(localInput))">
                      <q-item-section>Create new document with this document as parent</q-item-section>
                      <q-item-section avatar>
                        <q-icon color="primary" name="mdi-file-tree" />
                      </q-item-section>
                    </q-item>
                    <q-item clickable @click="copyTargetDocument(fixGetCorrectDocument(localInput))">
                      <q-item-section>Copy this document</q-item-section>
                      <q-item-section avatar>
                        <q-icon color="primary" name="mdi-content-copy" />
                      </q-item-section>
                    </q-item>
                    <q-separator dark />
                      <q-item clickable v-close-popup @click="triggerExport(localInput)">
                        <q-item-section>Export document</q-item-section>
                        <q-item-section avatar>
                          <q-icon name="mdi-database-export-outline" />
                        </q-item-section>
                      </q-item>
                  </template>
                </q-list>

          </q-menu>
          <documentPreview
            v-if="!recursive && !preventPreviewsDocuments"
            :document-id="localInput._id"
            :external-close-trigger="documentPreviewClose"
          />
        </q-item>
      </div>

    </q-list>

    <div class="flex" v-if="editMode" @mouseleave="setDocumentPreviewClose">
      <q-select
        @mouseleave="setDocumentPreviewClose"
        class="singleRelashionshipSelect"
        menu-anchor="bottom middle"
        menu-self="top middle"
        dark
        popup-content-class="menuResizer"
        style="flex-grow: 1;"
        dense
        :ref="`singleRelationshipField${inputDataBluePrint.id}`"
        :options="filterList"
        :option-disable="opt => Object(opt) === opt ? disabledIDList.includes(opt._id) : true"
        use-input
        new-value-mode="add-unique"
        @new-value="addNewRelationshipObject"
        :outlined="!isDarkMode"
        :filled="isDarkMode"
        input-debounce="500"
        option-value="_id"
        v-model="localInput"
        @filter="filterSelect"
        @input="selectValue"
      >
        <template v-slot:append>
          <q-btn round dense flat v-slot:append v-if="!hideAdvSearchCheatsheetButton" icon="mdi-help-rhombus" @click.stop.prevent="floatingWindowsStore.setAdvSearchWindowVisible"
          >
            <q-tooltip :delay="500">
              Open search cheatsheet
            </q-tooltip>
          </q-btn>
        </template>
        <template v-slot:selected-item="scope">
          <q-chip
            v-if="scope.opt.label && scope.opt.label.length > 0"
            removable
            dense
            @remove="removeInput(scope)"
            :tabindex="scope.tabindex"
            :color="(scope.opt.isAutoGenerated) ? 'teal-3' : 'accent'"
            text-color="dark"
            class="text-bold"
          >
            <q-tooltip
              v-if="scope.opt.isAutoGenerated"
              :delay="500">
                This document doesn't exist yet. It will be auto-generated on save.
              </q-tooltip>

            <div
              class="relationShipChipOverlay"
              @mouseleave="setDocumentPreviewClose"
            />

            <div class="relationShipChipContent">
              <template v-if="scope.opt.isDead">
                †
              </template>
              {{ stripTags(scope.opt.label) }}
            </div>

            <q-btn
              round
              dense
              flat
              class="z-15 relationshipChipNewTab"
              style="color: #000 !important;"
              size="sm"
              icon="mdi-open-in-new"
              v-if="!scope.opt.isAutoGenerated"
              @click.stop.prevent="openNewTab(scope.opt)"
            >
            <q-tooltip :delay="500">
                Open in new tab without leaving this one
              </q-tooltip>
            </q-btn>
            <documentPreview
              v-if="(!recursive && !preventPreviewsDocuments) && !scope.opt.isAutoGenerated"
              :document-id="scope.opt._id"
              :external-close-trigger="documentPreviewClose"
              :custom-delay="1200"
            />
            <q-menu
              v-if="!scope.opt.isAutoGenerated"
              touch-position
              context-menu
              auto-close
              separate-close-popup
              @before-show="menuMode(true)"
              @before-hide="menuMode(false)"
              @mouseleave="menuLeave"
              @mouseenter="menuEnter"
              :dense="recursive"
              >

                <q-list class="bg-gunmetal-light text-accent">

                  <template>
                    <q-item clickable @click="copyName(fixGetCorrectDocument(scope.opt))">
                      <q-item-section>Copy name</q-item-section>
                      <q-item-section avatar>
                        <q-icon name="mdi-text-recognition" />
                      </q-item-section>
                    </q-item>
                    <q-item clickable @click="copyTextColor(fixGetCorrectDocument(scope.opt))">
                      <q-item-section>Copy text color</q-item-section>
                      <q-item-section avatar>
                        <q-icon name="mdi-eyedropper" />
                      </q-item-section>
                    </q-item>
                    <q-item clickable @click="copyBackgroundColor(fixGetCorrectDocument(scope.opt))">
                      <q-item-section>Copy background color</q-item-section>
                      <q-item-section avatar>
                        <q-icon name="mdi-format-color-fill" />
                      </q-item-section>
                    </q-item>
                    <q-separator dark />
                      <q-item clickable @click="openExistingInput(fixGetCorrectDocument(scope.opt))">
                      <q-item-section>Open document</q-item-section>
                      <q-item-section avatar>
                        <q-icon name="mdi-book-open-page-variant-outline" />
                      </q-item-section>
                    </q-item>
                    <q-item clickable @click="editExistingInput(fixGetCorrectDocument(scope.opt))">
                      <q-item-section>Edit document</q-item-section>
                      <q-item-section avatar>
                        <q-icon name="mdi-pencil" />
                      </q-item-section>
                    </q-item>
                    <q-item clickable @click="openDocumentPreviewPanel(scope.opt._id)">
                      <q-item-section>Preview document in split-view mode</q-item-section>
                      <q-item-section avatar>
                        <q-icon name="mdi-file-search-outline" />
                      </q-item-section>
                    </q-item>
                    <q-item clickable @click="addNewUnderParent(fixGetCorrectDocument(scope.opt))">
                      <q-item-section>Create new document with this document as parent</q-item-section>
                      <q-item-section avatar>
                        <q-icon color="primary" name="mdi-file-tree" />
                      </q-item-section>
                    </q-item>
                    <q-item clickable @click="copyTargetDocument(fixGetCorrectDocument(scope.opt))">
                      <q-item-section>Copy this document</q-item-section>
                      <q-item-section avatar>
                        <q-icon color="primary" name="mdi-content-copy" />
                      </q-item-section>
                    </q-item>
                    <q-separator dark />
                    <q-item clickable v-close-popup @click="triggerExport(scope.opt)">
                      <q-item-section>Export document</q-item-section>
                      <q-item-section avatar>
                        <q-icon name="mdi-database-export-outline" />
                      </q-item-section>
                    </q-item>
                  </template>
                </q-list>

              </q-menu>
          </q-chip>
          </template>

        <template v-slot:option="{ itemProps, opt }" >
            <q-item
              :class="{'hasTextShadow': textShadow, 'isMinor':opt.isMinor}"
              v-bind="itemProps"
              :key="opt.id"
              :style="`background-color: ${opt.bgColor}`"
              :title="(disabledIDList.includes(opt._id)) ? 'This option is unavailable for selection as it is already paired to another.': ''"
            >
              <q-item-section avatar>
                <q-icon
                  :style="`color: ${retrieveIconColor(opt)}`"
                  :name="(opt.isCategory) ? 'fas fa-folder-open' : opt.icon"
                  />
              </q-item-section>
              <q-item-section>
                <q-item-label
                  :style="`color: ${opt.color}`"
                  >
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
                  class="text-cultured noBounce"
                  v-html="`${input}`"
                  >
                  </q-chip>
                </q-item-label>
              </q-item-section>

              <documentPreview
                v-if="!recursive && !preventPreviewsDocuments"
                :document-id="opt._id"
                :external-close-trigger="documentPreviewClose"
                :custom-anchor="'top start'"
                :custom-self="'center right'"
                :custom-delay="1500"
              />
              <q-menu
                touch-position
                context-menu
                auto-close
                separate-close-popup
                @before-show="menuMode(true)"
                @before-hide="menuMode(false)"
                @mouseleave="menuLeave"
                @mouseenter="menuEnter"
                :dense="recursive"
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

      <table class="q-mt-sm" v-if="localInput && inputFieldID !== 'parentDoc'">
        <tr>
          <td>
            {{stripTags(localInput.label)}}
          </td>
          <td>
            <q-input
              label="Note"
              v-model="inputNote.value"
              dense
              autogrow
              @keydown="processInput"
              :outlined="!isDarkMode"
              :filled="isDarkMode"
              >
            </q-input>
          </td>

        </tr>
      </table>

    </div>

    <div class="separatorWrapper">
      <q-separator color="grey q-mt-md" />
    </div>

  </div>

</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from "vue"
import { useAppStores } from "src/composables/useAppStores"
import { useDocumentHelpers } from "src/composables/useDocumentHelpers"
import type { I_ExtraFields } from "src/interfaces/I_Blueprint"

import { advancedDocumentFilter } from "src/scripts/utilities/advancedDocumentFilter"
import { extend, uid } from "quasar"

import type { I_OpenedDocument, I_ShortenedDocument } from "src/interfaces/I_OpenedDocument"
import type { I_FieldRelationship, I_RelationshipPairSingle } from "src/interfaces/I_FieldRelationship"
import { createNewWithParent } from "src/scripts/documentActions/createNewWithParent"
import { copyDocumentName, copyDocumentTextColor, copyDocumentBackgroundColor } from "src/scripts/documentActions/uniqueFieldCopy"
import { copyDocument } from "src/scripts/documentActions/copyDocument"
import { buildDefaultExtraFields } from "src/scripts/databaseManager/fieldDefaults"
import { documentPath } from "src/scripts/utilities/projectRoutes"
import { useRouter } from "vue-router"
import documentPreview from "src/components/DocumentPreview.vue"

const props = defineProps<{
  inputDataBluePrint: I_ExtraFields
  editMode?: boolean
  specialZIndex?: number
  quickInsertMode?: boolean
  recursive?: boolean
  sideDocumentPreview?: boolean
  inputDataValue?: I_RelationshipPairSingle
  currentId?: string
}>()

const emit = defineEmits(["signalInput", "menuMode", "menuEnter", "menuLeave", "setNewParentId"])

const { optionsStore, projectStore, blueprintsStore, openedDocumentsStore, allDocumentsStore, dialogsStore, floatingWindowsStore } = useAppStores()
const { stripTags, retrieveIconColor, openExistingDocumentRoute, openExistingDocumentRouteWithEdit, openDocumentPreviewPanel, generateUID } = useDocumentHelpers()
const router = useRouter()

const isDarkMode = ref(false)
const disableDocumentToolTips = ref(false)
const textShadow = ref(false)
const hideDeadCrossThrough = ref(false)
const hideAdvSearchCheatsheetButton = ref(false)
const preventPreviewsDocuments = ref(false)
const agressiveRelationshipFilter = ref(false)

const inputIcon = computed(() => props.inputDataBluePrint?.icon)
const toolTip = computed(() => props.inputDataBluePrint?.tooltip)
const isMasterOnlyField = computed(() => props.inputDataBluePrint?.masterOnly === true)
const canEditMasterOnlyField = computed(() => projectStore.currentUserRole === "master")

watch(() => optionsStore.getOptions, (options) => {
  isDarkMode.value = options.darkMode
  disableDocumentToolTips.value = options.disableDocumentToolTips
  textShadow.value = options.textShadow
  hideDeadCrossThrough.value = options.hideDeadCrossThrough
  hideAdvSearchCheatsheetButton.value = options.hideAdvSearchCheatsheetButton
  preventPreviewsDocuments.value = options.preventPreviewsDocuments
  agressiveRelationshipFilter.value = options.agressiveRelationshipFilter
}, { immediate: true, deep: true })

const specialZIndex = computed(() => props.specialZIndex ?? 999)

const inputFieldID = computed(() => props.inputDataBluePrint?.id)

const isOneWayRelationship = computed(() => {
  return (props.inputDataBluePrint.type === "singleToNoneRelationship" || props.inputDataBluePrint.type === "manyToNoneRelationship")
})

// Input handling
const localInput = ref("" as unknown as I_FieldRelationship)
const inputNote = ref<{ pairedId: string; value: string }>({ pairedId: "", value: "" })
const allTypeDocuments = ref<I_ShortenedDocument[]>([])
const filterList = ref<I_ShortenedDocument[]>([])
const disabledIDList = ref<string[]>([])
const documentPreviewClose = ref("")
const docToFind = ref(null as unknown as I_OpenedDocument)
const documentPass = ref(null as unknown as I_OpenedDocument)

const singleRelationshipFieldRef = ref<any>(null)

watch(() => props.inputDataValue, () => {
  // @ts-ignore
  localInput.value = (props.inputDataValue?.value) ? props.inputDataValue.value : ""
  inputNote.value = (!props.inputDataValue?.addedValues) ? inputNote.value : props.inputDataValue.addedValues
  reloadObjectListAndCheckIfValueExists()
}, { deep: true, immediate: true })

watch(() => props.inputDataBluePrint, () => {
  reloadObjectListAndCheckIfValueExists()
}, { deep: true, immediate: true })

watch(() => props.currentId, () => {
  reloadObjectListAndCheckIfValueExists()
})

async function removeInput (scope: {
  index: number
  removeAtIndex: (index: number) => void
}) {
  scope.removeAtIndex(scope.index)

  await nextTick()
  /*eslint-disable */
  // @ts-ignore
  singleRelationshipFieldRef.value?.hidePopup()
  /* eslint-enable */
}

function retrieveNoteText () {
  const pairedNote = inputNote.value
  return (pairedNote && pairedNote.value.length > 0) ? `(${pairedNote.value})` : ""
}

async function refocusSelect () {
  await nextTick()
  /*eslint-disable */
  // @ts-ignore
  singleRelationshipFieldRef.value?.setOptionIndex(-1)

  if (agressiveRelationshipFilter.value) {
    // @ts-ignore
    singleRelationshipFieldRef.value?.moveOptionSelection(1, true)
  }
  /* eslint-enable */
}

function filterSelect (val: string, update: (e: () => void) => void) {
  if (val === "") {
    update(() => {
      filterList.value = allTypeDocuments.value
        .filter((obj) => !obj.isMinor && obj._id !== props.currentId)

      if (singleRelationshipFieldRef.value && filterList.value.length > 0) {
        refocusSelect().catch(e => console.log(e))
      }
    })
    return
  }

  update(() => {
    const needle = val.toLowerCase()
    filterList.value = extend(true, [], allTypeDocuments.value)
    // @ts-ignore
    filterList.value = advancedDocumentFilter(needle, filterList.value, blueprintsStore.getAllBlueprints, allDocumentsStore.getAllDocuments.docs)
      .filter((obj: I_ShortenedDocument) => obj._id !== props.currentId)

    if (singleRelationshipFieldRef.value && filterList.value.length > 0) {
      refocusSelect().catch(e => console.log(e))
    }
  })
}

function reloadObjectListAndCheckIfValueExists () {
  if (props.inputDataBluePrint?.relationshipSettings && (props.currentId ?? "").length > 0) {
    const isBelongsUnder = (props.inputDataBluePrint.id === "parentDoc")
    const allDbObjects = (isBelongsUnder)
      ? allDocumentsStore.getDocumentsByType(props.inputDataBluePrint.relationshipSettings.connectedObjectType)
      : allDocumentsStore.getDocumentsByTypeWithoutCategories(props.inputDataBluePrint.relationshipSettings.connectedObjectType)

    allDbObjects.docs.forEach((doc) => {
      const objectDoc = doc as unknown as I_ShortenedDocument

      const pairedField = (props.inputDataBluePrint?.relationshipSettings?.connectedField) || ""
      let isDisabled = false

      if (pairedField.length > 0) {
        const pairedFieldObject = objectDoc.extraFields.find(f => f.id === pairedField)
        const pairingType = props.inputDataBluePrint.type

        if (pairedFieldObject !== undefined && typeof pairedFieldObject?.value !== "string" && pairedFieldObject?.value !== null && pairedFieldObject?.value?.value !== null && pairingType === "singleToSingleRelationship") {
          const checkIfExists = allDbObjects.docs.find(f => f._id === pairedFieldObject?.value?.value?._id)

          if (checkIfExists) {
            isDisabled = true
          }
        }
      }

      if (isDisabled) {
        disabledIDList.value = [...new Set([
          ...disabledIDList.value,
          doc._id
        ])]
      }
    })

    if (localInput.value._id) {
      if (!allDbObjects.docs.find(e => e._id === localInput.value._id) && !localInput.value?.isAutoGenerated) {
        // @ts-ignore
        localInput.value = ""
      }

      if (allDbObjects.docs.find(e => e._id === localInput.value._id)) {
        const matchedFieldContent = allDbObjects.docs.find(e => e._id === localInput.value._id)

        if (matchedFieldContent && (
          localInput.value.label !== matchedFieldContent.label ||
            localInput.value?.isDead !== matchedFieldContent.extraFields.find(e => e.id === "deadSwitch")?.value)
        ) {
          localInput.value.label = matchedFieldContent.label
          localInput.value.isDead = matchedFieldContent.extraFields.find(e => e.id === "deadSwitch")?.value
        }

        if (localInput.value.isAutoGenerated) {
          localInput.value.isAutoGenerated = false
        }
      }
    }

    allTypeDocuments.value = allDbObjects.docs
  }
}

function openNewTab (input: I_FieldRelationship) {
  const retrievedObject = (openedDocumentsStore.getDocument(input._id)) || allDocumentsStore.getDocument(input._id)

  const dataPass = {
    doc: retrievedObject,
    treeAction: false
  }

  // @ts-ignore
  openedDocumentsStore.addDocument(dataPass)
}

function processSelectInteraction (input: null | I_ShortenedDocument) {
  if (props.inputDataBluePrint.type === "singleToSingleRelationship") {
    if (input) {
      disabledIDList.value.push(input._id)
    }
    else {
      const toRemoveIndex = disabledIDList.value.findIndex(id => id === props.inputDataValue?.value?._id)

      if (toRemoveIndex > -1) {
        disabledIDList.value.splice(toRemoveIndex, 1)
      }
    }
  }

  processInput()
}

let pullTimer = null as any

function processInput () {
  inputNote.value = (localInput.value !== null) ? inputNote.value : { pairedId: "", value: "" }
  clearTimeout(pullTimer)
  pullTimer = setTimeout(() => {
    signalInput()
  }, 500)
}

function signalInput () {
  inputNote.value = (localInput.value !== null) ? inputNote.value : { pairedId: "", value: "" }

  const exportValue = (localInput.value && localInput.value._id)
    ? {
      _id: localInput.value._id,
      id: localInput.value._id,
      type: localInput.value.type,
      url: localInput.value.url,
      label: (localInput.value?.label) || "",
      isAutoGenerated: (localInput.value.isAutoGenerated),
      pairedField: (props.inputDataBluePrint?.relationshipSettings?.connectedField) || ""
    }
    : null

  emit("signalInput", {
    value: exportValue,
    addedValues: inputNote.value
  })
}

function fixGetCorrectDocument (e: I_OpenedDocument | I_FieldRelationship) {
  docToFind.value = (allTypeDocuments.value.find(doc => doc._id === e._id)) as unknown as I_OpenedDocument
  return docToFind.value
}

function openExistingInput (e: I_OpenedDocument) {
  // @ts-ignore
  e = (Array.isArray(e)) ? e[0] : e
  openExistingDocumentRoute(e)
}

function editExistingInput (e: I_OpenedDocument) {
  // @ts-ignore
  e = (Array.isArray(e)) ? e[0] : e
  openExistingDocumentRouteWithEdit(e)
}

function addNewUnderParent (currentDoc: I_OpenedDocument) {
  createNewWithParent(currentDoc, { $router: router } as any)
}

function copyName (currentDoc: I_OpenedDocument) {
  copyDocumentName(currentDoc)
}

function copyTextColor (currentDoc: I_OpenedDocument) {
  copyDocumentTextColor(currentDoc)
}

function copyBackgroundColor (currentDoc: I_OpenedDocument) {
  copyDocumentBackgroundColor(currentDoc)
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
    const errorName: string = e.name
    if (errorName === "NavigationDuplicated") {
      return
    }
    console.log(e)
  })
}

async function selectValue () {
  /*eslint-disable */
  // @ts-ignore
  singleRelationshipFieldRef.value?.updateInputValue("")
  /* eslint-enable */

  await nextTick()
  /*eslint-disable */
  // @ts-ignore
  singleRelationshipFieldRef.value?.hidePopup()
  /* eslint-enable */

  processInput()
}

function addNewRelationshipObject (input: string) {
  /*eslint-disable */
  // @ts-ignore
  singleRelationshipFieldRef.value?.updateInputValue("")
  /* eslint-enable */

  const newObjectType = props.inputDataBluePrint?.relationshipSettings?.connectedObjectType as unknown as string

  const pairedBlueprint = blueprintsStore.getBlueprint(newObjectType)

  const newObjectID = uid()

  const newDocument = {
    bgColor: undefined,
    color: undefined,
    extraFields: buildDefaultExtraFields(pairedBlueprint, { name: input }),
    hierarchicalPath: pairedBlueprint.namePlural,
    icon: pairedBlueprint.icon,
    id: newObjectID,
    isCategory: "",
    isDead: undefined,
    isMinor: undefined,
    isAutoGenerated: true,
    label: input,
    tags: [],
    type: newObjectType,
    url: documentPath(projectStore.currentProjectId, newObjectType, newObjectID),
    _id: newObjectID
  }

  // @ts-ignore
  localInput.value = newDocument

  processInput()
}

function setDocumentPreviewClose () {
  documentPreviewClose.value = uid()
}

function menuMode (val: boolean) {
  emit("menuMode", val)
}

function menuEnter () {
  emit("menuEnter", true)
}

function menuLeave () {
  emit("menuLeave", true)
}

function setNewParentId (id: string) {
  emit("setNewParentId", id)
}

function triggerExport (node: {_id: string}) {
  dialogsStore.setDialogState(false)
  /*eslint-disable */
  // @ts-ignore
  singleRelationshipFieldRef.value?.hidePopup()
  /* eslint-enable */
  dialogsStore.setExportDialogState([node._id])
}
</script>

<style lang="scss" scoped>
table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0 8px;
}
</style>

<style lang="scss">
.connectionList {
  .relationsViewList {
    position: relative;

    > .q-item {
      min-height: 32px !important;
      padding-top: 2px;
      padding-bottom: 2px;
    }
  }

  .q-item {
    padding-left: 10px;
    padding-right: 30px;

    &.hasSetParentButton {
      padding-right: 60px;
    }
  }

  .q-item__section {
    position: relative;
    flex-direction: row;
    justify-content: flex-start;
    align-items: center;
  }

  .relationshipOpeningButton {
    position: absolute;
    right: 0;
    top: 50%;
    transform: translateY(-50%);
    height: 29px;
    width: 29px;
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 10;
  }

  .relationshipChangeParent {
    position: absolute;
    right: 30px;
    top: 50%;
    transform: translateY(-50%);
    height: 29px;
    width: 29px;
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 10;
  }
}

.relationShipChipOverlay {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  border-radius: 12px;
}

.relationShipChipContent {
  position: relative;
  z-index: 1;
}

.connectionList .connectionNote {
  color: #000;
  opacity: 0.8;
}
</style>
