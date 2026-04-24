<template>
  <q-page
  class="documentDisplay"
  :id="'document-'+currentData._id"
  :class="{
    'routeTransitionFinished': routeTransitionFinished,
    'q-pb-xl q-pl-xl q-pr-xl': disableDocumentControlBar,
    'q-pa-xl': !disableDocumentControlBar,
    'hiddenFields': (hideEmptyFields || retrieveFieldValue(currentData, 'finishedSwitch')),
    [extraClasses]: extraClasses
    }"
  v-if="bluePrintData"
  >

    <!-- Delele document dialog -->
    <deleteDocumentCheckDialog
      :dialog-trigger="deleteObjectDialogTrigger"
      @trigger-dialog-close="deleteObjectDialogClose"
    />

    <div class="row justify-start q-col-gutter-x-xl">

      <div
       class="flex justify-end localControlRow"
       v-if="disableDocumentControlBar"
       >

        <q-btn
            icon="mdi-content-save-edit"
            :color="(hasEdits) ? 'teal-14' : 'primary'"
            :outline="isDarkMode"
            class="q-mr-md"
            @click="saveCurrentDocument(true)"
            v-if="editMode"
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
          :color="(hasEdits) ? 'teal-14' : 'primary'"
          icon="mdi-content-save"
          @click="saveCurrentDocument(false)"
          :outline="isDarkMode"
          class="q-mr-md"
          v-if="editMode"
        >
          <q-tooltip
            :delay="500"
            anchor="bottom middle"
            self="top middle"
          >
            Save current document
          </q-tooltip>
        </q-btn>

        <q-btn
          color="primary"
          icon="mdi-file-document-edit"
          @click="toggleEditMode"
          :outline="isDarkMode"
          class="q-mr-md"
          v-if="!editMode"
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
            icon="mdi-file-search-outline"
            color="primary"
            class="q-mr-md"
            :outline="isDarkMode"
            @click="openThisDocumentInSidebar"
            v-if="!currentData.isNew"
          >
            <q-tooltip
              :delay="500"
              max-width="500px"
              anchor="bottom middle"
              self="top middle"
            >
              Preview document in split-view mode
            </q-tooltip>
          </q-btn>

        <q-btn
          color="primary"
          icon="mdi-file-tree"
          @click="addNewUnderParent"
          :outline="isDarkMode"
          class="q-mr-md"
          v-if="!currentData.isNew"
        >
          <q-tooltip
            :delay="500"
            anchor="bottom middle"
            self="top middle"
          >
            Add a new document with the currently opened one as the parent
          </q-tooltip>
        </q-btn>

        <q-btn
          color="primary"
          icon="mdi-content-copy"
          @click="copyTargetDocument"
          :outline="isDarkMode"
          class="q-mr-md"
          v-if="!currentData.isNew"
        >
          <q-tooltip
            :delay="500"
            anchor="bottom middle"
            self="top middle"
          >
            Copy current document
          </q-tooltip>
        </q-btn>

        <q-separator
          vertical
          inset
          :color="(isDarkMode) ? 'accent' : 'black'"
          class="q-mr-md"
        />

        <q-btn
          :color="(hasEdits) ? 'secondary' : 'primary'"
          icon="mdi-database-export-outline"
          @click="triggerExport"
          :outline="isDarkMode"
          class="q-mr-md"
          v-if="!currentData.isNew"
        >
          <q-tooltip
            :delay="500"
            anchor="bottom middle"
            self="top middle"
          >
            Export current project
            <span class="text-secondary" v-if="hasEdits">
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

        <q-separator
          vertical
          inset
          :color="(isDarkMode) ? 'accent' : 'black'"
          class="q-mr-md"
          />

        <q-btn
          color="secondary"
          icon="mdi-text-box-remove-outline"
          :outline="isDarkMode"
          @click="deleteObjectAssignUID"
          v-if="!currentData.isNew"
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

      <div class="col-12 q-mt-xl justify-end" v-if="showDocumentID">
        <q-input style="width: 375px;" readonly outlined label="Document ID" stack-label @click="copyID" ref="idCopy" v-model="currentData._id">
        </q-input>
      </div>

      <div
        v-for="field in bluePrintData.extraFields"
        :key="`${field.id}`"
        v-show="
          (retrieveFieldType(currentData, field.id) !== 'break' || !hideDocumentTitles) &&
          (
            (hasValueFieldFilter(field) || editMode)
            && (checkBreakSectionValues(field) || editMode)
            && checkForLegacyFieldValue(currentData, field)
            && checkDocumentTemplate(field.id)
          )
          "
        :class="`
          col-12
          col-md-${determineSize_MD(field)}
          col-lg-${determineSize_LG(field)}
          col-xl-${determineSize_XL(field)}
          q-mb-md
          documentColumnWrapper
          ${(determineLegacyField(currentData, field.id)) ? 'isLegacy' : ''}
        `">

          <Field_Break
          class="inputWrapper break"
          :class="'field-'+field.id+'-'+currentData._id"
          v-if="field.type === 'break' && categoryFieldFilter(field.id)"
          :inputDataBluePrint="field"
          :inputDataValue="retrieveFieldValue(currentData, field.id)"
          />

          <Field_Text
          class="inputWrapper"
          :class="'field-'+field.id+'-'+currentData._id"
          v-if="field.type === 'text' && categoryFieldFilter(field.id)"
          :inputDataBluePrint="field"
          :inputDataValue="retrieveFieldValue(currentData, field.id)"
          :isNew="currentData.isNew"
          :editMode="editMode"
          @signal-input="reactToFieldUpdate($event, field)"
          />

          <Field_Number
          class="inputWrapper"
          :class="'field-'+field.id+'-'+currentData._id"
          v-if="field.type === 'number' && categoryFieldFilter(field.id)"
          :inputDataBluePrint="field"
          :inputDataValue="retrieveFieldValue(currentData, field.id)"
          :isNew="currentData.isNew"
          :editMode="editMode"
          @signal-input="reactToFieldUpdate($event, field)"
          />

          <Field_Switch
          class="inputWrapper"
          :class="'field-'+field.id+'-'+currentData._id"
          v-if="field.type === 'switch' && categoryFieldFilter(field.id)"
          :inputDataBluePrint="field"
          :inputDataValue="retrieveFieldValue(currentData, field.id)"
          :isNew="currentData.isNew"
          :editMode="editMode"
          @signal-input="reactToFieldUpdate($event, field)"
          />

          <Field_ColorPicker
          class="inputWrapper"
          :class="'field-'+field.id+'-'+currentData._id"
          v-if="field.type === 'colorPicker' && categoryFieldFilter(field.id)"
          :inputDataBluePrint="field"
          :inputDataValue="retrieveFieldValue(currentData, field.id)"
          :isNew="currentData.isNew"
          :editMode="editMode"
          @signal-input="reactToFieldUpdate($event, field)"
          />

          <Field_List
          class="inputWrapper"
          :class="'field-'+field.id+'-'+currentData._id"
          v-if="field.type === 'list' && categoryFieldFilter(field.id)"
          :inputDataBluePrint="field"
          :inputDataValue="retrieveFieldValue(currentData, field.id)"
          :isNew="currentData.isNew"
          :editMode="editMode"
          @signal-input="reactToFieldUpdate($event, field)"
          />

          <Field_SingleSelect
          class="inputWrapper"
          :class="'field-'+field.id+'-'+currentData._id"
          v-if="field.type === 'singleSelect' && categoryFieldFilter(field.id)"
          :inputDataBluePrint="field"
          :inputDataValue="retrieveFieldValue(currentData, field.id)"
          :isNew="currentData.isNew"
          :editMode="editMode"
          @signal-input="reactToFieldUpdate($event, field)"
          />

          <Field_MultiSelect
          class="inputWrapper"
          :class="'field-'+field.id+'-'+currentData._id"
          v-if="field.type === 'multiSelect' && categoryFieldFilter(field.id)"
          :inputDataBluePrint="field"
          :inputDataValue="retrieveFieldValue(currentData, field.id)"
          :isNew="currentData.isNew"
          :editMode="editMode"
          @signal-input="reactToFieldUpdate($event, field)"
          />

          <Field_SingleRelationship
          class="inputWrapper"
          :class="'field-'+field.id+'-'+currentData._id"
          v-if="(field.type === 'singleToNoneRelationship' || field.type === 'singleToSingleRelationship' || field.type === 'singleToManyRelationship') && categoryFieldFilter(field.id)"
          :inputDataBluePrint="field"
          :inputDataValue="retrieveFieldValue(currentData, field.id)"
          :isNew="currentData.isNew"
          :editMode="editMode"
          :current-id="currentData._id"
          @signal-input="reactToFieldUpdate($event, field)"
          />

          <Field_MultiRelationship
          class="inputWrapper"
          :class="'field-'+field.id+'-'+currentData._id"
          v-if="(field.type === 'manyToNoneRelationship' || field.type ===
          'manyToSingleRelationship' || field.type === 'manyToManyRelationship') && categoryFieldFilter(field.id)"
          :inputDataBluePrint="field"
          :inputDataValue="retrieveFieldValue(currentData, field.id)"
          :isNew="currentData.isNew"
          :editMode="editMode"
          :current-id="currentData._id"
          @signal-input="reactToFieldUpdate($event, field)"
          />

          <Field_Wysiwyg
          class="inputWrapper"
          :class="'field-'+field.id+'-'+currentData._id"
          v-if="field.type === 'wysiwyg' && categoryFieldFilter(field.id)"
          :inputDataBluePrint="field"
          :inputDataValue="(retrieveFieldValue(currentData, field.id)) ? retrieveFieldValue(currentData, field.id) : ''"
          :isNew="currentData.isNew"
          :fullScreenStatus="currentData.hasFullScreenEditMode"
          :fullScreenScrollDistance="currentData.fullScreenScrollDistance"
          :editMode="editMode"
          :current-id="currentData._id"
          @signal-input="reactToFieldUpdate($event, field)"
          @signal-full-screen-status-change="reactToFullScreenStatusChange($event)"
          />

          <Field_Tags
          class="inputWrapper"
          :class="'field-'+field.id+'-'+currentData._id"
          v-if="field.type === 'tags' && categoryFieldFilter(field.id)"
          :inputDataBluePrint="field"
          :inputDataValue="retrieveFieldValue(currentData, field.id)"
          :isNew="currentData.isNew"
          :editMode="editMode"
          @signal-input="reactToFieldUpdate($event, field)"
          />

          <Field_DocumentTemplate
          class="inputWrapper"
          :class="'field-'+field.id+'-'+currentData._id"
          v-if="field.type === 'documentTemplate'"
          :inputDataBluePrint="field"
          :inputDataValue="retrieveFieldValue(currentData, field.id)"
          :isNew="currentData.isNew"
          :editMode="editMode"
          @signal-input="reactToFieldUpdate($event, field)"
          />

      </div>

    </div>

  </q-page>
</template>

<script setup lang="ts">
import { ref, watch, getCurrentInstance, onMounted, onUnmounted } from "vue"
import { useRoute, useRouter } from "vue-router"
import { useQuasar } from "quasar"

import type { I_Blueprint, I_ExtraFields } from "src/interfaces/I_Blueprint"
import { extend } from "quasar"
import type { I_OpenedDocument, I_ShortenedDocument, I_HasFullScreenEditMode } from "src/interfaces/I_OpenedDocument"
import { copyDocument } from "src/scripts/documentActions/copyDocument"

import { saveDocument } from "src/scripts/databaseManager/documentManager"
import deleteDocumentCheckDialog from "src/components/dialogs/DeleteDocumentCheck.vue"
import { retrieveAllDocumentTemplatesFromDB } from "src/scripts/projectManagement/documentTemplates"

import Field_Break from "src/components/fields/Field_Break.vue"
import Field_Text from "src/components/fields/Field_Text.vue"
import Field_Number from "src/components/fields/Field_Number.vue"
import Field_Switch from "src/components/fields/Field_Switch.vue"
import Field_ColorPicker from "src/components/fields/Field_ColorPicker.vue"
import Field_List from "src/components/fields/Field_List.vue"
import Field_SingleSelect from "src/components/fields/Field_SingleSelect.vue"
import Field_MultiSelect from "src/components/fields/Field_MultiSelect.vue"
import Field_SingleRelationship from "src/components/fields/Field_SingleRelationship.vue"
import Field_MultiRelationship from "src/components/fields/Field_MultiRelationship.vue"
import Field_Wysiwyg from "src/components/fields/Field_Wysiwyg.vue"
import Field_Tags from "src/components/fields/Field_Tags.vue"
import Field_DocumentTemplate from "src/components/fields/Field_DocumentTemplate.vue"

import { updateLastOpenedDocuments } from "src/scripts/projectManagement/projectManagent"
import type { I_DocumentTemplate } from "src/interfaces/I_DocumentTemplate"

import { useAppStores } from "src/composables/useAppStores"
import { useDocumentHelpers } from "src/composables/useDocumentHelpers"

const route = useRoute()
const router = useRouter()
const q = useQuasar()
const instance = getCurrentInstance()

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
  retrieveFieldValue,
  retrieveFieldType,
  determineLegacyField,
  findRequestedOrActiveDocument,
  addNewObjectRoute,
  openDocumentPreviewPanel,
  mapShortDocument
} = useDocumentHelpers()

/****************************************************************/
// LOCAL SETTINGS
/****************************************************************/

watch(() => optionsStore.getOptions, () => {
  const options = optionsStore.getOptions
  disableDocumentControlBar.value = options.disableDocumentControlBar
  isDarkMode.value = options.darkMode
  hideEmptyFields.value = options.hideEmptyFields
  hideDocumentTitles.value = options.hideDocumentTitles
  preventAutoScroll.value = options.preventAutoScroll
  showDocumentID.value = options.showDocumentID
}, { immediate: true, deep: true })

const hideDocumentTitles = ref(false)
const showDocumentID = ref(false)
const preventAutoScroll = ref(false)
const disableDocumentControlBar = ref(false)
const isDarkMode = ref(false)
const hideEmptyFields = ref(false)

/****************************************************************/
// BASIC DATA
/****************************************************************/

const bluePrintData = ref(false as unknown as I_Blueprint)
const hasEdits = ref(false)
const editMode = ref(false)
const currentData = ref(false as unknown as I_OpenedDocument)
const localDataCopy = ref(false as unknown as I_OpenedDocument)
const extraClasses = ref("")

/****************************************************************/
// DOCUMENT FUNCTIONALITY
/****************************************************************/

watch(route, async () => {
  documentTemplateList.value = await retrieveAllDocumentTemplatesFromDB()
  const doc = findRequestedOrActiveDocument() as I_OpenedDocument

  window.scrollTo({ top: 0, behavior: "auto" })

  reloadLocalContent()

  await instance?.proxy?.$nextTick()
  setTimeout(() => {
    routeTransitionFinished.value = true
  }, 50)

  setTimeout(() => {
    const scrollTop = (doc.scrollDistance && !preventAutoScroll.value) ? doc.scrollDistance : 0
    window.scrollTo({ top: scrollTop, behavior: "auto" })
  }, 100)
}, { immediate: true, deep: true })

// created equivalent
window.addEventListener("scroll", watchPageScroll)

onUnmounted(() => {
  window.removeEventListener("scroll", watchPageScroll)
})

const documentTemplateList = ref<I_DocumentTemplate[]>([])

const decounceScrollTimer = ref(false as any)

const routeTransitionFinished = ref(false)

function watchPageScroll () {
  if (preventAutoScroll.value) {
    return
  }

  if (decounceScrollTimer.value) {
    window.clearTimeout(decounceScrollTimer.value)
  }

  decounceScrollTimer.value = window.setTimeout(() => {
    const currentScroll = window.scrollY

    const dataCopy: I_OpenedDocument = extend(true, {}, findRequestedOrActiveDocument())

    dataCopy.scrollDistance = currentScroll

    if (currentData.value._id !== undefined) {
      const dataPass = { doc: dataCopy, treeAction: false }
      openedDocumentsStore.updateDocument(dataPass)
    }
  }, 100)
}

function checkHasEdits () {
  const currentDocument = findRequestedOrActiveDocument()

  if (currentDocument && currentDocument.hasEdits) {
    hasEdits.value = true
  }
  else {
    hasEdits.value = false
  }
}

watch(() => openedDocumentsStore.getAllDocuments, async () => {
  checkHasEdits()

  await sleep(100)

  const matchingDoc = findRequestedOrActiveDocument()
  if (matchingDoc && matchingDoc._id === currentData.value._id && !matchingDoc.hasEdits) {
    reloadLocalContent()
  }
}, { deep: true })

function reloadLocalContent () {
  bluePrintData.value = retrieveDocumentBlueprint()

  let retrievedObject = false as unknown as I_OpenedDocument | I_ShortenedDocument

  if (allDocumentsStore.getDocument(route.params.id as string)) {
    retrievedObject = allDocumentsStore.getDocument(route.params.id as string)
  }

  if (openedDocumentsStore.getDocument(route.params.id as string)) {
    retrievedObject = openedDocumentsStore.getDocument(route.params.id as string)
  }

  currentData.value = (retrievedObject) ? extend(true, [], retrievedObject) : createNewDocumentObject()

  // @ts-ignore
  extraClasses.value = (retrieveFieldValue(currentData.value, "extraClasses")) ? retrieveFieldValue(currentData.value, "extraClasses") : ""

  if (!currentData.value) {
    router.push({ path: "/project" }).catch((e: {name: string}) => {
      if (e && e.name !== "NavigationDuplicated") {
        console.log(e)
      }
    })
    return
  }

  const objectFields = mapNewObjectFields()

  if (!objectFields) {
    return
  }

  currentData.value.extraFields = objectFields

  if (currentData.value.editMode) {
    editMode.value = true
  }
  else {
    editMode.value = false
  }

  if (route.query?.editMode) {
    editMode.value = true
    currentData.value.editMode = true
    const query = Object.assign({}, route.query)
    delete query.editMode
    router.replace({ query }).catch(e => console.log(e))
  }

  const dataCopy: I_OpenedDocument = extend(true, {}, currentData.value)

  const dataPass = { doc: dataCopy, treeAction: false }
  openedDocumentsStore.addDocument(dataPass)

  if (!currentData.value.isNew) {
    updateLastOpenedDocuments(currentData.value._id, projectStore.currentProjectId)
  }
}

function reactToFieldUpdate (inputData: string, field: I_ExtraFields) {
  // FIELD - Text
  if (field.type === "text") {
    currentData.value.hasEdits = true
    const indexToUpdate = currentData.value.extraFields.findIndex(s => s.id === field.id)
    currentData.value.extraFields[indexToUpdate].value = inputData

    localDataCopy.value = extend(true, {}, currentData.value)
    const dataPass = { doc: localDataCopy.value, treeAction: false }
    openedDocumentsStore.updateDocument(dataPass)
  }

  // FIELD - Number
  if (field.type === "number") {
    currentData.value.hasEdits = true
    const indexToUpdate = currentData.value.extraFields.findIndex(s => s.id === field.id)
    currentData.value.extraFields[indexToUpdate].value = inputData

    localDataCopy.value = extend(true, {}, currentData.value)
    const dataPass = { doc: localDataCopy.value, treeAction: false }
    openedDocumentsStore.updateDocument(dataPass)
  }

  // FIELD - Switch
  if (field.type === "switch") {
    currentData.value.hasEdits = true
    const indexToUpdate = currentData.value.extraFields.findIndex(s => s.id === field.id)
    currentData.value.extraFields[indexToUpdate].value = inputData

    localDataCopy.value = extend(true, {}, currentData.value)
    const dataPass = { doc: localDataCopy.value, treeAction: false }
    openedDocumentsStore.updateDocument(dataPass)

    if (field.id === "categorySwitch") {
      const localCopy: I_Blueprint = (extend(true, {}, bluePrintData.value))
      const blueprintUpdateCopy: I_Blueprint = (extend(true, {}, bluePrintData.value))
      blueprintUpdateCopy.extraFields = []

      blueprintsStore.setBlueprint(blueprintUpdateCopy)
      retrieveDocumentBlueprint()
      blueprintsStore.setBlueprint(localCopy)
      retrieveDocumentBlueprint()
    }
  }

  // FIELD - Color Picker
  if (field.type === "colorPicker") {
    currentData.value.hasEdits = true
    const indexToUpdate = currentData.value.extraFields.findIndex(s => s.id === field.id)
    currentData.value.extraFields[indexToUpdate].value = inputData

    localDataCopy.value = extend(true, {}, currentData.value)
    const dataPass = { doc: localDataCopy.value, treeAction: false }
    openedDocumentsStore.updateDocument(dataPass)
  }

  // FIELD - List
  if (field.type === "list") {
    currentData.value.hasEdits = true
    const indexToUpdate = currentData.value.extraFields.findIndex(s => s.id === field.id)
    currentData.value.extraFields[indexToUpdate].value = inputData

    localDataCopy.value = extend(true, {}, currentData.value)
    const dataPass = { doc: localDataCopy.value, treeAction: false }
    openedDocumentsStore.updateDocument(dataPass)
  }

  // FIELD - Simple select
  if (field.type === "singleSelect") {
    currentData.value.hasEdits = true
    const indexToUpdate = currentData.value.extraFields.findIndex(s => s.id === field.id)
    currentData.value.extraFields[indexToUpdate].value = inputData

    localDataCopy.value = extend(true, {}, currentData.value)
    const dataPass = { doc: localDataCopy.value, treeAction: false }
    openedDocumentsStore.updateDocument(dataPass)
  }

  // FIELD - Multi select
  if (field.type === "multiSelect") {
    currentData.value.hasEdits = true
    const indexToUpdate = currentData.value.extraFields.findIndex(s => s.id === field.id)
    currentData.value.extraFields[indexToUpdate].value = inputData

    localDataCopy.value = extend(true, {}, currentData.value)
    const dataPass = { doc: localDataCopy.value, treeAction: false }
    openedDocumentsStore.updateDocument(dataPass)
  }

  // FIELD - Single relationship
  if (field.type === "singleToNoneRelationship" || field.type === "singleToManyRelationship" || field.type === "singleToSingleRelationship") {
    currentData.value.hasEdits = true
    const indexToUpdate = currentData.value.extraFields.findIndex(s => s.id === field.id)
    currentData.value.extraFields[indexToUpdate].value = inputData

    localDataCopy.value = extend(true, {}, currentData.value)
    const dataPass = { doc: localDataCopy.value, treeAction: false }

    openedDocumentsStore.updateDocument(dataPass)
  }

  // FIELD - Multi relationship
  if (field.type === "manyToNoneRelationship" || field.type === "manyToSingleRelationship" || field.type === "manyToManyRelationship") {
    currentData.value.hasEdits = true
    const indexToUpdate = currentData.value.extraFields.findIndex(s => s.id === field.id)
    currentData.value.extraFields[indexToUpdate].value = inputData

    localDataCopy.value = extend(true, {}, currentData.value)
    const dataPass = { doc: localDataCopy.value, treeAction: false }
    // @ts-ignore
    if (inputData.isSilent) {
      dataPass.doc.hasEdits = false
    }

    openedDocumentsStore.updateDocument(dataPass)
  }

  // FIELD - Wysiwyg
  if (field.type === "wysiwyg") {
    currentData.value.hasEdits = true
    const indexToUpdate = currentData.value.extraFields.findIndex(s => s.id === field.id)
    currentData.value.extraFields[indexToUpdate].value = inputData

    localDataCopy.value = extend(true, {}, currentData.value)
    const dataPass = { doc: localDataCopy.value, treeAction: false }
    openedDocumentsStore.updateDocument(dataPass)
  }

  // FIELD - Tags
  if (field.type === "tags") {
    currentData.value.hasEdits = true
    const indexToUpdate = currentData.value.extraFields.findIndex(s => s.id === field.id)

    currentData.value.extraFields[indexToUpdate].value = inputData

    localDataCopy.value = extend(true, {}, currentData.value)
    const dataPass = { doc: localDataCopy.value, treeAction: false }
    openedDocumentsStore.updateDocument(dataPass)
  }

  // FIELD - Document template
  if (field.type === "documentTemplate") {
    currentData.value.hasEdits = true
    const indexToUpdate = currentData.value.extraFields.findIndex(s => s.id === field.id)
    currentData.value.extraFields[indexToUpdate].value = inputData

    localDataCopy.value = extend(true, {}, currentData.value)
    const dataPass = { doc: localDataCopy.value, treeAction: true }
    openedDocumentsStore.updateDocument(dataPass)
  }
}

function reactToFullScreenStatusChange (inputScreenStatus: I_HasFullScreenEditMode) {
  currentData.value.hasFullScreenEditMode = inputScreenStatus

  localDataCopy.value = extend(true, {}, currentData.value)
  const dataPass = { doc: localDataCopy.value, treeAction: false }
  openedDocumentsStore.updateDocument(dataPass)
}

function retrieveDocumentBlueprint (): I_Blueprint {
  bluePrintData.value = blueprintsStore.getBlueprint(route.params.type as string)
  return blueprintsStore.getBlueprint(route.params.type as string)
}

function mapNewObjectFields () {
  const currentExtraFields = (currentData.value && currentData.value.extraFields) ? currentData.value.extraFields : []

  const blueprint = retrieveDocumentBlueprint()

  if (!blueprint) {
    return false
  }

  for (const field of blueprint.extraFields) {
    const exists = currentExtraFields.find(f => {
      return f.id === field.id
    })

    if (!exists) {
      if (field.id === "name") {
        currentExtraFields.push(
          {
            id: "name",
            value: `New ${bluePrintData.value.nameSingular.toLowerCase()}`
          }
        )
      }
      else if (field.id === "parentDoc") {
        if (route.query?.parent) {
          const parentID = route.query.parent as string
          let retrievedObject = false as unknown as I_ShortenedDocument
          try {
            retrievedObject = allDocumentsStore.getDocument(parentID)
          }
          catch (error) {}

          currentExtraFields.push(
            {
              id: "parentDoc",
              value: {
                value: {
                  _id: retrievedObject._id,
                  value: retrievedObject._id,
                  type: bluePrintData.value._id,
                  disable: false,
                  url: retrievedObject.url,
                  label: retrieveFieldValue(retrievedObject, "name"),
                  pairedField: ""
                },
                addedValues: {
                  pairedId: "",
                  value: ""
                }
              }
            }
          )
        }
        else {
          currentExtraFields.push({ id: field.id, value: "" })
        }
      }
      else if (field.id === "tags") {
        if (route.query?.tag) {
          const tag = route.query.tag as string
          currentExtraFields.push(
            {
              id: "tags",
              value: [tag]
            }
          )
        }
        else {
          currentExtraFields.push({ id: field.id, value: "" })
        }
      }
      else {
        currentExtraFields.push({ id: field.id, value: "" })
      }
    }
  }

  return currentExtraFields
}

function createNewDocumentObject (): I_OpenedDocument {
  editMode.value = true

  if (!route.params.id || !bluePrintData.value) {
    // @ts-ignore
    return false
  }

  const uniqueID = route.params.id as string
  return {
    _id: uniqueID,
    type: bluePrintData.value._id,
    icon: bluePrintData.value.icon,
    editMode: true,
    isNew: true,
    isFinished: false,
    hasEdits: false,
    url: `/project/display-content/${bluePrintData.value._id}/${uniqueID}`,
    extraFields: []
  }
}

function categoryFieldFilter (currentFieldID: string) {
  const isCategory = retrieveFieldValue(currentData.value, "categorySwitch")

  const ignoredList = ["breakDocumentSettings", "name", "documentColor", "documentBackgroundColor", "parentDoc", "order", "categorySwitch", "minorSwitch", "deadSwitch", "finishedSwitch", "tags", "otherNames", "docTemplate"]
  return (
    (
      (!isCategory && currentFieldID !== "categoryDescription") ||
      ignoredList.includes(currentFieldID)
    ) || (isCategory && currentFieldID === "categoryDescription")
  )
}

function checkBreakSectionValues (field: any) {
  if (field.type !== "break") {
    return true
  }

  const fullFieldLength = bluePrintData.value.extraFields.length
  let matchedIndex = bluePrintData.value.extraFields.findIndex(f => f.id === field.id)
  let matchedField = bluePrintData.value.extraFields[matchedIndex + 1]
  while (matchedField.type !== "break" || matchedIndex + 1 === fullFieldLength) {
    matchedField = bluePrintData.value.extraFields[matchedIndex + 1]

    if (!matchedField || matchedField.type === "break") {
      return false
    }

    const hasValue = hasValueFieldFilter(matchedField)
    if (hasValue) {
      return true
    }
    matchedIndex++
  }

  return false
}

function checkForLegacyFieldValue (document: I_OpenedDocument | I_ShortenedDocument, field: {id: string}) {
  const isLegacyField = determineLegacyField(document, field.id)

  if (!isLegacyField) {
    return true
  }

  const value = retrieveFieldValue(currentData.value, field.id)

  let hasValue = true

  if (!value ||
  (typeof value === "string" && value.length === 0) ||
  // @ts-ignore
  (typeof value.value === "string" && value.value.length === 0) ||
  // @ts-ignore
  (Array.isArray(value) && value.length === 0) ||
  // @ts-ignore
  (value.value && value.value.length === 0) ||
  // @ts-ignore
   (value.value === null)) {
    hasValue = false
  }

  if (isLegacyField && hasValue) {
    return true
  }

  return false
}

function hasValueFieldFilter (field: any) {
  if (retrieveFieldType(currentData.value, field.id) === "break") {
    return true
  }
  if (!hideEmptyFields.value && !retrieveFieldValue(currentData.value, "finishedSwitch")) {
    return true
  }

  const value = retrieveFieldValue(currentData.value, field.id)

  if (!value ||
  (Array.isArray(value) && value.length === 0) ||
  // @ts-ignore
   (value?.value?.length === 0) ||
  // @ts-ignore
   (value.value === null)) {
    return false
  }

  return true
}

/****************************************************************/
// RESPONSIVE COLLUMN STYLES
/****************************************************************/

function determineSize_MD (field: I_ExtraFields) {
  if (field.type === "break") {
    return 12
  }
  if (field.sizing <= 6) {
    return 6
  }

  return field.sizing
}

function determineSize_LG (field: I_ExtraFields) {
  if (field.type === "break") {
    return 12
  }

  if (field.sizing <= 4) {
    return 4
  }

  return field.sizing
}

function determineSize_XL (field: I_ExtraFields) {
  if (field.type === "break") {
    return 12
  }
  return field.sizing
}

/****************************************************************/
// DELETE DIALOG
/****************************************************************/

const deleteObjectDialogTrigger = ref<string | false>(false)
function deleteObjectDialogClose () {
  deleteObjectDialogTrigger.value = false
}

function deleteObjectAssignUID () {
  deleteObjectDialogTrigger.value = generateUID()
}

/****************************************************************/
// ADD NEW DOCUMENT UNDER PARENT
/****************************************************************/
function addNewUnderParent () {
  const currentDoc = findRequestedOrActiveDocument()
  if (currentDoc) {
    const routeObject = {
      _id: currentDoc.type,
      parent: currentDoc._id
    }
    // @ts-ignore
    addNewObjectRoute(routeObject)
  }
}

/****************************************************************/
// DOCUMENT COPY
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
// DOCUMENT ACTIONS
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

async function saveCurrentDocument (keepEditMode: boolean) {
  if (document.activeElement && keepEditMode === false) {
    (document.activeElement as HTMLElement).blur()
  }

  const currentDoc = findRequestedOrActiveDocument()

  // @ts-ignore
  const isNew = currentDoc.isNew

  const allDocuments = openedDocumentsStore.getAllDocuments

  const openedDocumentsCopy: I_OpenedDocument[] = extend(true, [], allDocuments.docs)

  if (currentDoc) {
    const docCopy: I_OpenedDocument = extend(true, [], currentDoc)
    // @ts-ignore
    const savedDocument: {
      documentCopy: I_OpenedDocument,
      allOpenedDocuments: I_OpenedDocument[]
    } = await saveDocument(docCopy, openedDocumentsCopy, allDocumentsStore.getAllDocuments.docs, keepEditMode, { SGET_allDocuments: allDocumentsStore.getAllDocuments, SGET_allDocumentsByType: (id: string) => allDocumentsStore.getDocumentsByType(id), SSET_updateDocument: (p: any) => allDocumentsStore.updateDocument(p), SSET_addDocument: (p: any) => allDocumentsStore.addDocument(p) })

    const dataPass = { doc: savedDocument.documentCopy, treeAction: true }
    openedDocumentsStore.updateDocument(dataPass)

    if (!isNew) {
      // @ts-ignore
      allDocumentsStore.updateDocument({ doc: mapShortDocument(savedDocument.documentCopy, allDocumentsStore.getDocumentsByType(savedDocument.documentCopy.type).docs) })
    }
    else {
      // @ts-ignore
      allDocumentsStore.addDocument({ doc: mapShortDocument(savedDocument.documentCopy, allDocumentsStore.getDocumentsByType(savedDocument.documentCopy.type).docs) })
    }

    for (const doc of savedDocument.allOpenedDocuments) {
      const dataPass = { doc: doc, treeAction: true }
      openedDocumentsStore.updateDocument(dataPass)

      // @ts-ignored
      allDocumentsStore.updateDocument({ doc: mapShortDocument(doc, allDocumentsStore.getDocumentsByType(doc.type).docs) })
    }

    q.notify({
      group: false,
      type: "positive",
      message: "Document successfully saved"
    })
  }
}

/****************************************************************/
// Open current document in sidebar
/****************************************************************/
function openThisDocumentInSidebar () {
  const currentDoc = findRequestedOrActiveDocument() as I_OpenedDocument
  openDocumentPreviewPanel(currentDoc._id)
}

const idCopy = ref<any>(null)

function copyID () {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  idCopy.value?.select()
  document.execCommand("copy")

  q.notify({
    group: false,
    type: "positive",
    message: "Document ID Copied"
  })
}

function triggerExport () {
  const localId = currentData.value._id
  dialogsStore.setExportDialogState([localId])
}

function checkDocumentTemplate (id: string) {
  const ignoredList = ["breakDocumentSettings", "name", "documentColor", "documentBackgroundColor", "parentDoc", "order", "categorySwitch", "minorSwitch", "deadSwitch", "finishedSwitch", "tags", "docTemplate"]

  if (ignoredList.includes(id)) {
    return true
  }

  const selectedTemplate = retrieveFieldValue(currentData.value, "docTemplate")

  if (!selectedTemplate) {
    return true
  }

  const matchedDocumentTemplate = documentTemplateList.value.find(e => e.id === selectedTemplate)

  if (!matchedDocumentTemplate) {
    return true
  }

  const matchedDocumentType = matchedDocumentTemplate.documentTypeList.find(e => e.documentTypeID === bluePrintData.value._id)

  if (!matchedDocumentType) {
    return true
  }

  if (matchedDocumentType.excludedFieldIDList.includes(id)) {
    return false
  }

  return true
}
</script>

<style lang="scss" scoped>
.inputWrapper {
  min-height: 95px;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  height: 100%;

  &.break {
    min-height: inherit;
  }
}
</style>

<style lang="scss">
.documentColumnWrapper {
  flex-grow: 1;

  &.isLegacy {
    border: 1px dashed $primary;
    padding: 30px;
    margin-left: 20px;
    max-width: 98%;
    margin-top: 20px;
    background-color: rgba($secondary, 0.15);
  }
}

.separatorWrapper {
  margin-top: auto;
}

.q-field {
  max-width: 100%;
}

.documentDisplay {
  visibility: hidden !important;

  &.routeTransitionFinished{
    visibility: visible !important;
  }

  &.hiddenFields {
    padding-top: 105px;
  }

  .localControlRow {
    position: absolute;
    right: 48px;
    top: 50px;
  }

  /* WebKit/Blink Browsers */
  ::selection {
    background: lighten($dark, 30);
    color: white;
  }

  /* Gecko Browsers */
  ::-moz-selection {
    background: lighten($dark, 30);
    color: white;
  }
}

body:not(.body--dark) {

  .documentDisplay {

  a,
  .text-primary{
    color: #e6ae2b !important;
  }

    .isDead {
      text-decoration-color: #000;
    }
  }
}

body.body--dark {
  .documentDisplay {

    /* WebKit/Blink Browsers */
    ::selection {
      color: lighten($primary, 25);
      background: lighten($secondary, 7);
    }

    /* Gecko Browsers */
    ::-moz-selection {
      color: lighten($primary, 25);
      background: lighten($secondary, 7);
    }
    $darkModeText: #dcdcdc;

    color: $darkModeText;

    .connectionList .connectionNote,
    .listNote {
      color: $darkModeText;
      opacity: 0.9;
    }

    .q-list--dark,
    .q-item--dark,
    .q-field--dark .q-field__native,
    .q-field--dark .q-field__prefix,
    .q-field--dark .q-field__suffix,
    .q-field--dark .q-field__input {
      color: $darkModeText;
    }

    .q-separator {
      opacity: 0.85;
      background-color: $primary !important;
    }

    .q-field--dark .q-field__control::before {
      background-color: rgba(255, 255, 255, 0.1);
      opacity: 0.6;
      border: none;
    }

    .tagSelect,
    .singleSelect,
    .multiSelect,
    .singleRelashionshipSelect,
    .multiRelashionshipSelect,
    .existingDocumentSelect,
    .newDocumentSelect {
      &.q-field--dark .q-field__control::before {
        border: none;
      }

      .relationshipChipNewTab,
      .q-field__input,
      .q-icon,
      .q-field__native span {
        color: $darkModeText !important;

        .q-icon,
        &.q-chip__icon--remove {
          color: #000 !important;
        }
      }
    }
  }
}
</style>
