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
    class="fieldText_list"
    dense>
    <q-item>
      <q-item-section>
        <span class="text-weight-medium">
          {{localInput}}
        </span>
      </q-item-section>
    </q-item>
  </q-list>

  <q-input
      v-if="editMode"
      v-model="localInput"
      @keydown="processInput"
      :outlined="!isDarkMode"
      :filled="isDarkMode"
      dense
      autogrow
      :ref="`textField${inputDataBluePrint.id}`"
     >
        <template v-slot:append v-if="isNew && !changedInput && localInput.length > 0">
          <q-icon name="close" @click="deletePlaceholder()" class="cursor-pointer" />
        </template>
    </q-input>

    <div class="separatorWrapper">
      <q-separator color="grey q-mt-md" />
    </div>

</div>

</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from "vue"
import { useAppStores } from "src/composables/useAppStores"
import type { I_ExtraFields } from "src/interfaces/I_Blueprint"

const props = defineProps<{
  inputDataBluePrint: I_ExtraFields
  editMode?: boolean
  inputDataValue?: string
  isNew?: boolean
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
const changedInput = ref(false)
const textFieldRef = ref<any>(null)

watch(() => props.inputDataValue, () => {
  localInput.value = props.inputDataValue ?? ""
}, { deep: true, immediate: true })

watch(() => props.editMode, () => {
  if (props.inputDataBluePrint?.id === "name" && props.editMode === true) {
    nextTick(() => {
      /*eslint-disable */
      // @ts-ignore
      textFieldRef.value?.focus()

      if (props.isNew && !changedInput.value && localInput.value.length > 0) {
        // @ts-ignore
        textFieldRef.value?.select()
      }
      /* eslint-enable */
    })
  }
}, { immediate: true })

function deletePlaceholder () {
  localInput.value = ""
  processInput()
}

let pullTimer = null as any

function processInput () {
  clearTimeout(pullTimer)
  pullTimer = setTimeout(() => {
    signalInput()
  }, 500)
}

function signalInput () {
  changedInput.value = true
  emit("signalInput", localInput.value.trim())
}
</script>
<style lang="scss">
.fieldText_list {
  .q-item {
    padding-right: 10px;
    padding-left: 10px;
    min-height: 32px !important;
  }
}
</style>
