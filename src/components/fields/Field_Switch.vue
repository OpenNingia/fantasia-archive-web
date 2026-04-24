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

  <div v-if="!editMode && localInput">
    <div
      v-if="!editMode"
    >
     <q-chip
      :color="(isDarkMode) ? 'accent' : 'gunmetal-light'"
      :text-color="(isDarkMode) ? 'dark' :'satin-sheen-gold-light'"
      :class="(isDarkMode) ? 'text-weight-bold':'text-weight-medium'">
         <q-icon
            :color="(isDarkMode) ? 'dark' :'satin-sheen-gold-light'"
            name="mdi-check-bold"
            class="q-mr-sm"
             />
        Active
      </q-chip>
    </div>
  </div>

  <q-toggle
    v-if="editMode"
    v-model="localInput"
    @input="processInput"
  />

    <div class="separatorWrapper">
      <q-separator color="grey q-mt-md" />
    </div>
</div>

</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue"
import { useAppStores } from "src/composables/useAppStores"
import type { I_ExtraFields } from "src/interfaces/I_Blueprint"

const props = defineProps<{
  inputDataBluePrint: I_ExtraFields
  editMode?: boolean
  inputDataValue?: boolean
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
const localInput = ref<null | boolean>(null)

watch(() => props.inputDataValue, () => {
  localInput.value = (typeof props.inputDataValue === "boolean") ? props.inputDataValue : false
}, { immediate: true })

let pullTimer = null as any

function processInput () {
  clearTimeout(pullTimer)
  pullTimer = setTimeout(() => {
    signalInput()
  }, 500)
}

function signalInput () {
  emit("signalInput", localInput.value)
}
</script>
