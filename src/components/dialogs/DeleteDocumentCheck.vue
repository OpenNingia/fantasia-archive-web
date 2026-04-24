<template>
    <q-dialog
      v-model="dialogModel"
      @before-hide="triggerDialogClose"
      >
      <q-card dark class="documentCloseDialog">
         <q-card-section class="row justify-center">
          <h6 class="text-center q-my-sm">Delete <span class="text-primary">{{retrieveFieldValue(currentDocument, 'name')}}</span>?</h6>
        </q-card-section>

         <q-card-section class="row justify-center q-mx-xl">
          <div>
            The document will be deleted <span class="text-bold text-secondary">FOREVER</span> with no way to retrieve it.
            <br>
            <span class="text-caption">(unless a previous save of the project exists from earlier time that cointains it)</span>
            <br>
            <br>

            Proceed?
          </div>
        </q-card-section>

        <q-card-actions align="around" class="q-mx-xl q-mt-lg q-mb-md">
          <q-btn
          flat
          label="Cancel"
          color="accent"
          v-close-popup />
          <q-btn
            outline
            :disable="!retrieveFieldValue(currentDocument, 'name')"
            label="Delete document"
            color="secondary"
            @click="deleteDocument()" />
        </q-card-actions>
      </q-card>
    </q-dialog>
</template>

<script setup lang="ts">

import { ref, watch } from "vue"
import { useRoute } from "vue-router"
import { useAppStores } from "src/composables/useAppStores"
import { useDocumentHelpers } from "src/composables/useDocumentHelpers"
import type { I_ShortenedDocument } from "src/interfaces/I_OpenedDocument"
import { documentApi } from "src/services/api/documentApi"

const props = defineProps<{
  dialogTrigger?: string
  documentType?: string
  documentId?: string
}>()
const emit = defineEmits(["triggerDialogClose", "triggerDialogSubmit"])

const route = useRoute()
const { dialogsStore, openedDocumentsStore, allDocumentsStore, projectStore } = useAppStores()
const { retrieveFieldValue } = useDocumentHelpers()

const dialogModel = ref(false)
const currentDocument = ref(false as unknown as I_ShortenedDocument)

watch(() => dialogsStore.getDialogsState, (val) => { if (!val) dialogModel.value = false })

watch(() => props.dialogTrigger, (val) => {
  const docType = props.documentType ?? ""
  const docId = props.documentId ?? ""
  if (val && (openedDocumentsStore.getAllDocuments.docs.length > 0 || (docType.length > 0 && docId.length > 0))) {
    if (dialogsStore.getDialogsState) {
      return
    }
    dialogsStore.setDialogState(true)
    dialogModel.value = true

    const documentID = (docId.length > 0) ? docId : route.params.id as string
    currentDocument.value = allDocumentsStore.getDocument(documentID)
  }
})

function triggerDialogClose () { dialogsStore.setDialogState(false); emit("triggerDialogClose", true) }
function triggerDialogSubmit (val: string) { emit("triggerDialogSubmit", val) }

/**
 * Delete the document
 */
async function deleteDocument () {
  const docId = props.documentId ?? ""
  const docType = props.documentType ?? ""
  const documentID = (docId.length > 0) ? docId : route.params.id as string
  const documentType = (docType.length > 0) ? docType : route.params.type as string
  const projectId = projectStore.currentProjectId as string

  await documentApi.delete(projectId, documentType, documentID)

  currentDocument.value = allDocumentsStore.getDocument(documentID)
  const dataPass = { doc: currentDocument.value, treeAction: true }

  dialogModel.value = false
  dialogsStore.setDialogState(false)

  // @ts-ignore
  openedDocumentsStore.removeDocument(dataPass)
  // @ts-ignore
  allDocumentsStore.removeDocument({ doc: currentDocument.value })
}
</script>

<style lang="scss" scoped>

.documentCloseDialog {
  min-width: 600px;
}
</style>
