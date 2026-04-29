<template>
    <q-dialog
      v-model="dialogModel"
      persistent
      @before-hide="triggerDialogClose"
      no-route-dismiss
      >
      <q-card dark class="customCssEditorDialog">
         <q-card-section class="row justify-center">
          <h6 class="text-center q-my-sm">Custom CSS editor</h6>
        </q-card-section>

        <q-card-section class="codeMirrorWrapper row justify-center q-mx-xl">
         <codemirror v-model="customCSS" :options="cmOption" />
        </q-card-section>

        <q-card-actions align="right" class="q-mb-lg q-mt-md closeButton">
          <q-btn
            flat
            label="Cancel without saving"
            color="accent"
            v-close-popup />
          <q-btn
            flat
            label="Save CSS code changes"
            color="primary"
            v-close-popup
            @click="saveCustomCss()" />
        </q-card-actions>

      </q-card>
    </q-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from "vue"
import { useAppStores } from "src/composables/useAppStores"
import { changeCurrentProjectSettings } from "src/scripts/projectManagement/projectManagent"
import { Codemirror as codemirror } from "vue-codemirror"

const props = defineProps<{ dialogTrigger?: string }>()
const emit = defineEmits(["triggerDialogClose", "triggerDialogSubmit"])

const { dialogsStore, projectStore } = useAppStores()

const dialogModel = ref(false)
const customCSS = ref("")

const cmOption = {
  tabSize: 4,
  styleActiveLine: true,
  lineNumbers: true,
  line: true,
  autoRefresh: true,
  mode: "text/css",
  theme: "monokai"
}

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
  customCSS.value = projectStore.getProjectCustomCSS
}

async function saveCustomCss () {
  const newSettings = {
    projectCustomCSS: customCSS.value
  }

  await changeCurrentProjectSettings(newSettings)
  projectStore.setProjectCustomCSS(customCSS.value)

  triggerDialogClose()
}
</script>

<style lang="scss">

.customCssEditorDialog {
  width: 1400px;
  max-width: calc(100vw - 100px) !important;
  max-height: calc(100vh - 85px);
  height: 100%;

  .closeButton {
    width: 100%;
  }

  .codeMirrorWrapper{
    height: calc(100% - 175px);
  }

  .vue-codemirror{
    width: 100%;
    height: 100%;
    max-height: 100%;
  }

  .CodeMirror {
    height: 100%;
  }

  .CodeMirror-gutter-wrapper{
    left: -30px !important;
  }

  .CodeMirror pre.CodeMirror-line,
  .CodeMirror pre.CodeMirror-line-like{
    padding-left: 30px;
  }
}

</style>
