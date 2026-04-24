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
    v-if="!editMode && localInput && localInput.length > 0"
    dense>
    <q-item>
       <q-item-section>
      <div class="colorIndicatorWrapper" >
        <div  class="colorIndicator" :style="`background-color: ${localInput}`">
        </div>
        <span class="text-weight-medium">
          {{localInput}}
        </span>
      </div>

      </q-item-section>
    </q-item>
  </q-list>

  <q-input
    v-if="editMode"
    v-model.number="localInput"
    type="text"
    @keydown="processInput"
    :outlined="!isDarkMode"
    :filled="isDarkMode"
    dense
  >
    <template v-slot:prepend>
     <div class="colorIndicator" :style="`background-color: ${localInput}`">
     </div>
    </template>
    <template v-slot:append>
      <q-icon name="colorize" class="cursor-pointer">
        <q-tooltip :delay="500">
          <span style="white-space: nowrap;">Open a color picker pop-up</span>
        </q-tooltip>
        <q-popup-proxy transition-show="scale" transition-hide="scale">
          <q-color
            @input="processInput"
            v-model="localInput"
           />
        </q-popup-proxy>
      </q-icon>
    </template>
  </q-input>

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
const localInput = ref("")

watch(() => props.inputDataValue, () => {
  localInput.value = props.inputDataValue ?? ""
}, { deep: true, immediate: true })

let pullTimer = null as any

function processInput () {
  clearTimeout(pullTimer)
  pullTimer = setTimeout(() => {
    signalInput()
  }, 500)
}

function signalInput () {
  emit("signalInput", localInput.value.trim())
}
</script>

<style lang="scss" scoped>
.colorIndicator {
  width: 20px;
  height: 20px;
  background-color: transparent;
}

.colorIndicatorWrapper {
  display: flex;
  margin-left: -15px;

  .q-item {
    min-height: 32px !important;
  }

  .colorIndicator {
    margin-right: 15px;
  }
}
</style>
