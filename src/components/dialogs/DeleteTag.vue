<template>
    <q-dialog
      v-model="dialogModel"
      @before-hide="triggerDialogClose"
      no-route-dismiss
      >
      <q-card dark class="deleteTagDialog">
         <q-card-section class="column justify-center items-center">
          <h6 class="text-center q-my-sm">Delete <span class="text-bold text-primary">{{targetTag}}</span>?</h6>
        </q-card-section>

         <q-card-section class="row justify-center q-mx-xl">
          <div>
            The tag will be deleted <span class="text-bold text-secondary">FOREVER</span> with no way to revert this change.
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
            label="Delete tag"
            color="secondary"
            @click="deleteTag" />
        </q-card-actions>
      </q-card>
    </q-dialog>
</template>

<script setup lang="ts">

import { ref, watch } from "vue"
import { useAppStores } from "src/composables/useAppStores"
import { useDocumentHelpers } from "src/composables/useDocumentHelpers"
import { massDeleteTag } from "src/scripts/documentActions/tagManager"
import { saveDocument } from "src/scripts/databaseManager/documentManager"
import { Loading, QSpinnerGears, extend } from "quasar"
import type { I_OpenedDocument } from "src/interfaces/I_OpenedDocument"

const props = defineProps<{
  dialogTrigger?: string
  documentIdList?: string[]
  targetTag?: string
}>()
const emit = defineEmits(["triggerDialogClose", "triggerDialogSubmit"])

const { dialogsStore, openedDocumentsStore, allDocumentsStore } = useAppStores()
const { mapShortDocument } = useDocumentHelpers()

const dialogModel = ref(false)
const documentsCopy = ref<I_OpenedDocument[]>([])

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

/**
 * Delete the tag from all affected documents
 */
async function deleteTag () {
  Loading.show({
    message: "<h4>Deleting tags in all affected documents...</h4>",
    spinnerColor: "primary",
    messageColor: "cultured",
    spinnerSize: 120,
    backgroundColor: "dark",
    // @ts-ignore
    spinner: QSpinnerGears
  })

  const documentIdList = props.documentIdList ?? []
  const targetTag = props.targetTag ?? ""

  const documentList = documentIdList.map(id => {
    return allDocumentsStore.getDocument(id)
  })

  const updatedDocumentList = massDeleteTag(targetTag, documentList)

  for (let index = 0; index < updatedDocumentList.length; index++) {
    const allDocuments = openedDocumentsStore.getAllDocuments
    documentsCopy.value = extend(true, [], allDocuments.docs)

    // @ts-ignore
    const savedDocument: {
      documentCopy: I_OpenedDocument,
      allOpenedDocuments: I_OpenedDocument[]
    } = await saveDocument(
      // @ts-ignore
      updatedDocumentList[index],
      documentsCopy.value,
      allDocumentsStore.getAllDocuments.docs,
      null,
      null,
      true
    ).catch((err: any) => console.log(err))

    const updateTree = (index + 1 === updatedDocumentList.length)

    // Update the opened document
    const dataPass = { doc: savedDocument.documentCopy, treeAction: updateTree }
    openedDocumentsStore.updateDocument(dataPass)

    // Update non-opened documents
    // @ts-ignore
    allDocumentsStore.updateDocument({ doc: mapShortDocument(savedDocument.documentCopy, allDocumentsStore.getDocumentsByType(savedDocument.documentCopy.type).docs) })
  }

  Loading.hide()
  triggerDialogClose()
}
</script>

<style lang="scss">

.deleteTagDialog {
  min-width: 700px;

  .q-field__messages {
    font-weight: 600;
    font-size: 14px;
  }
}
</style>
