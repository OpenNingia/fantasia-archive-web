<template>
    <q-dialog
      v-model="dialogModel"
      @before-hide="triggerDialogClose"
      >
      <q-card dark class="documentCloseDialog">
         <q-card-section class="row justify-center">
          <h6 class="text-center q-my-sm">Discard changes to <span class="text-primary">{{dialogDocument ? retrieveFieldValue(dialogDocument,'name') : ''}}</span>?</h6>
        </q-card-section>

        <q-card-actions align="around" class="q-mx-xl q-mt-lg q-mb-md">
          <q-btn
          flat
          label="Cancel"
          color="accent"
          v-close-popup />
          <q-btn
            outline
            label="Discard changes"
            color="secondary"
            :disable="!dialogDocument"
            @click="dialogDocument && closeDocument(dialogDocument)" />
        </q-card-actions>
      </q-card>
    </q-dialog>
</template>

<script setup lang="ts">

import { ref, watch } from "vue"
import { useAppStores } from "src/composables/useAppStores"
import { useDocumentHelpers } from "src/composables/useDocumentHelpers"
import type { I_OpenedDocument } from "src/interfaces/I_OpenedDocument"

const props = defineProps<{ dialogTrigger?: string; dialogDocument: I_OpenedDocument | null }>()
const emit = defineEmits(["triggerDialogClose", "triggerDialogSubmit"])

const { dialogsStore, openedDocumentsStore } = useAppStores()
const { retrieveFieldValue } = useDocumentHelpers()

const dialogModel = ref(false)

watch(() => dialogsStore.getDialogsState, (val) => { if (!val) dialogModel.value = false })

watch(() => props.dialogTrigger, (val) => {
  if (val) {
    checkForCloseOpenedDocument()
  }
})

function triggerDialogClose () { dialogsStore.setDialogState(false); emit("triggerDialogClose", true) }
function triggerDialogSubmit (val: string) { emit("triggerDialogSubmit", val) }

/**
 * Determine if the document has edits or not. Based on this either skip this dialog altogether or show it.
 */
function checkForCloseOpenedDocument () {
  const input = props.dialogDocument
  if (input?.hasEdits) {
    if (dialogsStore.getDialogsState) {
      return
    }
    dialogsStore.setDialogState(true)
    dialogModel.value = true
  }
  else {
    closeDocument(input)
  }
}

/**
 * Closes the document and removes it from the list
 */
function closeDocument (input: I_OpenedDocument | null) {
  if (!input) return
  const dataPass = { doc: input, treeAction: false }
  openedDocumentsStore.removeDocument(dataPass)

  dialogModel.value = false
  dialogsStore.setDialogState(false)
}
</script>

<style lang="scss" scoped>

.documentCloseDialog {
  min-width: 600px;
}
</style>
