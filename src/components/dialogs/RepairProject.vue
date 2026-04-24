<template>
    <q-dialog
      v-model="dialogModel"
      @before-hide="triggerDialogClose"
      no-route-dismiss
      :persistent="repairOngoing || repairFinished"
      >
      <q-card v-if="!repairOngoing && !repairFinished" dark class="documentCloseDialog">
         <q-card-section class="row justify-center">
          <h6 class="text-center q-my-sm">Repair legacy project</h6>
        </q-card-section>

        <q-card-section class="row justify-center q-mx-xl">
          <div>
             Before proceeding, please save your current project first to prevent a <span class="text-bold text-secondary">POSSIBLE CORRUPTION</span> of your current project data!
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
          label="Save project"
          color="primary"
          @click="commenceSave"
           />
          <q-btn
            flat
            label="Repair project"
            color="primary"
            v-close-popup
            @click="repairProject" />
        </q-card-actions>
      </q-card>
      <q-card v-if="repairOngoing && !repairFinished" dark class="documentCloseDialog">
         <q-card-section class="row justify-center">
          <h6 class="text-center q-my-sm">Repairing...</h6>
        </q-card-section>

        <q-card-section class="row justify-center q-mx-xl">
          <div>
            <b>Processing document types: <span class="text-primary">{{processedBlueprints}}/{{blueprintCount}}</span></b>
          </div>
        </q-card-section>

        <q-card-section class="row justify-center q-mx-xl">
          <div>
            <b><span class="text-primary">{{currectDocumentType}}</span></b>
          </div>
        </q-card-section>

        <q-card-section class="row justify-center q-mx-xl q-mb-lg">
            <q-linear-progress stripe round dark size="20px" :value="progressCounter" color="primary" class="q-mt-sm">
              <div class="absolute-full flex flex-center">
                <q-badge text-color="accent" color="dark" :label="`${processedDocument}/${documentCount}`" />
              </div>
            </q-linear-progress>
        </q-card-section>
      </q-card>

      <q-card v-if="!repairOngoing && repairFinished" dark class="documentCloseDialog">
        <q-card-section class="row justify-center">
          <h6 class="text-center q-my-sm">Project succesfully repaired!</h6>
        </q-card-section>
        <q-card-actions align="around" class="q-mx-xl q-mt-lg q-mb-md">
          <q-btn
            flat
            label="Reload Fantasia Archive"
            color="primary"
            v-close-popup
            @click="reloadFA" />
          </q-card-actions>
      </q-card>

    </q-dialog>
</template>

<script lang="ts">

import { extend, Loading, QSpinnerGears } from "quasar"

import { Component, Watch } from "vue-property-decorator"

import DialogBase from "src/components/dialogs/_DialogBase"
import { changeCurrentProjectSettings, saveProject } from "src/scripts/projectManagement/projectManagent"

@Component({
  components: { }
})
export default class RepairProjectDialog extends DialogBase {
  /**
   * React to dialog opening request
   */
  @Watch("dialogTrigger")
  checkForOpenedProject (val: string|false) {
    if (val) {
      this.openDialog()
    }
  }

  /**
   * Open the the dialog if project is present on the window
   */
  openDialog () {
    if (this.SGET_getDialogsState) {
      return
    }
    this.repairOngoing = false
    this.repairFinished = false
    this.SSET_setDialogState(true)
    this.dialogModel = true
  }

  processedBlueprints = 0
  blueprintCount = 0
  processedDocument = 0
  documentCount = 0
  currectDocumentType = ""

  get progressCounter () {
    return (this.processedDocument / this.documentCount)
  }

  repairFinished = false
  repairOngoing = false

  async repairProject () {
    // Legacy PouchDB repair is not applicable in the web version —
    // all documents are stored in PostgreSQL with the correct format server-side.
    // Mark the project as already at web version so this dialog stops appearing.
    const optionsSnapShot = extend(true, {}, this.SGET_options)
    // @ts-ignore
    optionsSnapShot.pre017check = false
    // @ts-ignore
    this.SSET_options(optionsSnapShot)

    await changeCurrentProjectSettings({ createdOnVersion: "web" }, this)

    this.repairFinished = true
  }

  reloadFA () {
    window.location.reload()
  }

  /**
   * Save the current project
   */
  commenceSave () {
    const projectName = this.SGET_getProjectName
    const setup = {
      message: "<h4>Saving current project...</h4>",
      spinnerColor: "primary",
      messageColor: "cultured",
      spinnerSize: 120,
      backgroundColor: "dark",
      // @ts-ignore
      spinner: QSpinnerGears
    }
    saveProject(this.SGET_currentProjectId as string, Loading, setup, this.$q)
  }
}
</script>

<style lang="scss" scoped>

.documentCloseDialog {
  min-width: 600px;
}
</style>
