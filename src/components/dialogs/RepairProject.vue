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

<script setup lang="ts">
import { ref, computed, watch } from "vue"
import { extend, Loading, QSpinnerGears, useQuasar } from "quasar"
import { useAppStores } from "src/composables/useAppStores"
import { changeCurrentProjectSettings, saveProject } from "src/scripts/projectManagement/projectManagent"

const props = defineProps<{ dialogTrigger?: string }>()
const emit = defineEmits(["triggerDialogClose", "triggerDialogSubmit"])

const q = useQuasar()
const { dialogsStore, projectStore, optionsStore } = useAppStores()

const dialogModel = ref(false)
const thumbStyle = { right: "-40px", borderRadius: "5px", backgroundColor: "#61a2bd", width: "5px", opacity: 1 }
const thumbStyleTabs = { right: "0px", borderRadius: "5px", backgroundColor: "#61a2bd", width: "5px", opacity: 1 }
const thumbStyleTutorialTabContent = { right: "-55px", borderRadius: "5px", backgroundColor: "#61a2bd", width: "5px", opacity: 1 }

watch(() => dialogsStore.getDialogsState, (val) => { if (!val) dialogModel.value = false })
watch(() => props.dialogTrigger, (val) => {
  if (val) {
    openDialog()
  }
})

function triggerDialogClose () { dialogsStore.setDialogState(false); emit("triggerDialogClose", true) }
function triggerDialogSubmit (val: string) { emit("triggerDialogSubmit", val) }

function openDialog () {
  if (dialogsStore.getDialogsState) {
    return
  }
  repairOngoing.value = false
  repairFinished.value = false
  dialogsStore.setDialogState(true)
  dialogModel.value = true
}

const processedBlueprints = ref(0)
const blueprintCount = ref(0)
const processedDocument = ref(0)
const documentCount = ref(0)
const currectDocumentType = ref("")

const progressCounter = computed(() => {
  return (processedDocument.value / documentCount.value)
})

const repairFinished = ref(false)
const repairOngoing = ref(false)

async function repairProject () {
  // Legacy PouchDB repair is not applicable in the web version —
  // all documents are stored in PostgreSQL with the correct format server-side.
  // Mark the project as already at web version so this dialog stops appearing.
  const optionsSnapShot = extend(true, {}, optionsStore.getOptions)
  // @ts-ignore
  optionsSnapShot.pre017check = false
  void optionsStore.setOptions(optionsSnapShot)

  await changeCurrentProjectSettings({ createdOnVersion: "web" }, {} as any)

  repairFinished.value = true
}

function reloadFA () {
  window.location.reload()
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
