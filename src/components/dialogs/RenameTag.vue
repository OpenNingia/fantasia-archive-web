<template>
    <q-dialog
      v-model="dialogModel"
      @before-hide="triggerDialogClose"
      no-route-dismiss
      >
      <q-card dark class="renameTagDialog">
         <q-card-section class="column justify-center items-center">
          <h6 class="text-center q-my-sm">Rename tag </h6>
          <h5 class="text-center q-my-sm"><span class="text-bold text-primary">{{targetTag}}</span></h5>
        </q-card-section>

        <q-card-section class="row justify-center q-mx-xl">
          <div>
            If you input a tag name that already exists, the documents will be added to it and different text cases will be unified to the form of the already existing tag.
          </div>
        </q-card-section>

        <q-card-section>
          <div class="row justify-center">
            <q-input
              filled
              dark
              ref="renameTagInput"
              style="width: 400px;"
              label="New tag name"
              v-model="newTagName"
              @keydown.enter.prevent="renameTags"
            />
          </div>

        </q-card-section>

        <q-card-actions align="around" class="q-mx-xl q-mt-lg q-mb-md">
          <q-btn
          flat
          label="Cancel"
          color="accent"
          v-close-popup />
          <q-btn
            flat
            label="Rename tag"
            :disable="isInvalid"
            color="primary"
            @click="renameTags" />
        </q-card-actions>
      </q-card>
    </q-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue"
import { useAppStores } from "src/composables/useAppStores"
import { useDocumentHelpers } from "src/composables/useDocumentHelpers"
import { massRenameTag } from "src/scripts/documentActions/tagManager"
import { saveDocument } from "src/scripts/databaseManager/documentManager"
import { Loading, QSpinnerGears, extend } from "quasar"
import type { I_OpenedDocument } from "src/interfaces/I_OpenedDocument"

const props = defineProps<{
  dialogTrigger?: string
  allTags?: string[]
  documentIdList?: string[]
  targetTag?: string
}>()

const emit = defineEmits(["triggerDialogClose", "triggerDialogSubmit"])

const { dialogsStore, allDocumentsStore, openedDocumentsStore } = useAppStores()
const { sleep, mapShortDocument } = useDocumentHelpers()

const dialogModel = ref(false)
const thumbStyle = { right: "-40px", borderRadius: "5px", backgroundColor: "#61a2bd", width: "5px", opacity: 1 }
const thumbStyleTabs = { right: "0px", borderRadius: "5px", backgroundColor: "#61a2bd", width: "5px", opacity: 1 }
const thumbStyleTutorialTabContent = { right: "-55px", borderRadius: "5px", backgroundColor: "#61a2bd", width: "5px", opacity: 1 }

watch(() => dialogsStore.getDialogsState, (val) => { if (!val) dialogModel.value = false })
watch(() => props.dialogTrigger, async (val) => {
  if (val) {
    if (dialogsStore.getDialogsState) {
      return
    }
    dialogsStore.setDialogState(true)
    dialogModel.value = true
    newTagName.value = ""

    await sleep(300)

    renameTagInput.value?.focus()
  }
})

function triggerDialogClose () { dialogsStore.setDialogState(false); emit("triggerDialogClose", true) }
function triggerDialogSubmit (val: string) { emit("triggerDialogSubmit", val) }

const newTagName = ref("")
const documentsCopy = ref<I_OpenedDocument[]>([])
const renameTagInput = ref<any>(null)

const isInvalid = computed(() => {
  return newTagName.value.length <= 0
})

async function renameTags () {
  if (isInvalid.value) return

  Loading.show({
    message: "<h4>Renaming tags in all affected documents...</h4>",
    spinnerColor: "primary",
    messageColor: "cultured",
    spinnerSize: 120,
    backgroundColor: "dark",
    // @ts-ignore
    spinner: QSpinnerGears
  })

  const documentList = (props.documentIdList ?? []).map(id => {
    return allDocumentsStore.getDocument(id)
  })

  const updatedDocumentList = massRenameTag(newTagName.value, props.targetTag ?? "", props.allTags ?? [], documentList)

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
      {} as any,
      true
    ).catch((err: any) => console.log(err))

    const updateTree = (index + 1 === updatedDocumentList.length)

    const dataPass = { doc: savedDocument.documentCopy, treeAction: updateTree }
    openedDocumentsStore.updateDocument(dataPass)

    // @ts-ignore
    allDocumentsStore.updateDocument({ doc: mapShortDocument(savedDocument.documentCopy, allDocumentsStore.getDocumentsByType(savedDocument.documentCopy.type).docs) })
  }

  Loading.hide()
  triggerDialogClose()
}
</script>

<style lang="scss">

.renameTagDialog {
  min-width: 700px;

  .q-field__messages {
    font-weight: 600;
    font-size: 14px;
  }
}
</style>
