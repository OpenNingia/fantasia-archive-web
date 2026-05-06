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
           {{localInput}}
        </q-item-section>
      </q-item>
    </q-list>

    <q-input
      v-if="editMode && (!inputDataBluePrint.predefinedSelectValues || inputDataBluePrint.predefinedSelectValues.length === 0)"
      v-model="localInput"
      :ref="`singleSelectField${inputDataBluePrint.id}`"
      dense
      autogrow
      @keydown="processInput"
      :outlined="!isDarkMode"
      :filled="isDarkMode"
      >
    </q-input>
    <q-select
      v-if="editMode && inputDataBluePrint.predefinedSelectValues && inputDataBluePrint.predefinedSelectValues.length > 0"
      style="width: 100%;"
      dense
      dark
      popup-content-class="menuResizer"
      :ref="`singleSelectField${inputDataBluePrint.id}`"
      menu-anchor="bottom middle"
      menu-self="top middle"
      class="singleSelect"
      :options="extraInput"
      use-input
      :outlined="!isDarkMode"
      :filled="isDarkMode"
      @filter="filterFn"
      input-debounce="0"
      new-value-mode="add"
      v-model="localInput"
      @update:model-value="processInput"
      @keydown="processInput"
    >
     <template v-slot:selected-item="scope">
      <q-chip
        v-if="scope.opt && scope.opt.length > 0"
        removable
        dense
        @remove="scope.removeAtIndex(scope.index)"
        :tabindex="scope.tabindex"
        color="accent"
        text-color="dark"
        class="text-bold"
      >
        {{ scope.opt }}
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
const extraInput = ref<string[]>([])
const singleSelectFieldRef = ref<any>(null)

watch(() => props.inputDataValue, () => {
  localInput.value = (props.inputDataValue) ? props.inputDataValue : ""
}, { deep: true, immediate: true })

watch(() => props.inputDataBluePrint, () => {
  if (props.inputDataBluePrint?.predefinedSelectValues) {
    extraInput.value = props.inputDataBluePrint?.predefinedSelectValues
  }
}, { deep: true, immediate: true })

async function defocusSelectRef () {
  await nextTick()
  /*eslint-disable */
  // @ts-ignore
  singleSelectFieldRef.value?.setOptionIndex(-1)
  /* eslint-enable */
}

function filterFn (val: string, update: (fn: any) => void) {
  if (val === "") {
    update(() => {
      if (props.inputDataBluePrint?.predefinedSelectValues) {
        extraInput.value = props.inputDataBluePrint.predefinedSelectValues
      }
    })
    defocusSelectRef().catch(e => console.log(e))
    return
  }

  update(() => {
    if (props.inputDataBluePrint?.predefinedSelectValues) {
      const needle = val.toLowerCase()
      extraInput.value = props.inputDataBluePrint.predefinedSelectValues.filter(v => v.toLowerCase().indexOf(needle) > -1)
    }
    defocusSelectRef().catch(e => console.log(e))
  })
}

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
