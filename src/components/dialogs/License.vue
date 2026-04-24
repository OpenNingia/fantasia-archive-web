<template>

  <q-dialog
    v-model="dialogModel"
    @before-hide="triggerDialogClose"
    >
    <q-card
      class="licenseDialog"
      dark
    >
      <q-card-section>
        <div class="flex justify-center">
          <q-scroll-area
            class="q-mx-xl q-my-lg"
            visible
            dark
            :thumb-style="thumbStyle"
            style="max-height: calc(100vh - 235px); height: 800px; width: 100%;">
            <q-markdown no-heading-anchor-links>
            {{$t('documents.license')}}
            </q-markdown>
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

const props = defineProps<{ dialogTrigger?: string }>()
const emit = defineEmits(["triggerDialogClose", "triggerDialogSubmit"])

const { dialogsStore } = useAppStores()

const dialogModel = ref(false)

watch(() => dialogsStore.getDialogsState, (val) => { if (!val) dialogModel.value = false })

watch(() => props.dialogTrigger, (val) => {
  if (val) {
    if (dialogsStore.getDialogsState) {
      return
    }
    dialogsStore.setDialogState(true)
    dialogModel.value = true
  }
})

function triggerDialogClose () { dialogsStore.setDialogState(false); emit("triggerDialogClose", true) }
function triggerDialogSubmit (val: string) { emit("triggerDialogSubmit", val) }

const thumbStyle = { right: "-40px", borderRadius: "5px", backgroundColor: "#61a2bd", width: "5px", opacity: 1 }
</script>

<style lang="scss">
.licenseDialog {
  width: 680px;
  max-width: calc(100vw - 100px) !important;

  h6 {
    display: block;
  }
}
</style>
