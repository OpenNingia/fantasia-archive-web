<template>
    <q-dialog
      v-model="dialogModel"
      @before-hide="triggerDialogClose"
      no-route-dismiss
      >
      <q-card dark class="newProjectCheckDialog">
         <q-card-section class="row justify-center">
          <h6 class="text-center q-my-sm">New project</h6>
        </q-card-section>

        <q-card-section class="row justify-center q-mx-xl" v-if="oldProjectName.length > 0">
          <div>
            Please note that the new project will <span class="text-bold text-secondary">COMPLETELY OVERWRITE</span> the currently opened project.
            <br>
            If you haven't done so already, please save your current project first to prevent a <span class="text-bold text-secondary">FULL LOSS</span> of all your current project data!
          </div>
        </q-card-section>

        <q-card-section>
          <div class="row justify-center">
            <q-input
              filled
              dark
              ref="newProjectInput"
              style="width: 400px;"
              label="New project name"
              v-model.trim="newProjectName"
              :error="isInvalid && newProjectName.length > 0"
              :error-message="'Your project name contains invalid characters'"
              @keydown.enter.prevent="createNewProject"
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
          v-if="oldProjectName.length > 0"
          label="Save project"
          color="primary"
          @click="commenceSave"
           />
          <q-btn
            flat
            label="Create new project"
            :disable="isInvalid"
            color="primary"
            v-close-popup
            @click="createNewProject" />
        </q-card-actions>
      </q-card>
    </q-dialog>
</template>

<script setup lang="ts">

import { ref, computed, watch, nextTick } from "vue"
import { useRouter } from "vue-router"
import { useQuasar, Loading, QSpinnerGears, extend } from "quasar"
import { useAppStores } from "src/composables/useAppStores"
import { useDocumentHelpers } from "src/composables/useDocumentHelpers"
import { saveProject, createNewProject as createNewProjectAction } from "src/scripts/projectManagement/projectManagent"

const props = defineProps<{ dialogTrigger?: string }>()
const emit = defineEmits(["triggerDialogClose", "triggerDialogSubmit"])

const router = useRouter()
const q = useQuasar()
const { dialogsStore, optionsStore, projectStore } = useAppStores()
const { sleep } = useDocumentHelpers()

const dialogModel = ref(false)
const newProjectInput = ref<any>(null)

watch(() => dialogsStore.getDialogsState, (val) => { if (!val) dialogModel.value = false })

watch(() => props.dialogTrigger, async (val) => {
  if (val) {
    if (dialogsStore.getDialogsState) {
      return
    }
    dialogsStore.setDialogState(true)
    dialogModel.value = true
    newProjectName.value = ""
    oldProjectName.value = projectStore.getProjectName

    await sleep(300)

    /*eslint-disable */
    // @ts-ignore
    newProjectInput.value?.focus()
    /* eslint-enable */
  }
})

function triggerDialogClose () { dialogsStore.setDialogState(false); emit("triggerDialogClose", true) }
function triggerDialogSubmit (val: string) { emit("triggerDialogSubmit", val) }

/**
 * Determines if any project currently exists or not
 */
const oldProjectName = ref("")

/**
 * Model for the new project name
 */
const newProjectName = ref("")

const reservedCharacterList = [
  "/",
  ">",
  "<",
  "|",
  ":",
  "&",
  "\\",
  "-",
  "[",
  "]",
  "{",
  "}",
  "*",
  "?",
  "'",
  "\"",
  "#",
  "%",
  "$",
  "!",
  "@"
]

const isInvalid = computed(() => {
  let isValid = true
  if (newProjectName.value.length === 0) {
    isValid = false
  }

  reservedCharacterList.forEach(char => {
    if (newProjectName.value.includes(char)) {
      isValid = false
    }
  })

  return !isValid
})

/**
 * Create new project
 */
function createNewProject () {
  if (isInvalid.value) return

  Loading.show({
    message: "<h4>Setting up a new project...</h4>",
    spinnerColor: "primary",
    messageColor: "cultured",
    spinnerSize: 120,
    backgroundColor: "dark",
    // @ts-ignore
    spinner: QSpinnerGears
  })

  const optionsSnapShot = extend(true, {}, optionsStore.getOptions)
  // @ts-ignore
  optionsSnapShot.legacyFieldsCheck018 = false
  // @ts-ignore
  void optionsStore.setOptions(optionsSnapShot)

  projectStore.setProjectName(newProjectName.value)
  projectStore.setProjecLoadingState(false)

  createNewProjectAction(newProjectName.value, router, q).catch(e => console.log(e))
}

/**
 * Export current project
 */
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

<style lang="scss">

.newProjectCheckDialog {
  min-width: 600px;

  .q-field__messages {
    font-weight: 600;
    font-size: 14px;
  }
}
</style>
