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
      class="fieldList_list"
      dense>
      <q-item v-for="(input,index) in localInput" :key="index">
        <template v-if="input.type !== 'title'">
          <q-item-section
            class="fieldList_itemDot"
            side>
            <q-icon
              color="primary"
              name="mdi-menu-right"
              />
          </q-item-section>
          <q-item-section>
            <span class="text-weight-medium">
              {{mapFieldValue(input, index, 1)}}
            </span>
            <span v-if="localInput[index].affix" class="inline-block q-ml-xs text-italic listNote">
              {{mapFieldValue(input, index, 2)}}
              </span>
          </q-item-section>
        </template>

        <template v-if="input.type === 'title'">
          <q-item-section class="q-ml-sm q-mt-md">
            <span
            class="text-weight-bolder"
            :class="{'text-gunmetal-medium': !isDarkMode, 'text-satin-sheen-gold-bright': isDarkMode}"
            >
              {{input.value}}
            </span>
          </q-item-section>
        </template>

      </q-item>
    </q-list>

  <div v-if="editMode">
    <div class="row q-mb-sm"
      v-for="(singleInput,index) in localInput"
      :key="index"
    >
      <div
       class="col-sm-12 col-md flex"
        >

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
      <template v-if="isReversed && localInput[index].type !== 'title'">
         <q-input
          v-if="hasExtraInput && localExtraInput.length === 0"
          style="min-width: 350px; width: 350px; max-width: 350px;"
          v-model="localInput[index].affix"
          class="grow-1 q-mr-lg"
          :class="`listField_prefix${index}_${inputDataBluePrint.id}`"
          dense
          autogrow
          :label="(inputAffix) ? inputAffix : ''"
          @keydown="processInput"
          :outlined="!isDarkMode"
          :filled="isDarkMode"
          >
        </q-input>
        <q-select
          style="min-width: 350px; width: 350px;"
          dense
          v-if="hasExtraInput && localExtraInput.length > 0"
          class="listAtributeSelect q-mr-lg"
          :options="filteredLocalExtraInput"
          use-input
          :hide-dropdown-icon="!editMode"
          :outlined="editMode && !isDarkMode"
          :borderless="!editMode"
          :filled="editMode && isDarkMode"
          :readonly="!editMode"
          input-debounce="0"
          new-value-mode="add"
          dark
          virtual-scroll-slice-size="1000"
          :class="`listField_prefix${index}_${inputDataBluePrint.id}`"
          @filter="filterFn"
          @input="processInput"
          @keydown="processInput"
          :label="(inputAffix) ? inputAffix : ''"
          v-model="localInput[index].affix"
        >
          <template v-slot:option="scope">
            <template v-if="typeof scope.opt === 'string'">
               <q-item
                class="list_specialItem"
                :class="{'q-item--active': localInput[index].affix === scope.opt }"
                @click="localInput[index].affix = scope.opt"
                clickable
                v-ripple
                v-bind="scope.itemProps"
                v-on="scope.itemEvents"
                v-close-popup
              >
                {{scope.opt}}
              </q-item>
            </template>

            <template v-else>
              <q-item
                class="bg-gunmetal-light"
                :label="scope.opt.title"
              >
                <q-item-section >{{ scope.opt.title }}</q-item-section>
                <q-item-section side>
                 <q-btn
                  tabindex="-1"
                  round
                  flat
                  dense
                  dark
                  color="primary"
                  class="z-max q-ml-sm self-center"
                  icon="mdi-plus"
                  size="12px"
                  v-close-popup
                  @click="assignOptionGroupValues(scope.opt.title, index)"
                  >
                    <q-tooltip
                      :delay="300"
                    >
                      Add this category to the field.
                      <br>
                      <b>If there is A LOT of different stats, FA might freeze for a while.</b>
                    </q-tooltip>
                </q-btn>
              </q-item-section>
              </q-item>
              <q-item
                v-for="value in scope.opt.values"
                :key="`${value}_${scope.opt.title}`"
                :class="{'q-item--active': localInput[index].affix === value }"
                clickable
                v-ripple
                v-close-popup
                @click="localInput[index].affix = value"
                >
                <q-item-section>
                  <q-item-label v-html="value" class="q-ml-md" ></q-item-label>
                </q-item-section>
              </q-item>
            </template>
          </template>
        </q-select>

        <q-input
          v-model="localInput[index].value"
          class="grow-1 q-mr-lg"
          :class="`listField_input${index}_${inputDataBluePrint.id}`"
          dense
          autogrow
          @keydown="processInput"
          :outlined="!isDarkMode"
          :filled="isDarkMode"
          >
        </q-input>
      </template>

      <template v-if="!isReversed && localInput[index].type !== 'title'">
        <q-input
          v-model="localInput[index].value"
          class="grow-1 q-mr-lg"
          :class="`listField_input${index}_${inputDataBluePrint.id}`"
          dense
          autogrow
          @keydown="processInput"
          :outlined="!isDarkMode"
          :filled="isDarkMode"
          >
        </q-input>
        <q-input
          v-if="hasExtraInput && localExtraInput.length === 0"
          style="min-width: 350px; width: 350px; max-width: 350px;"
          v-model="localInput[index].affix"
          class="grow-1 q-mr-lg"
          :class="`listField_prefix${index}_${inputDataBluePrint.id}`"
          dense
          autogrow
          :label="(inputAffix) ? inputAffix : ''"
          @keydown="processInput"
          :outlined="!isDarkMode"
          :filled="isDarkMode"
          >
        </q-input>
        <q-select
          v-if="hasExtraInput && localExtraInput.length > 0"
          style="min-width: 350px; width: 350px;"
          dense
          class="listAtributeSelect q-mr-lg"
          :options="filteredLocalExtraInput"
          use-input
          :hide-dropdown-icon="!editMode"
          :outlined="editMode && !isDarkMode"
          :borderless="!editMode"
          :filled="editMode && isDarkMode"
          :readonly="!editMode"
          input-debounce="0"
          new-value-mode="add"
          virtual-scroll-slice-size="1000"
          dark
          :class="`listField_prefix${index}_${inputDataBluePrint.id}`"
          @filter="filterFn"
          @input="processInput"
          @keydown="processInput"
          :label="(inputAffix) ? inputAffix : ''"
          v-model="localInput[index].affix"
        >
         <template v-slot:option="scope">
            <template v-if="typeof scope.opt === 'string'">
              <q-item
                class="list_specialItem"
                :class="{'q-item--active': localInput[index].affix === scope.opt }"
                @click="localInput[index].affix = scope.opt"
                clickable
                v-ripple
                v-close-popup
                v-bind="scope.itemProps"
                v-on="scope.itemEvents"
              >
                {{scope.opt}}
              </q-item>
            </template>

            <template v-else>
              <q-item
                class="bg-gunmetal-light"
                :label="scope.opt.title"
              >
                <q-item-section >{{ scope.opt.title }}</q-item-section>
                <q-item-section side>
                 <q-btn
                  tabindex="-1"
                  round
                  flat
                  dense
                  dark
                  color="primary"
                  class="z-max q-ml-sm self-center"
                  icon="mdi-plus"
                  size="12px"
                  v-close-popup
                  @click="assignOptionGroupValues(scope.opt.title, index)"
                  >
                    <q-tooltip
                      :delay="300"
                    >
                      Add this category to the field.
                      <br>
                      <b>If there is A LOT of different stats, FA might freeze for a while.</b>
                    </q-tooltip>
                </q-btn>
              </q-item-section>
              </q-item>
              <q-item
                :class="{'q-item--active': localInput[index].affix === value }"
                  v-for="value in scope.opt.values"
                :key="`${value}_${scope.opt.title}`"
                clickable
                v-ripple
                v-close-popup
                @click="localInput[index].affix = value"
                >
                <q-item-section>
                  <q-item-label v-html="value" class="q-ml-md" ></q-item-label>
                </q-item-section>
              </q-item>
            </template>
          </template>
        </q-select>
      </template>
      <template v-if="localInput[index].type === 'title'">
        <q-icon name="mdi-format-title" size="22px" class="q-mr-sm q-mt-sm">
          <q-tooltip :delay="500">
            This line is a title and will show as such in the view mode.
          </q-tooltip>
        </q-icon>
        <q-input
          v-model="localInput[index].value"
          class="grow-1 q-mr-lg listTitleInput"
          :class="`listField_input${index}_${inputDataBluePrint.id}`"
          dense
          :bg-color="(isDarkMode)? 'blue-grey-14': 'cyan-1'"
          autogrow
          @keydown="processInput"
          :outlined="!isDarkMode"
          :filled="isDarkMode"
          >
        </q-input>
      </template>

      <div style="width: 60px; align-self: center; height: 35px;" class="justify-end flex">
        <q-btn
          v-if="editMode"
          color="secondary"
          :outline="isDarkMode"
          icon="mdi-close"
          tabindex="-1"
          @click="removeFromList(index)"
          >
            <q-tooltip :delay="500">
              <span style="white-space: nowrap;">Remove "{{(isReversed)? localInput[index].affix : localInput[index].value }}"</span>
            </q-tooltip>
        </q-btn>
      </div>
    </div>
    </div>

    <div class="row q-mt-lg" v-if="editMode">
      <div class="col justify-end flex">
        <q-btn
        color="primary"
        icon="mdi-format-title"
        class="q-mr-lg"
        :outline="isDarkMode"
        @click="addNewInput(undefined, 'title')" >
          <q-tooltip :delay="500">
            Add new title
          </q-tooltip>
        </q-btn>

        <q-btn
        color="primary"
        icon="mdi-plus"
        :outline="isDarkMode"
        @click="addNewInput()" >
          <q-tooltip :delay="500">
            Add new item
          </q-tooltip>
        </q-btn>
      </div>
    </div>
  </div>

    <div class="separatorWrapper">
      <q-separator color="grey q-mt-md" />
    </div>

  </div>

</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from "vue"
import { useAppStores } from "src/composables/useAppStores"
import type { I_ExtraFields } from "src/interfaces/I_Blueprint"
import { extend } from "quasar"

const props = defineProps<{
  inputDataBluePrint: I_ExtraFields
  editMode?: boolean
  inputDataValue?: {
    value: string
    affix?: string
  }[]
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
const localInput = ref([] as {
  value: string
  affix?: string
  type?: "input" | "title"
}[])

watch(() => props.inputDataValue, () => {
  localInput.value = (props.inputDataValue) ? props.inputDataValue : []
}, { deep: true, immediate: true })

const hasExtraInput = computed(() => {
  // @ts-ignore
  localExtraInput.value = props.inputDataBluePrint?.predefinedListExtras?.extraSelectValueList
  filteredLocalExtraInput.value = extend(true, [], localExtraInput.value)
  return props.inputDataBluePrint?.predefinedListExtras?.extraSelectValueList
})

const isReversed = computed(() => {
  // @ts-ignore
  return (props.inputDataBluePrint?.predefinedListExtras?.reverse)
})

function mapFieldValue (input: {value: string}, index: number, positition: 1|2) {
  let returnString = ""

  if (isReversed.value) {
    if (positition === 1) {
      returnString += localInput.value[index].affix
      if (input.value) {
        returnString += ":"
      }
    }
    if (input.value && positition === 2) {
      returnString += `${input.value}`
    }
  }
  else {
    if (positition === 1) {
      returnString += input.value
    }
    if (localInput.value[index] && positition === 2) {
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      returnString += `(${localInput.value[index].affix})`
    }
  }

  return returnString
}

const localExtraInput = ref<string[] | { title: string, values: string[] }[]>([])
const filteredLocalExtraInput = ref<string[] | { title: string, values: string[] }[]>([])

const inputAffix = computed(() => {
  return (props.inputDataBluePrint?.predefinedListExtras?.affix) || ""
})

function filterFn (val: string, update: (e: () => void) => void) {
  if (val === "") {
    update(() => {
      const localListCopy: [] = extend(true, [], localExtraInput.value)
      filteredLocalExtraInput.value = localListCopy
    })
    return
  }

  update(() => {
    const needle = val.toLowerCase()

    const returnList: string[] | {
      title: string,
      values: string[]
    }[] = []

    const localListCopy: [] = extend(true, [], localExtraInput.value)

    localListCopy.forEach((value: string | {
      title: string,
      values: string[]
    }) => {
      if (typeof value === "string" && value.toLowerCase().includes(needle)) {
        // @ts-ignore
        returnList.push(value)
      }

      if (typeof value !== "string") {
        if (value.title.toLowerCase().includes(needle)) {
          // @ts-ignore
          returnList.push(value)
        }
        else {
          const localFilteredSubvalues = value.values.filter(subValue => {
            return subValue.toLowerCase().includes(needle)
          })
          if (localFilteredSubvalues.length > 0) {
            value.values = localFilteredSubvalues
            // @ts-ignore
            returnList.push(value)
          }
        }
      }
    })

    filteredLocalExtraInput.value = returnList
  })
}

function removeFromList (index: number) {
  localInput.value.splice(index, 1)
  processInput()
}

async function addNewInput (affixValue = "", type: "input"|"title" = "input") {
  if (type === "input") {
    localInput.value.push({
      value: "",
      affix: affixValue,
      type: type
    })
  }
  else if (type === "title") {
    localInput.value.push({
      value: affixValue,
      affix: "",
      type: type
    })
  }

  const targetRefStringNamer = (!isReversed.value || type === "title")
    ? `.listField_input${localInput.value.length - 1}_${props.inputDataBluePrint.id}`
    : `.listField_prefix${localInput.value.length - 1}_${props.inputDataBluePrint.id}`

  await nextTick()

  const newInput = document.querySelector(targetRefStringNamer) as HTMLInputElement

  if (newInput) {
    newInput.focus()
  }

  processInput()
}

function moveItem (index: number, direction: "up" | "down") {
  const to = (direction === "up") ? index - 1 : index + 1
  const from = index

  localInput.value.splice(to, 0, localInput.value.splice(from, 1)[0])

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
  const dataCopy: {
    value: string
    affix?: string
  }[] = extend(true, [], localInput.value)

  const returnValue = dataCopy.map(e => {
    e.value = e.value.trim()
    if (e.affix) {
      e.affix = e.affix.trim()
    }
    return e
  })

  emit("signalInput", returnValue)
}

async function assignOptionGroupValues (categoryTitle: string, callerIndex: number) {
  const targetCategory: {
    title: string,
    values: string[]
  } = localExtraInput.value
    // @ts-ignore
    .find((e: {title: string}) => e.title === categoryTitle)

  await addNewInput(targetCategory.title, "title")

  for (const value of targetCategory.values) {
    await addNewInput(value)
  }

  if (localInput.value[callerIndex].value === "" && localInput.value[callerIndex].affix === "") {
    removeFromList(callerIndex)
  }
}
</script>

<style lang="scss">
.fieldList_list {
  .q-item {
    padding-right: 10px;
    padding-left: 0;
    min-height: 32px !important;
  }

  .q-item__section {
    position: relative;
    flex-direction: row;
    justify-content: flex-start;
    align-items: center;
  }

  .fieldList_itemDot {
    padding-right: 10px;
  }
}

.listTitleInput textarea {
  font-weight: 600;
}

.list_specialItem {
  display: flex;
  align-items: center;
}
</style>
