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

<script lang="ts">

import { Component, Watch, Prop } from "vue-property-decorator"

import DialogBase from "src/components/dialogs/_DialogBase"
import type { I_ShortenedDocument } from "src/interfaces/I_OpenedDocument"
import { documentApi } from "src/services/api/documentApi"

@Component({
  components: { }
})
export default class DeleteDocumentCheckDialog extends DialogBase {
  /**
   * React to dialog opening request
   */
  @Watch("dialogTrigger")
  openDialog (val: string|false) {
    if (val && (this.SGET_allOpenedDocuments.docs.length > 0 || (this.documentType.length > 0 && this.documentId.length > 0))) {
      if (this.SGET_getDialogsState) {
        return
      }
      this.SSET_setDialogState(true)
      this.dialogModel = true

      const documentID = (this.documentId.length > 0) ? this.documentId : this.$route.params.id
      this.currentDocument = this.SGET_document(documentID)
    }
  }

  /**
   * OPTIONAL
   * Type of the document to delete
   */
  @Prop({ default: "" }) readonly documentType!: ""

  /**
   * OPTIONAL
   * ID of the document to delete
   */
  @Prop({ default: "" }) readonly documentId!: ""

  /**
   * Current document for deletion
   */
  currentDocument = false as unknown as I_ShortenedDocument

  /**
   * Delete the document
   */
  async deleteDocument () {
    const documentID = (this.documentId.length > 0) ? this.documentId : this.$route.params.id
    const documentType = (this.documentType.length > 0) ? this.documentType : this.$route.params.type
    const projectId = this.SGET_currentProjectId as string

    await documentApi.delete(projectId, documentType, documentID)

    this.currentDocument = this.SGET_document(documentID)
    const dataPass = { doc: this.currentDocument, treeAction: true }

    this.dialogModel = false
    this.SSET_setDialogState(false)

    // @ts-ignore
    this.SSET_removeOpenedDocument(dataPass)
    // @ts-ignore
    this.SSET_removeDocument({ doc: this.currentDocument })
  }
}
</script>

<style lang="scss" scoped>

.documentCloseDialog {
  min-width: 600px;
}
</style>
