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
  </div>

    <q-list
      v-if="!editMode"
      class="fieldSingleSelect_list"
      dense>
      <q-item>
        <q-item-section class="text-weight-medium">
           {{(selectedTemplate && selectedTemplate.name) ? selectedTemplate.name : ''}}
        </q-item-section>
      </q-item>
    </q-list>

    <q-select
      v-if="editMode"
      style="width: 100%;"
      dense
      dark
      popup-content-class="menuResizer"
      menu-anchor="bottom middle"
      menu-self="top middle"
      class="singleSelect"
      :options="extraInput"
      option-value="id"
      use-input
      :outlined="!isDarkMode"
      :filled="isDarkMode"
      @filter="filterFn"
      v-model="selectedTemplate"
      @input="signalInput"
    >
      <template v-slot:selected-item="scope">
          {{scope.opt.name}}
      </template>
      <template v-slot:option="{ itemProps, itemEvents, opt }">
        <q-item
          v-bind="itemProps"
          v-on="itemEvents"
          :key="opt.id"
        >
          <q-item-section>
            <q-item-label>
              {{opt.name}}
            </q-item-label>
          </q-item-section>
        </q-item>
      </template>

    </q-select>

    <div class="separatorWrapper">
      <q-separator color="grey q-mt-md" />
    </div>

  </div>

</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue"
import { useAppStores } from "src/composables/useAppStores"
import type { I_ExtraFields } from "src/interfaces/I_Blueprint"

import { retrieveAllDocumentTemplatesFromDB } from "src/scripts/projectManagement/documentTemplates"
import { extend } from "quasar"
import type { I_DocumentTemplate } from "src/interfaces/I_DocumentTemplate"

const props = defineProps<{
  inputDataBluePrint: I_ExtraFields
  editMode?: boolean
  inputDataValue?: string
}>()

const emit = defineEmits(["signalInput"])

const { optionsStore, projectStore } = useAppStores()

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

// Input handling
const localInput = ref(null as unknown as string)
const documentTemplateList = ref<I_DocumentTemplate[]>([])
const selectedTemplate = ref(null as unknown as I_DocumentTemplate)
const extraInput = ref<I_DocumentTemplate[]>([])

watch(() => props.inputDataValue, () => {
  // @ts-ignore
  localInput.value = (props.inputDataValue) ? props.inputDataValue : null
  assignLocalInputData()
}, { deep: true, immediate: true })

watch(() => props.inputDataBluePrint, async () => {
  await loadDocumentTemplates()
  if (documentTemplateList.value) {
    extraInput.value = extend(true, [], documentTemplateList.value)
  }
  assignLocalInputData()
}, { deep: true, immediate: true })

async function loadDocumentTemplates () {
  documentTemplateList.value = await retrieveAllDocumentTemplatesFromDB()
}

function assignLocalInputData () {
  if (documentTemplateList.value.length > 0 && localInput.value) {
    const newAssign = documentTemplateList.value.find(e => e.id === localInput.value)
    if (newAssign) {
      selectedTemplate.value = newAssign
    }
  }
}

function filterFn (val: string, update: (fn: any) => void) {
  if (val === "") {
    update(() => {
      if (documentTemplateList.value) {
        extraInput.value = documentTemplateList.value
      }
    })
    return
  }

  update(() => {
    if (props.inputDataBluePrint?.predefinedSelectValues) {
      const needle = val.toLowerCase()
      extraInput.value = documentTemplateList.value.filter(v => v.name.toLowerCase().indexOf(needle) > -1)
    }
  })
}

function signalInput () {
  emit("signalInput", (selectedTemplate.value) ? selectedTemplate.value.id : null)
}
</script>

<style lang="scss">
.fieldSingleSelect_list {
  .q-item {
    padding-right: 10px;
    padding-left: 10px;
    min-height: 32px !important;
  }

  .q-item__section {
    position: relative;
    flex-direction: row;
    justify-content: flex-start;
    align-items: center;
  }
}

</style>
