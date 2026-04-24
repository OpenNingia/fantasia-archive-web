<template>

  <q-dialog
    v-model="dialogModel"
    @before-hide="triggerDialogClose"
    >
    <q-card
      class="keyBindsDialog"
      dark
    >
      <q-card-section class="row items-center">
        <h6 class="text-center q-mt-lg q-mb-xs">Keybind list</h6>
      </q-card-section>

        <q-card-section>
          <div class="flex justify-center">
            <q-scroll-area
              class="q-mx-xl q-my-xs"
              visible
              dark
              :thumb-style="thumbStyle"
              style="max-height: calc(100vh - 260px); height: 775px; width: 100%;">
              <q-table
                dark
                flat
                :filter="filter"
                hide-bottom
                :pagination.sync="pagination"
                :rows-per-page-options="[0]"
                :virtual-scroll-sticky-size-start="48"
                row-key="id"
                :data="localCheatSheet"
                :columns="keybindListCollums"
              >
              <template v-slot:top-right>
                <q-input clearable dark dense debounce="300" v-model="filter" placeholder="Filter the keybinds">
                  <template v-slot:prepend>
                    <q-icon name="search" />
                  </template>
                </q-input>
              </template>
              <template v-slot:body="props">
                <q-tr :props="props">
                  <q-td
                    key="name"
                    :props="props"
                    v-html="props.row.name"
                  >
                  </q-td>
                   <q-td
                    key="keybind"
                    :props="props"
                    v-html="props.row.keybind"
                  >
                  </q-td>
                </q-tr>
              </template>

              </q-table>
            </q-scroll-area>
          </div>
       </q-card-section>

      <q-card-actions align="around" class="q-mb-lg">
          <q-btn flat label="Close" color="accent" v-close-popup />
      </q-card-actions>
    </q-card>
  </q-dialog>

</template>

<script setup lang="ts">

import { ref, watch } from "vue"
import { useAppStores } from "src/composables/useAppStores"
import { useDocumentHelpers } from "src/composables/useDocumentHelpers"
import type { I_KeyPressObject } from "src/interfaces/I_KeypressObject"

const props = defineProps<{ dialogTrigger?: string }>()
const emit = defineEmits(["triggerDialogClose", "triggerDialogSubmit"])

const { dialogsStore, keybindsStore } = useAppStores()
const { retrieveKeybindString } = useDocumentHelpers()

const dialogModel = ref(false)

watch(() => dialogsStore.getDialogsState, (val) => { if (!val) dialogModel.value = false })

watch(() => props.dialogTrigger, (val) => {
  if (val) {
    if (dialogsStore.getDialogsState) {
      return
    }

    dialogsStore.setDialogState(true)
    dialogModel.value = true

    // Remap the cheatsheet based on available input settings
    // @ts-ignore
    localCheatSheet.value = keybindsStore.getCurrentKeyBindData.defaults.map((bind, index) => {
      const userKb = keybindsStore.getCurrentKeyBindData.userKeybinds.find(userKb => userKb.id === bind.id)
      const mappedKeybind = (
        userKb &&
        userKb.which
      )
        // If user keybind
        ? {
          altKey: userKb.altKey,
          ctrlKey: userKb.ctrlKey,
          shiftKey: userKb.shiftKey,
          which: userKb.which,
          id: bind.id,
          tooltip: bind.tooltip,
          note: bind.note
        }
        // If default keybind
        : {
          altKey: bind.altKey,
          ctrlKey: bind.ctrlKey,
          shiftKey: bind.shiftKey,
          which: bind.which,
          id: bind.id,
          tooltip: bind.tooltip,
          note: bind.note
        }

      return {
        name: mappedKeybind.tooltip,
        id: mappedKeybind.id,
        keybind: retrieveKeybindString(mappedKeybind)
      }
    })
  }
})

function triggerDialogClose () { dialogsStore.setDialogState(false); emit("triggerDialogClose", true) }
function triggerDialogSubmit (val: string) { emit("triggerDialogSubmit", val) }

const thumbStyle = { right: "-40px", borderRadius: "5px", backgroundColor: "#61a2bd", width: "5px", opacity: 1 }

/**
 * Local, remapped cheatsheet
 */
const localCheatSheet = ref<I_KeyPressObject[]>([])

/**
 * Keybinds table string filter
 */
const filter = ref("")

/**
 * Keybinds table pagination settings
 */
const pagination = ref({
  rowsPerPage: 0
})

/**
 * Keybinds table settings
 */
const keybindListCollums = [
  {
    name: "name",
    required: true,
    label: "Action",
    align: "left",
    field: (row: {name: string}) => row.name,
    format: (val: string) => `${val}`,
    sortable: true
  },
  {
    name: "keybind",
    align: "left",
    label: "Keybind",
    field: "userKeybind"
  }
]
</script>

<style lang="scss">
.keyBindsDialog {
  width: 1000px;
  max-width: calc(100vw - 95px) !important;

  h6 {
    display: block;
    text-align: center;
    width: 100%;
  }

  table {
    td {
      max-width: 300px;
      white-space: inherit;
    }
  }

  .keybindNote {
    opacity: 0.8;
    font-size: 0.9em;
  }
}
</style>
