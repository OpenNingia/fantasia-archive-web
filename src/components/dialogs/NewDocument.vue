<template>
    <q-dialog
      no-route-dismiss
      v-model="dialogModel"
      @before-hide="triggerDialogClose"
      >
      <q-card
        dark
        class="newDocumentPopup"
      >

      <q-card-section class="row items-center">
          <h6 class="text-center q-my-sm">Add new document</h6>
        </q-card-section>

        <q-card-section class="row items-center">
           <q-select
              dark
              ref="ref_newDocument"
              style="flex-grow: 1;"
              dense
              popup-content-class="menuResizer"
              menu-anchor="bottom middle"
              menu-self="top middle"
              class="newDocumentSelect"
              :options="filteredNewInput"
              use-input
              filled
              input-debounce="0"
              v-model="newDocumentModel"
              @filter="filterNewSelect"
              @update:model-value="triggerNewInput"
            >
              <template v-slot:option="{ itemProps, opt }">
                  <q-item
                    :class="{'hasTextShadow': textShadow}"
                    v-bind="itemProps"
                  >
                  <q-item-section avatar>
                    <q-icon :name="opt.icon" />
                  </q-item-section>
                    <q-item-section>
                      <q-item-label v-html="opt.label" ></q-item-label>
                    </q-item-section>
                  </q-item>
                </template>
            </q-select>
        </q-card-section>

      <q-card-section>
        <q-card-actions align="around" class="q-mb-sm">
          <q-btn flat label="Close" color="accent" v-close-popup />
        </q-card-actions>
      </q-card-section>

      </q-card>
    </q-dialog>
</template>

<script setup lang="ts">
interface NewObjectDocument {
  label: string
  icon: string
  order: number
  _id: string
  specialLabel: string
}

import { ref, watch, nextTick } from "vue"
import { useAppStores } from "src/composables/useAppStores"
import { useDocumentHelpers } from "src/composables/useDocumentHelpers"

const props = defineProps<{ dialogTrigger?: string }>()
const emit = defineEmits(["triggerDialogClose", "triggerDialogSubmit"])

const { dialogsStore, blueprintsStore, optionsStore, keybindsStore } = useAppStores()
const { sleep, determineKeyBind, addNewObjectRoute } = useDocumentHelpers()

const dialogModel = ref(false)
const thumbStyle = { right: "-40px", borderRadius: "5px", backgroundColor: "#61a2bd", width: "5px", opacity: 1 }
const thumbStyleTabs = { right: "0px", borderRadius: "5px", backgroundColor: "#61a2bd", width: "5px", opacity: 1 }
const thumbStyleTutorialTabContent = { right: "-55px", borderRadius: "5px", backgroundColor: "#61a2bd", width: "5px", opacity: 1 }

watch(() => dialogsStore.getDialogsState, (val) => { if (!val) dialogModel.value = false })
watch(() => props.dialogTrigger, (val) => {
  if (val) {
    openDialog(val)
  }
})

function triggerDialogClose () { dialogsStore.setDialogState(false); emit("triggerDialogClose", true) }
function triggerDialogSubmit (val: string) { emit("triggerDialogSubmit", val) }

/****************************************************************/
// COMPONENT SETTINGS
/****************************************************************/

const isCloseAbleViaKeybind = ref(false)
const closeWithSameClick = ref(false)
const textShadow = ref(false)

watch(() => optionsStore.getOptions, () => {
  reloadOptions()
}, { immediate: true, deep: true })

function reloadOptions () {
  closeWithSameClick.value = optionsStore.getOptions.allowQuickPopupSameKeyClose
  textShadow.value = optionsStore.getOptions.textShadow
}

/****************************************************************/
// LOCAL KEYBINDS
/****************************************************************/

watch(() => keybindsStore.getCurrentKeyBindData, () => {
  processKeyPush()
}, { deep: true })

function processKeyPush () {
  if (determineKeyBind("quickNewDocument") && dialogModel.value && closeWithSameClick.value && isCloseAbleViaKeybind.value && dialogsStore.getDialogsState) {
    dialogModel.value = false
    dialogsStore.setDialogState(false)
    newDocumentModel.value = null
  }
}

/****************************************************************/
// DIALOG CONTROL
/****************************************************************/

function openDialog (val: string | false) {
  if (val) {
    if (dialogsStore.getDialogsState) {
      return
    }
    isCloseAbleViaKeybind.value = false
    dialogsStore.setDialogState(true)
    dialogModel.value = true
    populateNewObjectDialog().catch(e => console.log(e))
    reloadOptions()
  }
}

/****************************************************************/
// SELECT LIST MANAGEMENT
/****************************************************************/

const newObjectList = ref([] as NewObjectDocument[])
const newDocumentModel = ref<any>(null)
const ref_newDocument = ref<any>(null)

async function populateNewObjectDialog () {
  newObjectList.value = blueprintsStore.getAllBlueprints.map(blueprint => {
    return {
      label: blueprint.namePlural,
      icon: blueprint.icon,
      order: blueprint.order,
      _id: blueprint._id,
      specialLabel: blueprint.nameSingular.toLowerCase()
    }
  })

  await nextTick()
  await sleep(300)
  ref_newDocument.value?.focus()

  isCloseAbleViaKeybind.value = true
}

async function refocusSelect () {
  await nextTick()
  ref_newDocument.value?.setOptionIndex(-1)
  ref_newDocument.value?.moveOptionSelection(1, true)
}

const filteredNewInput = ref(null as unknown as NewObjectDocument[])

function filterNewSelect (val: string, update: (e: () => void) => void) {
  if (val === "") {
    update(() => {
      filteredNewInput.value = newObjectList.value
      if (ref_newDocument.value && filteredNewInput.value.length > 0) {
        refocusSelect().catch(e => console.log(e))
      }
    })
    return
  }

  update(() => {
    const needle = val.toLowerCase()
    filteredNewInput.value = newObjectList.value.filter(v => v.label.toLowerCase().indexOf(needle) > -1)
    if (ref_newDocument.value && filteredNewInput.value.length > 0) {
      refocusSelect().catch(e => console.log(e))
    }
  })
}

/****************************************************************/
// TRIGGER ACTIONS
/****************************************************************/

function triggerNewInput (e: NewObjectDocument) {
  dialogModel.value = false
  setTimeout(() => {
    addNewObjectRoute(e)
    newDocumentModel.value = null
  }, 1000)
}
</script>

<style lang="scss" scoped>

.newDocumentPopup {
  width: 600px;
  margin-top: 100px;
  align-self: flex-start;

  h6 {
    display: block;
    text-align: center;
    width: 100%;
  }
}
</style>
