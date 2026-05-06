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

    <div
      v-if="!editMode"
    >
     <q-chip
      v-for="(input,index) in localInput" :key="index"
      :color="(isDarkMode) ? 'accent' : 'gunmetal-light'"
      :text-color="(isDarkMode) ? 'dark' :'satin-sheen-gold-light'"
      :class="(isDarkMode) ? 'text-weight-bold':'text-weight-medium'">
        {{input}}
      </q-chip>
    </div>

    <q-select
      v-if="editMode"
      style="width: 100%;"
      dense
      dark
      :ref="`tagField${inputDataBluePrint.id}`"
      menu-anchor="bottom middle"
      menu-self="top middle"
      class="tagSelect"
      :options="filteredTags"
      use-input
      :outlined="!isDarkMode"
      :filled="isDarkMode"
      use-chips
      @filter="filterFn"
      input-debounce="0"
      new-value-mode="add-unique"
      multiple
      v-model="localInput"
      @new-value="addNewValue"
      @update:model-value="processInput"
      @keydown="processInput"
      error-message="This tag is already present in the selection."
      :error="tagAlreadyExists"
    >
      <template v-slot:selected-item="scope">
        <q-chip
          removable
          dense
          @remove="scope.removeAtIndex(scope.index)"
          :tabindex="scope.tabindex"
          color="accent"
          text-color="dark"
          class="text-bold"
        >
          {{ stripTags(scope.opt) }}
        </q-chip>
      </template>
    </q-select>

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

import { tagListBuildFromBlueprints } from "src/scripts/utilities/tagListBuilder"

const props = defineProps<{
  inputDataBluePrint: I_ExtraFields
  editMode?: boolean
  inputDataValue?: []
}>()

const emit = defineEmits(["signalInput"])

const { optionsStore, projectStore, allDocumentsStore } = useAppStores()
const { stripTags } = useDocumentHelpers()

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
const localInput = ref<string[]>([])
const allTags = ref<string[]>([])
const filteredTags = ref<string[]>([])
const tagAlreadyExists = ref(false)
const tagFieldRef = ref<any>(null)

watch(() => props.inputDataValue, () => {
  localInput.value = (props.inputDataValue) ? props.inputDataValue : []
  buildTagList()
}, { deep: true, immediate: true })

watch(() => props.inputDataBluePrint, () => {
  buildTagList()
}, { deep: true, immediate: true })

let pullTimer = null as any

function processInput () {
  clearTimeout(pullTimer)
  pullTimer = setTimeout(() => {
    signalInput()
  }, 500)
}

function signalInput () {
  tagAlreadyExists.value = false
  emit("signalInput", localInput.value)
}

async function defocusSelectRef () {
  await nextTick()
  /*eslint-disable */
  // @ts-ignore
  tagFieldRef.value?.setOptionIndex(-1)
  /* eslint-enable */
}

function addNewValue (val: string) {
  const formattedNewTag = val.toLowerCase().trim()

  const tagAlreadyExistsInList = (allTags.value.find(tag => tag.toLowerCase() === formattedNewTag))

  const tagAlreadyExistsAttached = (localInput.value.find(tag => tag.toLowerCase() === formattedNewTag))

  if (!tagAlreadyExistsInList) {
    allTags.value.push(val)
  }

  if (!tagAlreadyExistsAttached) {
    localInput.value.push(val)
    /*eslint-disable */
    // @ts-ignore
    tagFieldRef.value?.updateInputValue("")
    /* eslint-enable */
    processInput()
  }

  if (tagAlreadyExistsInList && tagAlreadyExistsAttached) {
    tagAlreadyExists.value = true
  }
}

function filterFn (val: string, update: (fn: any) => void) {
  if (val === "") {
    update(() => {
      if (allTags.value) {
        filteredTags.value = allTags.value
      }
      defocusSelectRef().catch(e => console.log(e))
    })
    return
  }

  update(() => {
    if (allTags.value) {
      const needle = val.toLowerCase()
      filteredTags.value = allTags.value.filter(v => v.toLowerCase().indexOf(needle) > -1)
    }
    defocusSelectRef().catch(e => console.log(e))
  })
}

function buildTagList () {
  allTags.value = tagListBuildFromBlueprints(allDocumentsStore.getAllDocuments.docs)
}
</script>
