<template>
    <q-dialog
      v-model="dialogModel"
      @before-hide="triggerDialogClose"
      no-route-dismiss
      >

      <q-card dark class="WISIWYG_changeImageDialog">
        <q-card-section class="row justify-center">
          <h6 class="text-center q-my-sm">Change image path</h6>
        </q-card-section>

        <q-card-section class="row justify-around">
           <q-input
            v-model="imagePath"
            outlined
            filled
            dense
            type="url"
            style="width: 80%;"
            label="Image path"
            ref="changeImagePathRef"
          />
        </q-card-section>

        <q-card-section class="row justify-around">
           <q-card-actions align="around">
              <q-btn
              flat
              label="Submit"
              color="primary"
              @click="passImagePath"
              />
            </q-card-actions>
        </q-card-section>

      </q-card>
    </q-dialog>
</template>

<script setup lang="ts">

import { ref, watch, nextTick } from "vue"
import { useAppStores } from "src/composables/useAppStores"

const props = defineProps<{
  dialogTrigger?: string
  currentImagePath?: string
  currentImageTarget?: HTMLImageElement
}>()
const emit = defineEmits(["triggerDialogClose", "triggerDialogSubmit", "passing-image-path-change"])

const { dialogsStore } = useAppStores()

const dialogModel = ref(false)
const imagePath = ref("")
const changeImagePathRef = ref<any>(null)

watch(() => dialogsStore.getDialogsState, (val) => { if (!val) dialogModel.value = false })

watch(() => props.dialogTrigger, (val) => {
  if (val) {
    openDialog().catch(e => console.log(e))
  }
})

function triggerDialogClose () { dialogsStore.setDialogState(false); emit("triggerDialogClose", true) }
function triggerDialogSubmit (val: string) { emit("triggerDialogSubmit", val) }

/**
 * Open the the dialog if project is present on the window
 */
async function openDialog () {
  if (dialogsStore.getDialogsState) {
    return
  }
  dialogsStore.setDialogState(true)
  dialogModel.value = true

  await nextTick()

  // @ts-ignore
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  changeImagePathRef.value?.focus()
  imagePath.value = props.currentImagePath ?? ""
}

function passImagePath () {
  emit("passing-image-path-change", imagePath.value, props.currentImageTarget)
  triggerDialogClose()
}
</script>

<style lang="scss" scoped>

.WISIWYG_changeImageDialog {
  min-width: 800px;
}
</style>
