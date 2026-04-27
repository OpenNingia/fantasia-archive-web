<template>
 <q-tooltip
  content-class="documentPreviewWrapper tooltip"
  :content-style="`z-index: ${specialZIndex} !important;`"
  :delay="customDelay"
  max-width="700px"
  max-height="600px"
  v-if="displayMode === 'tooltip'"
  :target="customTarget"
  :offset="[0, 0]"
  :anchor="customAnchor"
  :self="customSelf"
  @before-show="openDocumentPreview"
  @before-hide="consitentDocumentPreviewSwitch"
  v-model="documentPreviewSwitch"
  transition-show="scale"
  transition-hide="scale"
  ref="documentPreview"
  >
    <div
      v-if="localBlueprint"
      class="documentPreviewContent"
      @mouseenter="clearCloseTimer"
      @mouseleave="setCloseTimer"
    >
     <div
        v-for="field in localBlueprint.extraFields"
        :key="`${field.id}`"
        class="col-12 q-mb-md"
        v-show="retrieveFieldType(localDocument, field.id) !== 'break' && hasValueFieldFilter(field) && !determineLegacyField(localDocument, field.id) && checkDocumentTemplate(field.id)"
      >

        <Field_Break
        class="inputWrapper break"
        v-if="field.type === 'break' && categoryFieldFilter(field.id)"
        :inputDataBluePrint="field"
        :inputDataValue="retrieveFieldValue(localDocument, field.id)"
        :recursive="true"
        />

        <Field_Text
        class="inputWrapper"
        :class="'field-'+field.id+'-'+localDocument._id"
        v-if="field.type === 'text' && categoryFieldFilter(field.id)"
        :inputDataBluePrint="field"
        :inputDataValue="retrieveFieldValue(localDocument, field.id)"
        :isNew="false"
        :editMode="false"
        />

        <Field_Number
        class="inputWrapper"
        :class="'field-'+field.id+'-'+localDocument._id"
        v-if="field.type === 'number' && categoryFieldFilter(field.id)"
        :inputDataBluePrint="field"
        :inputDataValue="retrieveFieldValue(localDocument, field.id)"
        :isNew="false"
        :editMode="false"
        />

        <Field_Switch
        class="inputWrapper"
        :class="'field-'+field.id+'-'+localDocument._id"
        v-if="field.type === 'switch' && categoryFieldFilter(field.id)"
        :inputDataBluePrint="field"
        :inputDataValue="retrieveFieldValue(localDocument, field.id)"
        :isNew="false"
        :editMode="false"
        />

        <Field_ColorPicker
        class="inputWrapper"
        :class="'field-'+field.id+'-'+localDocument._id"
        v-if="field.type === 'colorPicker' && categoryFieldFilter(field.id)"
        :inputDataBluePrint="field"
        :inputDataValue="retrieveFieldValue(localDocument, field.id)"
        :isNew="false"
        :editMode="false"
        />

        <Field_List
        class="inputWrapper"
        :class="'field-'+field.id+'-'+localDocument._id"
        v-if="field.type === 'list' && categoryFieldFilter(field.id)"
        :inputDataBluePrint="field"
        :inputDataValue="retrieveFieldValue(localDocument, field.id)"
        :isNew="false"
        :editMode="false"
        />

        <Field_SingleSelect
        class="inputWrapper"
        :class="'field-'+field.id+'-'+localDocument._id"
        v-if="field.type === 'singleSelect' && categoryFieldFilter(field.id)"
        :inputDataBluePrint="field"
        :inputDataValue="retrieveFieldValue(localDocument, field.id)"
        :isNew="false"
        :editMode="false"
        />

        <Field_MultiSelect
        class="inputWrapper"
        :class="'field-'+field.id+'-'+localDocument._id"
        v-if="field.type === 'multiSelect' && categoryFieldFilter(field.id)"
        :inputDataBluePrint="field"
        :inputDataValue="retrieveFieldValue(localDocument, field.id)"
        :isNew="false"
        :editMode="false"
        />

        <Field_SingleRelationship
        class="inputWrapper"
        :class="'field-'+field.id+'-'+localDocument._id"
        v-if="(field.type === 'singleToNoneRelationship' || field.type === 'singleToSingleRelationship' || field.type === 'singleToManyRelationship') && categoryFieldFilter(field.id)"
        :quickInsertMode="quickInsertMode"
        :inputDataBluePrint="field"
        :inputDataValue="retrieveFieldValue(localDocument, field.id)"
        :isNew="false"
        :editMode="false"
        :current-id="localDocument._id"
        :recursive="true"
        :special-z-index="(specialZIndex)"
        @menu-mode="reactToMenuMode"
        @menu-enter="reactToMenuEnter"
        @menu-leave="reactToMenuLeave"
        @set-new-parent-id="setOtherContent"
        />

        <Field_MultiRelationship
        class="inputWrapper"
        :class="'field-'+field.id+'-'+localDocument._id"
        v-if="(field.type === 'manyToNoneRelationship' || field.type ===
        'manyToSingleRelationship' || field.type === 'manyToManyRelationship') && categoryFieldFilter(field.id)"
        :quickInsertMode="quickInsertMode"
        :inputDataBluePrint="field"
        :inputDataValue="retrieveFieldValue(localDocument, field.id)"
        :isNew="false"
        :editMode="false"
        :current-id="localDocument._id"
        :recursive="true"
        :special-z-index="specialZIndex"
        @menu-mode="reactToMenuMode"
        @menu-enter="reactToMenuEnter"
        @menu-leave="reactToMenuLeave"
        @set-new-parent-id="setOtherContent"
        />

        <Field_Wysiwyg
        class="inputWrapper"
        :class="'field-'+field.id+'-'+localDocument._id"
        v-if="field.type === 'wysiwyg' && categoryFieldFilter(field.id)"
        :inputDataBluePrint="field"
        :inputDataValue="(retrieveFieldValue(localDocument, field.id)) ? retrieveFieldValue(localDocument, field.id) : ''"
        :isNew="false"
        :editMode="false"
        :current-id="localDocument._id"
        />

        <Field_Tags
        class="inputWrapper"
        :class="'field-'+field.id+'-'+localDocument._id"
        v-if="field.type === 'tags' && categoryFieldFilter(field.id)"
        :inputDataBluePrint="field"
        :inputDataValue="retrieveFieldValue(localDocument, field.id)"
        :isNew="false"
        :editMode="false"
        />

     </div>

    </div>

  </q-tooltip>

  <div
  class="documentPreviewWrapper"
  v-else
  @mouseenter="disableScroll"
  @mouseleave="enableScroll"
  >
    <div
      v-if="localBlueprint"
      class="documentPreviewContent -fullsize"
    >
     <div
        v-for="field in localBlueprint.extraFields"
        :key="`${field.id}`"
        class="col-12 q-mb-md"
        v-show="retrieveFieldType(localDocument, field.id) !== 'break' && hasValueFieldFilter(field) && !determineLegacyField(localDocument, field.id)"
      >

        <Field_Break
        class="inputWrapper break"
        v-if="field.type === 'break' && categoryFieldFilter(field.id)"
        :inputDataBluePrint="field"
        :inputDataValue="retrieveFieldValue(localDocument, field.id)"
        />

        <Field_Text
        class="inputWrapper"
        :class="'field-'+field.id+'-'+localDocument._id"
        v-if="field.type === 'text' && categoryFieldFilter(field.id)"
        :inputDataBluePrint="field"
        :inputDataValue="retrieveFieldValue(localDocument, field.id)"
        :isNew="false"
        :editMode="false"
        />

        <Field_Number
        class="inputWrapper"
        :class="'field-'+field.id+'-'+localDocument._id"
        v-if="field.type === 'number' && categoryFieldFilter(field.id)"
        :inputDataBluePrint="field"
        :inputDataValue="retrieveFieldValue(localDocument, field.id)"
        :isNew="false"
        :editMode="false"
        />

        <Field_Switch
        class="inputWrapper"
        :class="'field-'+field.id+'-'+localDocument._id"
        v-if="field.type === 'switch' && categoryFieldFilter(field.id)"
        :inputDataBluePrint="field"
        :inputDataValue="retrieveFieldValue(localDocument, field.id)"
        :isNew="false"
        :editMode="false"
        />

        <Field_ColorPicker
        class="inputWrapper"
        :class="'field-'+field.id+'-'+localDocument._id"
        v-if="field.type === 'colorPicker' && categoryFieldFilter(field.id)"
        :inputDataBluePrint="field"
        :inputDataValue="retrieveFieldValue(localDocument, field.id)"
        :isNew="false"
        :editMode="false"
        />

        <Field_List
        class="inputWrapper"
        :class="'field-'+field.id+'-'+localDocument._id"
        v-if="field.type === 'list' && categoryFieldFilter(field.id)"
        :inputDataBluePrint="field"
        :inputDataValue="retrieveFieldValue(localDocument, field.id)"
        :isNew="false"
        :editMode="false"
        />

        <Field_SingleSelect
        class="inputWrapper"
        :class="'field-'+field.id+'-'+localDocument._id"
        v-if="field.type === 'singleSelect' && categoryFieldFilter(field.id)"
        :inputDataBluePrint="field"
        :inputDataValue="retrieveFieldValue(localDocument, field.id)"
        :isNew="false"
        :editMode="false"
        />

        <Field_MultiSelect
        class="inputWrapper"
        :class="'field-'+field.id+'-'+localDocument._id"
        v-if="field.type === 'multiSelect' && categoryFieldFilter(field.id)"
        :inputDataBluePrint="field"
        :inputDataValue="retrieveFieldValue(localDocument, field.id)"
        :isNew="false"
        :editMode="false"
        />

        <Field_SingleRelationship
        class="inputWrapper"
        :class="'field-'+field.id+'-'+localDocument._id"
        v-if="(field.type === 'singleToNoneRelationship' || field.type === 'singleToSingleRelationship' || field.type === 'singleToManyRelationship') && categoryFieldFilter(field.id)"
        :quickInsertMode="quickInsertMode"
        :inputDataBluePrint="field"
        :inputDataValue="retrieveFieldValue(localDocument, field.id)"
        :isNew="false"
        :editMode="false"
        :current-id="localDocument._id"
        :side-document-preview="true"
        @set-new-parent-id="setOtherContentSidebar"
        />

        <Field_MultiRelationship
        class="inputWrapper"
        :class="'field-'+field.id+'-'+localDocument._id"
        v-if="(field.type === 'manyToNoneRelationship' || field.type ===
        'manyToSingleRelationship' || field.type === 'manyToManyRelationship') && categoryFieldFilter(field.id)"
        :quickInsertMode="quickInsertMode"
        :inputDataBluePrint="field"
        :inputDataValue="retrieveFieldValue(localDocument, field.id)"
        :isNew="false"
        :editMode="false"
        :current-id="localDocument._id"
        :side-document-preview="true"
        @set-new-parent-id="setOtherContentSidebar"
        />

        <Field_Wysiwyg
        class="inputWrapper"
        :class="'field-'+field.id+'-'+localDocument._id"
        v-if="field.type === 'wysiwyg' && categoryFieldFilter(field.id)"
        :inputDataBluePrint="field"
        :inputDataValue="(retrieveFieldValue(localDocument, field.id)) ? retrieveFieldValue(localDocument, field.id) : ''"
        :isNew="false"
        :editMode="false"
        :current-id="localDocument._id"
        />

        <Field_Tags
        class="inputWrapper"
        :class="'field-'+field.id+'-'+localDocument._id"
        v-if="field.type === 'tags' && categoryFieldFilter(field.id)"
        :inputDataBluePrint="field"
        :inputDataValue="retrieveFieldValue(localDocument, field.id)"
        :isNew="false"
        :editMode="false"
        />

     </div>

    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, watch, getCurrentInstance } from "vue"

import type { I_ShortenedDocument } from "src/interfaces/I_OpenedDocument"
import type { I_Blueprint } from "src/interfaces/I_Blueprint"

import Field_Break from "src/components/fields/Field_Break.vue"
import Field_Text from "src/components/fields/Field_Text.vue"
import Field_Number from "src/components/fields/Field_Number.vue"
import Field_Switch from "src/components/fields/Field_Switch.vue"
import Field_ColorPicker from "src/components/fields/Field_ColorPicker.vue"
import Field_List from "src/components/fields/Field_List.vue"
import Field_SingleSelect from "src/components/fields/Field_SingleSelect.vue"
import Field_MultiSelect from "src/components/fields/Field_MultiSelect.vue"
import Field_Tags from "src/components/fields/Field_Tags.vue"
import { extend } from "quasar"
import type { I_DocumentTemplate } from "src/interfaces/I_DocumentTemplate"
import { retrieveAllDocumentTemplatesFromDB } from "src/scripts/projectManagement/documentTemplates"

import Field_SingleRelationship from "src/components/fields/Field_SingleRelationship.vue"
import Field_MultiRelationship from "src/components/fields/Field_MultiRelationship.vue"
import Field_Wysiwyg from "src/components/fields/Field_Wysiwyg.vue"

import { useAppStores } from "src/composables/useAppStores"
import { useDocumentHelpers } from "src/composables/useDocumentHelpers"

const { blueprintsStore, allDocumentsStore, openedDocumentsStore, optionsStore } = useAppStores()
const { retrieveFieldValue, retrieveFieldType, determineLegacyField, openDocumentPreviewPanel } = useDocumentHelpers()

const instance = getCurrentInstance()

/****************************************************************/
// PROPS
/****************************************************************/

const props = withDefaults(defineProps<{
  externalCloseTrigger?: string
  documentId?: string
  displayMode?: string
  specialZIndex?: number
  customDelay?: number
  customTarget?: string | boolean
  customAnchor?: string
  customSelf?: string
  customCloseDelay?: number
  quickInsertMode?: boolean
}>(), {
  externalCloseTrigger: "",
  displayMode: "tooltip",
  specialZIndex: 999,
  customDelay: 750,
  customTarget: true,
  customAnchor: "bottom middle",
  customSelf: "top middle",
  customCloseDelay: 500,
  quickInsertMode: false
})

/****************************************************************/
// LOCAL CONTENT
/****************************************************************/

watch(() => props.externalCloseTrigger, () => {
  setCloseTimer()
})

function setOtherContent (id: string) {
  hasOtherContent.value = true
  setNewDocumentID(id).catch(e => console.log(e))
}

function setOtherContentSidebar (id: string) {
  openDocumentPreviewPanel(id)

  document.querySelectorAll(".documentPreviewWrapper").forEach(e => {
    e.scrollTop = 0
  })
}

const documentTemplateList = ref<I_DocumentTemplate[]>([])

async function setNewDocumentID (id: string) {
  localDocument.value = extend(true, {}, allDocumentsStore.getDocument(id))
  if (!localDocument.value) {
    // @ts-ignore
    localDocument.value = extend(true, {}, openedDocumentsStore.getDocument(id))
    documentTemplateList.value = await retrieveAllDocumentTemplatesFromDB()
  }
  if (localDocument.value) {
    localBlueprint.value = blueprintsStore.getBlueprint(localDocument.value.type)
    documentTemplateList.value = await retrieveAllDocumentTemplatesFromDB()

    await instance?.proxy?.$nextTick()

    document.querySelectorAll(".documentPreviewWrapper.tooltip").forEach(e => {
      e.scrollTop = 0
    })
  }
}

const localDocument = ref(false as unknown as I_ShortenedDocument)
const localBlueprint = ref(false as unknown as I_Blueprint)

watch(() => props.documentId, (val: string | undefined) => {
  if (props.documentId && val) {
    setNewDocumentID(val).catch(e => console.log(e))
  }
}, { immediate: true })

/**
 * Check if field should be showing if the category setting is turned on
 */
function categoryFieldFilter (currentFieldID: string) {
  const isCategory = retrieveFieldValue(localDocument.value, "categorySwitch")

  const ignoredList = ["breakDocumentSettings", "name", "documentColor", "documentBackgroundColor", "parentDoc", "order", "categorySwitch", "minorSwitch", "deadSwitch", "finishedSwitch", "tags", "otherNames"]
  return (
    (
      (!isCategory && currentFieldID !== "categoryDescription") ||
      ignoredList.includes(currentFieldID)
    ) || (isCategory && currentFieldID === "categoryDescription")
  )
}

/**
 * Checks if the field in question
 */
function hasValueFieldFilter (field: any) {
  if (retrieveFieldType(localDocument.value, field.id) === "break") {
    return true
  }

  const value = retrieveFieldValue(localDocument.value, field.id)

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
// GLOBAL OPTIONS
/****************************************************************/

const isDarkMode = ref(false)

watch(() => optionsStore.getOptions, () => {
  isDarkMode.value = optionsStore.getOptions.darkMode
}, { immediate: true, deep: true })

/****************************************************************/
// VISIBILITY MANAGEMENT
/****************************************************************/

function consitentDocumentPreviewSwitch () {
  if (documentPreviewLock.value) {
    documentPreviewSwitch.value = true
  }
}

function documentPreviewClose () {
  documentPreviewLock.value = false
  documentPreviewSwitch.value = false
  hasOtherContent.value = false
}

const documentPreviewLock = ref(false)
const documentPreviewSwitch = ref(false)

const hasOtherContent = ref(false)

function openDocumentPreview () {
  if (!hasOtherContent.value) {
    documentPreviewLock.value = true
    if (props.documentId) {
      setNewDocumentID(props.documentId).catch(e => console.log(e))
    }
  }
}

function clearCloseTimer () {
  disableScroll()
  clearTimeout(closeTimer.value)
}

function setCloseTimer () {
  enableScroll()
  closeTimer.value = setTimeout(() => {
    documentPreviewClose()
  }, props.customCloseDelay)
}

/**
 * Debounce timer for nice user experience
 */
const closeTimer = ref(null as any)

const menuMode = ref(false)

function reactToMenuMode (mode: boolean) {
  menuMode.value = mode
}

function reactToMenuEnter () {
  clearCloseTimer()
}

function reactToMenuLeave () {
  setCloseTimer()
}

const wheelOpt = { passive: false }
const wheelEvent = "onwheel" in document.createElement("div") ? "wheel" : "mousewheel"

function preventDefault (e: WheelEvent) {
  // @ts-ignore
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  const previewWrapper = e.target.closest(".documentPreviewWrapper")

  if (previewWrapper) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    const previewContent = previewWrapper.querySelector(".documentPreviewContent")

    const wheelDirection = (e.deltaY > 0) ? "down" : "up"

    if (wheelDirection === "up" && previewWrapper.scrollTop === 0) {
      e.preventDefault()
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    const combinedHeight = previewContent.getBoundingClientRect().height - previewWrapper.getBoundingClientRect().height

    if (wheelDirection === "down" && previewWrapper.scrollTop >= combinedHeight) {
      e.preventDefault()
    }
  }
}

function disableScroll () {
  // @ts-ignore
  window.addEventListener("DOMMouseScroll", preventDefault, false)
  // @ts-ignore
  window.addEventListener(wheelEvent, preventDefault, wheelOpt)
  // @ts-ignore
  window.addEventListener("touchmove", preventDefault, wheelOpt)
}

function enableScroll () {
  // @ts-ignore
  window.removeEventListener("DOMMouseScroll", preventDefault, false)
  // @ts-ignore
  window.removeEventListener(wheelEvent, preventDefault, wheelOpt)
  // @ts-ignore
  window.removeEventListener("touchmove", preventDefault, wheelOpt)
}

function checkDocumentTemplate (id: string) {
  const ignoredList = ["breakDocumentSettings", "name", "documentColor", "documentBackgroundColor", "parentDoc", "order", "categorySwitch", "minorSwitch", "deadSwitch", "finishedSwitch", "tags", "docTemplate"]

  if (ignoredList.includes(id)) {
    return true
  }

  const selectedTemplate = retrieveFieldValue(localDocument.value, "docTemplate")

  if (!selectedTemplate) {
    return true
  }

  const matchedDocumentTemplate = documentTemplateList.value.find(e => e.id === selectedTemplate)

  if (!matchedDocumentTemplate) {
    return true
  }

  const matchedDocumentType = matchedDocumentTemplate.documentTypeList.find(e => e.documentTypeID === localBlueprint.value._id)

  if (!matchedDocumentType) {
    return true
  }

  if (matchedDocumentType.excludedFieldIDList.includes(id)) {
    return false
  }

  return true
}
</script>

<style lang="scss">
.documentPreviewWrapper.no-pointer-events {
  pointer-events: all !important;
  padding: 0 !important;
  box-shadow: 0 0 4px rgba(0, 0, 0, 0.45);
  height: 600px;
  background-color: map-get($customColors, 'gunmetal-lighter') !important;
}

body:not(.body--dark) {
  .documentPreviewContent.-fullsize {
    background-color: #fff !important;
    color: darken($dark, 12.5) !important;

    .text-primary {
      color: var(--q-color-primary) !important;
    }

    .isDead {
      text-decoration-color: #000;
    }
  }
}

body.body--dark .documentPreviewContent.-fullsize {
  background-color: lighten(#303742, 5) !important;
}

.documentPreviewContent {
  padding: 20px;
  width: 700px;
  max-width: 100%;
  min-height: 600px;
  background-color: map-get($customColors, 'gunmetal-lighter') !important;
  color: #fff;

  .inputWrapper {
    display: flex;
    flex-direction: column;
  }

  h5 {
    font-size: 19px;
  }

  .text-primary {
    color: #ffd673 !important;
  }

  .colorIndicator {
    border: 1px solid #c5c5c5 !important;
  }

  .connectionNote,
  .listNote {
    color: #fff !important;
    font-weight: normal;
  }

  .fieldWysiwyg {
    font-size: 14px;
    font-weight: normal;
  }
}
</style>
