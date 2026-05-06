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
        v-for="(singleNote,index) in inputNotes"
        :key="index"
        class="relationsViewList"
      >
         <div
          class="relationshipOpeningButton q-btn q-btn-item non-selectable no-outline q-btn--flat q-btn--round text-primary q-btn--actionable q-focusable q-hoverable q-btn--wrap q-btn--dense"
          @click.stop.prevent.left="openNewTab(localInput[index])"
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
          @click.stop.prevent.left="setNewParentId(localInput[index]._id)"
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
        <documentPreview
          v-if="!recursive && !preventPreviewsDocuments"
          :document-id="localInput[index]._id"
          :external-close-trigger="documentPreviewClose"
        />
        <q-item-section
          @click.stop.prevent.left="openExistingDocumentRoute(localInput[index])"
          @click.stop.prevent.middle="openNewTab(localInput[index])"
          >
            <span class="text-weight-medium">
              <span class="isDeadIndicator" v-if="localInput[index].isDead">
                †
              </span>
              <span :class="{'isDead': (localInput[index].isDead && !hideDeadCrossThrough)}">
                  {{stripTags(localInput[index].label)}}
              </span>
            </span>
            <span class="inline-block q-ml-xs text-italic connectionNote">
              {{singleNote.value}}
            </span>

        </q-item-section>
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
          :style="`z-index: ${(specialZIndex !== 999) ? specialZIndex+1 : '' } !important;`"
        >

          <q-list class="bg-gunmetal-light text-accent">

            <template>
              <q-item clickable  @click="copyName(fixGetCorrectDocument(localInput[index]))">
                <q-item-section>Copy name</q-item-section>
                <q-item-section avatar>
                  <q-icon name="mdi-text-recognition" />
                </q-item-section>
              </q-item>
              <q-item clickable @click="copyTextColor(fixGetCorrectDocument(localInput[index]))">
                <q-item-section>Copy text color</q-item-section>
                <q-item-section avatar>
                  <q-icon name="mdi-eyedropper" />
                </q-item-section>
              </q-item>
              <q-item clickable @click="copyBackgroundColor(fixGetCorrectDocument(localInput[index]))">
                <q-item-section>Copy background color</q-item-section>
                <q-item-section avatar>
                  <q-icon name="mdi-format-color-fill" />
                </q-item-section>
              </q-item>
              <q-separator dark />
              <q-item clickable @click="openExistingInput(fixGetCorrectDocument(localInput[index]))">
                <q-item-section>Open document</q-item-section>
                <q-item-section avatar>
                  <q-icon name="mdi-book-open-page-variant-outline" />
                </q-item-section>
              </q-item>
              <q-item clickable @click="editExistingInput(fixGetCorrectDocument(localInput[index]))">
                <q-item-section>Edit document</q-item-section>
                <q-item-section avatar>
                  <q-icon name="mdi-pencil" />
                </q-item-section>
              </q-item>
              <q-item clickable @click="openDocumentPreviewPanel(localInput[index]._id)">
                <q-item-section>Preview document in split-view mode</q-item-section>
                <q-item-section avatar>
                  <q-icon name="mdi-file-search-outline" />
                </q-item-section>
              </q-item>
              <q-item clickable @click="addNewUnderParent(fixGetCorrectDocument(localInput[index]))">
                <q-item-section>Create new document with this document as parent</q-item-section>
                <q-item-section avatar>
                  <q-icon color="primary" name="mdi-file-tree" />
                </q-item-section>
              </q-item>
              <q-item clickable @click="copyTargetDocument(fixGetCorrectDocument(localInput[index]))">
                <q-item-section>Copy this document</q-item-section>
                <q-item-section avatar>
                  <q-icon color="primary" name="mdi-content-copy" />
                </q-item-section>
              </q-item>
              <q-separator dark />
                <q-item clickable v-close-popup @click="triggerExport(localInput[index])">
                  <q-item-section>Export document</q-item-section>
                  <q-item-section avatar>
                    <q-icon name="mdi-database-export-outline" />
                  </q-item-section>
                </q-item>
            </template>
          </q-list>

        </q-menu>

      </q-item>

      </div>

    </q-list>

  <div class="flex" v-if="editMode">
    <q-select
      menu-anchor="bottom middle"
      menu-self="top middle"
      class="multiRelashionshipSelect"
      dark
      style="flex-grow: 1;"
      popup-content-class="menuResizer"
      dense
      :ref="`multiRelationshipField${inputDataBluePrint.id}`"
      :options="filterList"
      use-input
      :option-disable="opt => Object(opt) === opt ? disabledIDList.includes(opt._id) : true"
      :outlined="!isDarkMode"
      :filled="isDarkMode"
      new-value-mode="add-unique"
      @new-value="addNewRelationshipObject"
      use-chips
      multiple
      option-value="_id"
      input-debounce="500"
      v-model="localInput"
      @filter="filterSelect"
      @update:model-value="selectValue"
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
            @click.stop.prevent="openNewTab(scope.opt)"
            v-if="!scope.opt.isAutoGenerated"
          >
           <q-tooltip :delay="500">
              Open in new tab without leaving this one
            </q-tooltip>
          </q-btn>
           <documentPreview
            :custom-delay="1200"
            v-if="(!recursive && !preventPreviewsDocuments) && !scope.opt.isAutoGenerated"
            :document-id="scope.opt._id"
            :external-close-trigger="documentPreviewClose"
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
                  <q-item clickable @click="openDocumentPreviewPanel(scope.opt_id)">
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
      <template v-slot:option="{ itemProps, opt }">
        <q-item
          :class="{'hasTextShadow': textShadow, 'isMinor':opt.isMinor}"
          v-bind="itemProps"
          :key="opt.id"
          :style="`background-color: ${opt.bgColor}`"
          :title="(disabledIDList.includes(opt._id)) ? 'This option is unavailable for selection as it is already paired to another.': ''"
          @mouseleave="setDocumentPreviewClose"
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

    <table class="q-mt-sm">
      <tr
        v-for="(singleNote,index) in inputNotes"
        :key="index"
      >
        <td>
          <div class="flex">
            <q-btn
              tabindex="-1"
              round
              flat
              dense
              :disable="index === 0"
              icon="mdi-arrow-up-bold"
              class="q-mr-xs self-center"
              size="10px"
              :color="(index !== 0) ? 'primary' : ''"
              @click="moveItem(index, 'up')"
            >
              <q-tooltip
                :delay="300"
                anchor="center left"
                self="center right"
              >
              Move the item one place up
              </q-tooltip>
            </q-btn>

            <q-btn
              tabindex="-1"
              round
              flat
              dense
              :disable="index === localInput.length - 1"
              icon="mdi-arrow-down-bold"
              class="q-mr-xs self-center"
              size="10px"
              :color="(index !== localInput.length - 1) ? 'primary' : ''"
              @click="moveItem(index, 'down')"
            >
              <q-tooltip
                :delay="300"
                anchor="center left"
                self="center right"
              >
              Move the item one place down
              </q-tooltip>
            </q-btn>
            <div class="grow-1">
              {{stripTags(localInput[index].label)}}
            </div>
          </div>
        </td>
        <td>
          <q-input
            label="Note"
            v-model="singleNote.value"
            dense
            autogrow
            @keydown="processInput()"
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
import type { I_ShortenedDocument, I_OpenedDocument } from "src/interfaces/I_OpenedDocument"
import type { I_FieldRelationship, I_RelationshipPair } from "src/interfaces/I_FieldRelationship"
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
  inputDataValue?: I_RelationshipPair
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

const isOneWayRelationship = computed(() => {
  return (props.inputDataBluePrint.type === "singleToNoneRelationship" || props.inputDataBluePrint.type === "manyToNoneRelationship")
})

// Input handling
const localInput = ref([] as unknown as I_FieldRelationship[])
const inputNotes = ref<{ pairedId: string; value: string; }[]>([])
const allTypeDocuments = ref<I_ShortenedDocument[]>([])
const filterList = ref<I_ShortenedDocument[]>([])
const disabledIDList = ref<string[]>([])
const documentPreviewClose = ref("")
const docToFind = ref(null as unknown as I_OpenedDocument)
const documentPass = ref(null as unknown as I_OpenedDocument)

watch(() => props.inputDataValue, (val) => {
  const localCopy: I_RelationshipPair = extend(true, {}, val)
  localInput.value = (localCopy?.value) ? localCopy.value : []

  const notes = (!localCopy?.addedValues) ? [] : localCopy.addedValues
  inputNotes.value = notes.filter((single: { pairedId: string }) => localInput.value.find(e => single.pairedId === e._id))
  checkNotes()

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

  // q-select ha aggiornato localInput via v-model ma inputNotes resta disallineato:
  // il template della tabella (v-for su inputNotes) accede a localInput[index] e
  // crasherebbe al re-render se gli array hanno lunghezze diverse.
  inputNotes.value = inputNotes.value.filter(single => localInput.value.find(e => single.pairedId === e._id))
  signalInput(false)

  await nextTick()
  /*eslint-disable */
  // @ts-ignore
  multiRelationshipFieldRef.value?.hidePopup()
  /* eslint-enable */
}

const multiRelationshipFieldRef = ref<any>(null)

function retrieveNoteText (id: string) {
  const pairedNote = inputNotes.value.find(e => e.pairedId === id)
  return (pairedNote && pairedNote.value.length > 0) ? `(${pairedNote.value})` : ""
}

async function refocusSelect () {
  await nextTick()
  /*eslint-disable */
  // @ts-ignore
  multiRelationshipFieldRef.value?.setOptionIndex(-1)

  if (agressiveRelationshipFilter.value) {
    // @ts-ignore
    multiRelationshipFieldRef.value?.moveOptionSelection(1, true)
  }
  /* eslint-enable */
}

function filterSelect (val: string, update: (e: () => void) => void) {
  if (val === "") {
    update(() => {
      filterList.value = allTypeDocuments.value
        .filter((obj) => !obj.isMinor && obj._id !== props.currentId)

      if (multiRelationshipFieldRef.value && filterList.value.length > 0) {
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

    if (multiRelationshipFieldRef.value && filterList.value.length > 0) {
      refocusSelect().catch(e => console.log(e))
    }
  })
}

function reloadObjectListAndCheckIfValueExists () {
  if (props.inputDataBluePrint?.relationshipSettings && (props.currentId ?? "").length > 0) {
    const allDbObjects = allDocumentsStore.getDocumentsByTypeWithoutCategories(props.inputDataBluePrint.relationshipSettings.connectedObjectType)

    allDbObjects.docs.forEach((doc) => {
      const objectDoc = doc as unknown as I_ShortenedDocument

      const pairedField = (props.inputDataBluePrint?.relationshipSettings?.connectedField) || ""
      let isDisabled = false

      if (pairedField.length > 0) {
        const pairedFieldObject = objectDoc.extraFields.find(f => f.id === pairedField)

        const pairingType = props.inputDataBluePrint.type
        if (
          pairedFieldObject !== undefined &&
          pairedFieldObject !== null &&
          pairedFieldObject?.value !== undefined &&
          pairedFieldObject?.value !== null &&
          typeof pairedFieldObject?.value !== "string" &&
          pairedFieldObject?.value?.value !== undefined &&
          pairedFieldObject?.value?.value !== null &&
          typeof pairedFieldObject?.value?.value !== "string" &&
          pairingType === "manyToSingleRelationship"
        ) {
          isDisabled = true
        }
      }

      if (isDisabled) {
        disabledIDList.value = [...new Set([
          ...disabledIDList.value,
          doc._id
        ])]
      }
    })

    localInput.value = (Array.isArray(localInput.value)) ? localInput.value : []

    const toRemoveIndexList: string[] = []
    let autoGenerateCleanup = false

    for (const [index] of localInput.value.entries()) {
      if (localInput.value[index]._id) {
        if (!allDbObjects.docs.find(e => e._id === localInput.value[index]._id) && !localInput.value[index]?.isAutoGenerated) {
          toRemoveIndexList.push(localInput.value[index]._id)
        }

        if (allDbObjects.docs.find(e => e._id === localInput.value[index]._id)) {
          const matchedFieldContent = allDbObjects.docs.find(e => e._id === localInput.value[index]._id)
          if (matchedFieldContent) {
            localInput.value[index].label = matchedFieldContent.label
            localInput.value[index].isDead = matchedFieldContent.extraFields.find(e => e.id === "deadSwitch")?.value
          }
          if (localInput.value[index].isAutoGenerated) {
            localInput.value[index].isAutoGenerated = false
            autoGenerateCleanup = true
          }
        }
      }
    }

    allTypeDocuments.value = allDbObjects.docs

    if (toRemoveIndexList.length > 0 || autoGenerateCleanup) {
      toRemoveIndexList.forEach((id) => {
        const indexToRemove = localInput.value.findIndex(doc => doc._id === id)
        if (indexToRemove > -1) {
          localInput.value.splice(indexToRemove, 1)
        }
      })
      signalInput(true)
    }
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

function selectValue () {
  /*eslint-disable */
  // @ts-ignore
  multiRelationshipFieldRef.value?.updateInputValue("")
  /* eslint-enable */

  processInput()
}

function moveItem (index: number, direction: "up" | "down") {
  const to = (direction === "up") ? index - 1 : index + 1
  const from = index

  localInput.value.splice(to, 0, localInput.value.splice(from, 1)[0])
  inputNotes.value.splice(to, 0, inputNotes.value.splice(from, 1)[0])

  processInput()
}

let pullTimer = null as any

function processInput () {
  checkNotes()
  inputNotes.value = inputNotes.value.filter(single => localInput.value.find(e => single.pairedId === e._id))

  clearTimeout(pullTimer)
  pullTimer = setTimeout(() => {
    signalInput(false)
  }, 500)
}

function signalInput (isSilent: boolean) {
  checkNotes()
  inputNotes.value = inputNotes.value.filter(single => localInput.value.find(e => single.pairedId === e._id))

  emit("signalInput", {
    value: localInput.value.map(e => {
      return {
        _id: e._id,
        id: e._id,
        type: e.type,
        url: e.url,
        label: (e?.label) || "",
        isAutoGenerated: (e.isAutoGenerated),
        pairedField: (props.inputDataBluePrint?.relationshipSettings?.connectedField) || ""
      }
    }),
    addedValues: inputNotes.value,
    isSilent: isSilent
  })
}

function checkNotes () {
  localInput.value.forEach(single => {
    if (!inputNotes.value.find(e => single._id === e.pairedId)) {
      inputNotes.value.push({ pairedId: single._id, value: "" })
    }
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

function addNewRelationshipObject (input: string) {
  /*eslint-disable */
  // @ts-ignore
  multiRelationshipFieldRef.value?.updateInputValue("")
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
  localInput.value.push(newDocument)

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
  multiRelationshipFieldRef.value?.hidePopup()
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
