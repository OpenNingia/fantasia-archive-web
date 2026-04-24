<template>
    <q-dialog
      v-model="dialogModel"
      @before-hide="triggerDialogClose"
      no-route-dismiss
      >
      <q-card dark class="documentCloseDialog">
         <q-card-section class="row justify-center">
          <h6 class="text-center q-my-sm">Merge another project into the current one</h6>
        </q-card-section>

        <q-card-section class="row justify-center q-mx-xl">
          <div>
            Please note that merging another project will cause <span class="text-bold text-secondary">IRREVERSIBLE CHANGES</span> to the currently opened project.
            <br>
            If you haven't done so already, please save your current project first to prevent <span class="text-bold text-secondary">POSSIBLE COMPLICATIONS</span> concerning your current project data!
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
            label="Merge project"
            color="primary"
            v-close-popup
            @click="mergeProject()" />
        </q-card-actions>
      </q-card>
    </q-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from "vue"
import { useAppStores } from "src/composables/useAppStores"
import { saveProject, mergeExistingProject } from "src/scripts/projectManagement/projectManagent"
import { Loading, QSpinnerGears, useQuasar } from "quasar"
import { useRouter } from "vue-router"

const props = defineProps<{ dialogTrigger?: string }>()
const emit = defineEmits(["triggerDialogClose", "triggerDialogSubmit"])

const router = useRouter()
const q = useQuasar()
const { dialogsStore, projectStore } = useAppStores()

const dialogModel = ref(false)
const thumbStyle = { right: "-40px", borderRadius: "5px", backgroundColor: "#61a2bd", width: "5px", opacity: 1 }
const thumbStyleTabs = { right: "0px", borderRadius: "5px", backgroundColor: "#61a2bd", width: "5px", opacity: 1 }
const thumbStyleTutorialTabContent = { right: "-55px", borderRadius: "5px", backgroundColor: "#61a2bd", width: "5px", opacity: 1 }

watch(() => dialogsStore.getDialogsState, (val) => { if (!val) dialogModel.value = false })
watch(() => props.dialogTrigger, (val) => {
  if (val) {
    const projectName = projectStore.getProjectName

    if (projectName.length > 0) {
      openDialog()
    }
  }
})

function triggerDialogClose () { dialogsStore.setDialogState(false); emit("triggerDialogClose", true) }
function triggerDialogSubmit (val: string) { emit("triggerDialogSubmit", val) }

function openDialog () {
  if (dialogsStore.getDialogsState) {
    return
  }
  dialogsStore.setDialogState(true)
  dialogModel.value = true
}

function mergeProject () {
  const setup = {
    message: "<h4>Merging selected project...</h4>",
    spinnerColor: "primary",
    messageColor: "cultured",
    spinnerSize: 120,
    backgroundColor: "dark",
    // @ts-ignore
    spinner: QSpinnerGears
  }

  projectStore.setProjecLoadingState(false)
  mergeExistingProject(router, Loading, setup, q, {} as any)
}

function commenceSave () {
  const setup = {
    message: "<h4>Saving current project...</h4>",
    spinnerColor: "primary",
    messageColor: "cultured",
    spinnerSize: 120,
    backgroundColor: "dark",
    // @ts-ignore
    spinner: QSpinnerGears
  }
  saveProject(projectStore.currentProjectId as string, Loading, setup, q)
}
</script>

<style lang="scss" scoped>

.documentCloseDialog {
  min-width: 600px;
}
</style>
