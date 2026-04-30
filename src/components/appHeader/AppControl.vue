<template>

  <div
    :class="{'AppControl': !isFrontpage}"
  >

    <appSearchBox
      v-if="fullPageSeachPopupTrigger"
    />

    <!-- New document dialog -->
    <newDocumentDialog
      :dialog-trigger="newObjectDialogTrigger"
      @trigger-dialog-close="newObjectDialogClose"
    />

    <!-- Existing document dialog -->
    <existingDocumentDialog
      :dialog-trigger="existingObjectDialogTrigger"
      @trigger-dialog-close="existingObjectDialogClose"
    />

    <!-- Project close dialog -->
    <projectCloseCheckDialog
     :dialog-trigger="projectCloseCheckDialogTrigger"
     :dialog-mode="'projectClose'"
      @trigger-dialog-close="projectCloseCheckDialogClose"
    />

    <!-- Keybind dialog -->
    <keybindCheatsheetDialog
      :dialog-trigger="keybindsDialogTrigger"
      @trigger-dialog-close="keybindsDialogClose"
    />

    <!-- Load project dialog -->
    <loadProjectCheckDialog
      :dialog-trigger="loadProjectDialogTrigger"
      @trigger-dialog-close="loadProjectDialogClose"
    />

    <!-- Merge project dialog -->
    <mergeProjectCheckDialog
      :dialog-trigger="mergeProjectDialogTrigger"
      @trigger-dialog-close="mergeProjectDialogClose"
    />

    <!-- Merge project dialog -->
    <customCssEditorDialog
      :dialog-trigger="customCssEditorDialogTrigger"
      @trigger-dialog-close="customCssEditorDialogClose"
    />

    <!-- New project dialog -->
    <newProjectCheckDialog
      :dialog-trigger="newProjectDialogTrigger"
      @trigger-dialog-close="newProjectDialogClose"
    />

    <!-- About app dialog -->
    <aboutAppDialog
      :dialog-trigger="aboutAppDialogTrigger"
      @trigger-dialog-close="aboutAppDialogClose"
    />

    <!-- Program settings dialog -->
    <programSettingsDialog
      :dialog-trigger="programSettingsDialogTrigger"
      @trigger-dialog-close="programSettingsDialogClose"
    />

    <!-- Advanced search guide dialog -->
    <advancedSearchGuideDialog
      :dialog-trigger="advancedSearchGuideDialogTrigger"
      @trigger-dialog-close="advancedSearchGuideDialogClose"
    />

    <!-- Tips, Tricks & Trivia dialog -->
    <tipsTricksTriviaDialog
      :dialog-trigger="tipsTricksDialogTrigger"
      @trigger-dialog-close="tipsTricksDialogClose"
    />

    <!-- License dialog -->
    <licenseDialog
      :dialog-trigger="licenseDialogTrigger"
      @trigger-dialog-close="licenseDialogClose"
    />

    <!-- Repair project dialog -->
    <repairProjectDialog
      :dialog-trigger="repairProjectDialogTrigger"
      @trigger-dialog-close="repairProjectDialogClose"
    />

    <!-- Export project dialog -->
    <exportProjectDialog
      :prepicked-ids="exportIDlist"
      :dialog-trigger="exportProjectDialogTrigger"
      @trigger-dialog-close="exportProjectDialogClose"
    />

    <!-- Delete tag dialog -->
    <massDeleteDocumentsCheckDialog
      :dialog-trigger="massDocumentDeleteDialogTrigger"
      @trigger-dialog-close="massDocumentDeleteDialogClose"
    />

    <!-- Project settings dialog -->
    <projectSettingsdDialog
      :dialog-trigger="projectSettingsDialogTrigger"
      @trigger-dialog-close="projectSettingsDialogClose"
    />

    <q-btn-group
      flat
      class="AppControl__buttons"
    >

      <!-- Options button -->
      <q-btn
        flat
        :ripple="false"
        dark
        size='md'
        no-caps
        @click="programSettingsDialogAssignUID"
       >
        <q-img
          :src="appLogo"
          style="height: 26px; width: 26px; margin: 0 -9px;"
        />
        <q-tooltip anchor="center right" self="center left" :delay="500">
          Program settings
        </q-tooltip>

      </q-btn>
      <q-separator color="primary" vertical dark style="opacity: 0.1;" />
      <!-- Project button-->
      <q-btn
        flat
        :ripple="false"
        dark
        size='md'
        no-caps
       >
        Project

        <q-menu
          @show="checkProjectStatus"
          anchor="bottom left"
          class="bg-gunmetal-light"
          dark
          square
          >
          <q-list class="bg-gunmetal-light" dark>

             <q-item
              v-close-popup
              clickable
              active
              active-class="bg-gunmetal-light text-cultured"
              class="noHigh"
              @click="newProjectAssignUID"
            >
              <q-item-section>New project</q-item-section>
               <q-item-section avatar>
                <q-icon name="mdi-plus" />
              </q-item-section>
            </q-item>

            <q-separator dark />

            <q-item
              v-close-popup
              clickable
              active
              active-class="bg-gunmetal-light text-cultured"
              class="noHigh"
              @click="commenceSave"
              :disable="!projectExists || isFrontpage"
            >
              <q-item-section>Save current project</q-item-section>
              <q-item-section avatar>
                <q-icon name="mdi-package-variant-closed" />
              </q-item-section>
            </q-item>

            <q-item
              v-close-popup
              clickable
              active
              active-class="bg-gunmetal-light text-cultured"
              class="noHigh"
              @click="loadProjectAssignUID"
            >
              <q-item-section>Load existing project</q-item-section>
              <q-item-section avatar>
                <q-icon name="mdi-package-variant" />
              </q-item-section>
            </q-item>

            <q-separator dark />

            <q-item
              v-close-popup
              clickable
              active
              active-class="bg-gunmetal-light text-cultured"
              class="noHigh"
              @click="triggerExport([])"
              :disable="!projectExists || isFrontpage"
            >
              <q-item-section>Export project/documents</q-item-section>
              <q-item-section avatar>
                <q-icon name="mdi-database-export-outline" />
              </q-item-section>
            </q-item>

            <q-separator dark />

            <q-item
              v-close-popup
              clickable
              active
              active-class="bg-gunmetal-light text-cultured"
              class="noHigh"
              @click="navigateToProjectPage"
              :disable="!projectExists || isProjectPage"
            >
              <q-item-section>Show project overview</q-item-section>
              <q-item-section avatar>
                <q-icon name="mdi-chart-bar" />
              </q-item-section>
            </q-item>

            <q-item
              v-close-popup
              clickable
              active
              active-class="bg-gunmetal-light text-cultured"
              class="noHigh"
              @click="projectCloseCheckDialogAssignUID"
              :disable="!projectExists || isFrontpage"
            >
              <q-item-section>Close project</q-item-section>
              <q-item-section avatar>
                <q-icon name="mdi-exit-to-app" />
              </q-item-section>
            </q-item>

            <q-separator dark />

            <q-item
              v-close-popup
              clickable
              active
              active-class="bg-gunmetal-light text-cultured"
              class="noHigh"
              @click="projectSettingsDialogAssignUID"
              :disable="!projectExists || isFrontpage"
            >
              <q-item-section>Project settings</q-item-section>
              <q-item-section avatar>
                <q-icon name="mdi-book-cog-outline" />
              </q-item-section>
            </q-item>

            <q-item clickable>
              <q-item-section>Advanced project tools</q-item-section>
              <q-item-section avatar>
                <q-icon name="keyboard_arrow_right" />
              </q-item-section>
              <q-menu anchor="top end" self="top start">
                <q-list class="bg-gunmetal text-accent">

                  <q-item
                    v-close-popup
                    clickable
                    active
                    active-class="bg-gunmetal-light text-cultured"
                    class="noHigh"
                    @click="mergeProjectAssignUID"
                    :disable="!projectExists || isFrontpage"
                  >
                    <q-item-section>Merge another project into the current one</q-item-section>
                    <q-item-section avatar>
                      <q-icon name="mdi-folder-plus-outline" />
                    </q-item-section>
                  </q-item>

                  <q-item
                    v-close-popup
                    clickable
                    active
                    active-class="bg-gunmetal-light text-cultured"
                    class="noHigh"
                    @click="customCssEditorAssignUID"
                    :disable="!projectExists"
                  >
                    <q-item-section>Custom CSS editor</q-item-section>
                    <q-item-section avatar>
                      <q-icon name="mdi-language-css3" />
                    </q-item-section>
                  </q-item>

                  <q-separator dark />

                  <q-item
                    v-close-popup
                    clickable
                    active
                    active-class="bg-gunmetal-light text-cultured"
                    class="noHigh"
                    @click="repairProjectAssignUID"
                    :disable="!projectExists || isFrontpage"
                  >
                    <q-item-section>Repair legacy project</q-item-section>
                    <q-item-section avatar>
                      <q-icon name="mdi-wrench" />
                    </q-item-section>
                  </q-item>

                </q-list>
              </q-menu>
            </q-item>
          </q-list>
        </q-menu>
      </q-btn>

      <!-- Tools button-->
      <q-btn
        flat
        :ripple="false"
        dark
        size='md'
        no-caps
       >
        Tools

        <q-menu
          @show="checkProjectStatus"
          anchor="bottom left"
          class="bg-gunmetal-light"
          dark
          square
          >
          <q-list class="bg-gunmetal-light" dark>

             <q-item
              v-close-popup
              clickable
              active
              active-class="bg-gunmetal-light text-cultured"
              class="noHigh"
              @click="newObjectAssignUID"
              :disable="!projectExists || isFrontpage"
            >
              <q-item-section>Quick-add new document</q-item-section>
              <q-item-section avatar>
                <q-icon name="mdi-text-box-plus-outline" />
              </q-item-section>
            </q-item>

             <q-item
              v-close-popup
              clickable
              active
              active-class="bg-gunmetal-light text-cultured"
              class="noHigh"
              @click="existingObjectAssignUID"
              :disable="!projectExists || isFrontpage"
            >
              <q-item-section>Quick-search existing document</q-item-section>
              <q-item-section avatar>
                <q-icon name="mdi-database-search" />
              </q-item-section>
            </q-item>

            <q-separator dark />

            <q-item
              clickable
              v-close-popup
              @click="massDocumentDeleteDialogAssignUID"
              :disable="!projectExists || isFrontpage"
              >
              <q-item-section class="text-secondary"><b>Mass delete documents</b></q-item-section>
              <q-item-section avatar class="text-secondary">
                <q-icon name="mdi-text-box-remove-outline" />
              </q-item-section>
            </q-item>

            <q-separator dark />

              <q-item
              v-close-popup
              clickable
              active
              active-class="bg-gunmetal-light text-cultured"
              class="noHigh"
              @click="toggleHierarchicalTree"
              :disable="!projectExists || isFrontpage"
            >
              <q-item-section>Toggle hierarchical tree</q-item-section>
              <q-item-section avatar>
                <q-icon name="mdi-page-layout-sidebar-left" />
              </q-item-section>
            </q-item>

            <q-item
              v-close-popup
              clickable
              active
              active-class="bg-gunmetal-light text-cultured"
              class="noHigh"
              @click="floatingWindowsStore.setNoteCorkboardWindowVisible()"
              :disable="!projectExists || isFrontpage"
            >
              <q-item-section>Show note board</q-item-section>
              <q-item-section avatar>
                <q-icon name="mdi-clipboard-text-outline" />
              </q-item-section>
            </q-item>

            <q-separator dark />

            <q-item
              @click="programSettingsDialogAssignUID"
              v-close-popup
              clickable
              active
              active-class="bg-gunmetal-light text-cultured"
              class="noHigh"
              >
              <q-item-section>Program settings</q-item-section>
              <q-item-section avatar>
                <q-icon name="mdi-tune" />
              </q-item-section>
            </q-item>

          </q-list>
        </q-menu>
      </q-btn>

      <!-- Help button-->
      <q-btn
        flat
        :ripple="false"
        dark
        size='md'
        no-caps
       >
        Help & Info
        <q-menu
          anchor="bottom left"
          class="bg-gunmetal-light"
          dark
          square
        >
          <q-list class="bg-gunmetal-light" dark>

            <q-item
              @click="keybindsDialogAssignUID"
              v-close-popup
              clickable
              active
              active-class="bg-gunmetal-light text-cultured"
              class="noHigh"
              >
              <q-item-section>Show keybind cheatsheet</q-item-section>
                <q-item-section avatar>
                <q-icon name="mdi-keyboard-settings" />
              </q-item-section>
            </q-item>

            <q-item
              @click="advancedSearchGuideAssignUID"
              v-close-popup
              clickable
              active
              active-class="bg-gunmetal-light text-cultured"
              class="noHigh"
              >
              <q-item-section>Advanced search guide</q-item-section>
              <q-item-section avatar>
                <q-icon name="mdi-file-question" />
              </q-item-section>
            </q-item>

            <q-item
              @click="tipsTricksAssignUID"
              v-close-popup
              clickable
              active
              active-class="bg-gunmetal-light text-cultured"
              class="noHigh"
              >
              <q-item-section>Tips, Tricks & Trivia</q-item-section>
              <q-item-section avatar>
                <q-icon name="mdi-fire-alert" />
              </q-item-section>
            </q-item>

            <q-separator dark />

            <q-item
              @click="aboutAppDialogAssignUID"
              v-close-popup
              clickable
              active
              active-class="bg-gunmetal-light text-cultured"
              class="noHigh"
              >
              <q-item-section>About Fantasia Archive</q-item-section>
              <q-item-section avatar>
                <q-icon name="mdi-information-variant" />
              </q-item-section>
            </q-item>

            <q-item
              @click="licenseAssignUID"
              v-close-popup
              clickable
              active
              active-class="bg-gunmetal-light text-cultured"
              class="noHigh"
              >
              <q-item-section>License</q-item-section>
              <q-item-section avatar>
                <q-icon name="mdi-script-text-outline" />
              </q-item-section>
            </q-item>

          </q-list>
        </q-menu>

      </q-btn>

      <q-separator color="primary" vertical dark style="opacity: 0.1;" />
      <!-- Logout button -->
      <q-btn
        flat
        :ripple="false"
        dark
        size="md"
        icon="mdi-logout"
        data-testid="logout-btn"
        @click="doLogout"
      >
        <q-tooltip anchor="center right" self="center left" :delay="500">
          Sign out
        </q-tooltip>
      </q-btn>
    </q-btn-group>

  </div>

</template>

<script setup lang="ts">
import { ref, watch } from "vue"
import { useRoute, useRouter } from "vue-router"
import { useQuasar } from "quasar"

import projectCloseCheckDialog from "src/components/dialogs/ProjectCloseCheck.vue"
import keybindCheatsheetDialog from "src/components/dialogs/KeybindCheatsheet.vue"
import loadProjectCheckDialog from "src/components/dialogs/LoadProjectCheck.vue"
import mergeProjectCheckDialog from "src/components/dialogs/MergeProjectCheck.vue"
import newProjectCheckDialog from "src/components/dialogs/NewProjectCheck.vue"
import repairProjectDialog from "src/components/dialogs/RepairProject.vue"
import aboutAppDialog from "src/components/dialogs/AboutApp.vue"
import programSettingsDialog from "src/components/dialogs/ProgramSettings.vue"
import advancedSearchGuideDialog from "src/components/dialogs/AdvancedSearchGuide.vue"
import newDocumentDialog from "src/components/dialogs/NewDocument.vue"
import existingDocumentDialog from "src/components/dialogs/ExistingDocument.vue"
import tipsTricksTriviaDialog from "src/components/dialogs/TipsTricksTrivia.vue"
import licenseDialog from "src/components/dialogs/License.vue"
import exportProjectDialog from "src/components/dialogs/ExportProject.vue"
import massDeleteDocumentsCheckDialog from "src/components/dialogs/MassDeleteDocumentsCheck.vue"
import projectSettingsdDialog from "src/components/dialogs/ProjectSettings.vue"
import customCssEditorDialog from "src/components/dialogs/CustomCssEditor.vue"

import { Loading, QSpinnerGears } from "quasar"
import { saveProject } from "src/scripts/projectManagement/projectManagent"
import { projectHomePath } from "src/scripts/utilities/projectRoutes"
import { authApi } from "src/services/api/authApi"

import appLogo from "src/assets/appLogo.png"
import appSearchBox from "src/components/appHeader/AppSearchBox.vue"

import { useAppStores } from "src/composables/useAppStores"
import { useDocumentHelpers } from "src/composables/useDocumentHelpers"

const route = useRoute()
const router = useRouter()
const q = useQuasar()

const {
  keybindsStore,
  dialogsStore,
  floatingWindowsStore,
  projectStore
} = useAppStores()

const {
  generateUID,
  determineKeyBind,
  toggleHierarchicalTree
} = useDocumentHelpers()

async function doLogout () {
  try { await authApi.logout() } catch { /* ignore */ }
  projectStore.setCurrentUser(null)
  await router.push("/login")
}

/****************************************************************/
// Basic component functionality
/****************************************************************/

const projectExists = ref<undefined | string | boolean>(false)
const isFrontpage = ref(true)
const isProjectPage = ref(true)

// created
checkProjectStatus()

watch(() => projectStore.getProjectName, () => {
  checkProjectStatus()
})

watch(() => route.path, () => {
  checkProjectStatus()
})

function checkProjectStatus () {
  projectExists.value = (projectStore.getProjectName.length > 0)
  isFrontpage.value = (route.path === "/")
  isProjectPage.value = (route.name === "project-home")
}

/****************************************************************/
// Local keybinds
/****************************************************************/

watch(() => keybindsStore.getCurrentKeyBindData, () => {
  // Open full page search
  if (determineKeyBind("openFullPageSearch") && !dialogsStore.getDialogsState) {
    fullPageSeachPopupClose()

    setTimeout(() => {
      fullPageSeachPopupAssignUID()
    }, 100)
  }

  // Keybind cheatsheet
  if (determineKeyBind("openKeybindsCheatsheet") && !dialogsStore.getDialogsState) {
    keybindsDialogAssignUID()
  }

  // Open app options page
  if (determineKeyBind("openAppOptions") && !dialogsStore.getDialogsState) {
    programSettingsDialogAssignUID()
  }

  // Navigate to project overview
  if (determineKeyBind("navigateToProjectOverview") && projectExists.value && !isProjectPage.value) {
    navigateToProjectPage()
  }

  // Toggle custom CSS editor
  if (determineKeyBind("openCustomCssEditor")) {
    customCssEditorAssignUID()
  }
}, { deep: true })

/****************************************************************/
// Full page search pop-up
/****************************************************************/

const fullPageSeachPopupTrigger = ref("")
function fullPageSeachPopupClose () {
  fullPageSeachPopupTrigger.value = ""
}

function fullPageSeachPopupAssignUID () {
  fullPageSeachPopupTrigger.value = generateUID()
}

/****************************************************************/
// Navigate to project page action
/****************************************************************/

function navigateToProjectPage () {
  router.push({ path: projectHomePath(projectStore.currentProjectId) }).catch((e: {name: string}) => {
    if (e && e.name !== "NavigationDuplicated") {
      console.log(e)
    }
  })
}

/****************************************************************/
// Save project action
/****************************************************************/
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

/****************************************************************/
// Close project dialog
/****************************************************************/

const projectCloseCheckDialogTrigger = ref("")
function projectCloseCheckDialogClose () {
  projectCloseCheckDialogTrigger.value = ""
}

function projectCloseCheckDialogAssignUID () {
  projectCloseCheckDialogTrigger.value = generateUID()
}

/****************************************************************/
// Import project dialog
/****************************************************************/

const loadProjectDialogTrigger = ref("")
function loadProjectDialogClose () {
  loadProjectDialogTrigger.value = ""
}

function loadProjectAssignUID () {
  loadProjectDialogTrigger.value = generateUID()
}

/****************************************************************/
// Merge project dialog
/****************************************************************/

const mergeProjectDialogTrigger = ref("")
function mergeProjectDialogClose () {
  mergeProjectDialogTrigger.value = ""
}

function mergeProjectAssignUID () {
  mergeProjectDialogTrigger.value = generateUID()
}

/****************************************************************/
// Custom CSS editor dialog
/****************************************************************/

const customCssEditorDialogTrigger = ref("")
function customCssEditorDialogClose () {
  customCssEditorDialogTrigger.value = ""
}

function customCssEditorAssignUID () {
  customCssEditorDialogTrigger.value = generateUID()
}

/****************************************************************/
// Export project dialog
/****************************************************************/

const exportProjectDialogTrigger = ref("")
function exportProjectDialogClose () {
  exportProjectDialogTrigger.value = ""
}

watch(() => dialogsStore.getExportDialogState, () => {
  const exportState = dialogsStore.getExportDialogState

  exportIDlist.value = exportState.prepickedValue
  exportProjectAssignUID()
}, { deep: true })

function triggerExport (IDlist: string[]) {
  dialogsStore.setExportDialogState(IDlist)
}

const exportIDlist = ref<string[]>([])
function exportProjectAssignUID () {
  exportProjectDialogTrigger.value = generateUID()
}

/****************************************************************/
// New project dialog
/****************************************************************/

const newProjectDialogTrigger = ref("")
function newProjectDialogClose () {
  newProjectDialogTrigger.value = ""
}

function newProjectAssignUID () {
  newProjectDialogTrigger.value = generateUID()
}

/****************************************************************/
// Keybinds cheatsheet dialog
/****************************************************************/

const keybindsDialogTrigger = ref("")
function keybindsDialogClose () {
  keybindsDialogTrigger.value = ""
}

function keybindsDialogAssignUID () {
  keybindsDialogTrigger.value = generateUID()
}

/****************************************************************/
// About app dialog
/****************************************************************/

const aboutAppDialogTrigger = ref("")
function aboutAppDialogClose () {
  aboutAppDialogTrigger.value = ""
}

function aboutAppDialogAssignUID () {
  aboutAppDialogTrigger.value = generateUID()
}

/****************************************************************/
// Program settings dialog
/****************************************************************/

const programSettingsDialogTrigger = ref("")
function programSettingsDialogClose () {
  programSettingsDialogTrigger.value = ""
}

function programSettingsDialogAssignUID () {
  programSettingsDialogTrigger.value = generateUID()
}

/****************************************************************/
// Advanced search guide dialog
/****************************************************************/

const advancedSearchGuideDialogTrigger = ref("")
function advancedSearchGuideDialogClose () {
  advancedSearchGuideDialogTrigger.value = ""
}

function advancedSearchGuideAssignUID () {
  advancedSearchGuideDialogTrigger.value = generateUID()
}

/****************************************************************/
// New document dialog
/****************************************************************/

const newObjectDialogTrigger = ref("")
function newObjectDialogClose () {
  newObjectDialogTrigger.value = ""
}

function newObjectAssignUID () {
  newObjectDialogTrigger.value = generateUID()
}

/****************************************************************/
// Existing document dialog
/****************************************************************/

const existingObjectDialogTrigger = ref("")
function existingObjectDialogClose () {
  existingObjectDialogTrigger.value = ""
}

function existingObjectAssignUID () {
  existingObjectDialogTrigger.value = generateUID()
}

/****************************************************************/
// Tips, Tricks & Trivia dialog
/****************************************************************/

const tipsTricksDialogTrigger = ref("")
function tipsTricksDialogClose () {
  tipsTricksDialogTrigger.value = ""
}

function tipsTricksAssignUID () {
  tipsTricksDialogTrigger.value = generateUID()
}

/****************************************************************/
// License dialog
/****************************************************************/

const licenseDialogTrigger = ref("")
function licenseDialogClose () {
  licenseDialogTrigger.value = ""
}

function licenseAssignUID () {
  licenseDialogTrigger.value = generateUID()
}

/****************************************************************/
// Repair project dialog
/****************************************************************/

const repairProjectDialogTrigger = ref("")
function repairProjectDialogClose () {
  repairProjectDialogTrigger.value = ""
}

function repairProjectAssignUID () {
  repairProjectDialogTrigger.value = generateUID()
}

/****************************************************************/
// Mass delete documents dialog
/****************************************************************/

const massDocumentDeleteDialogTrigger = ref("")
function massDocumentDeleteDialogClose () {
  massDocumentDeleteDialogTrigger.value = ""
}

function massDocumentDeleteDialogAssignUID () {
  massDocumentDeleteDialogTrigger.value = generateUID()
}

/****************************************************************/
// Project settings dialog
/****************************************************************/

const projectSettingsDialogTrigger = ref("")
function projectSettingsDialogClose () {
  projectSettingsDialogTrigger.value = ""
}

function projectSettingsDialogAssignUID () {
  projectSettingsDialogTrigger.value = generateUID()
}
</script>

<style lang="scss" scoped>
.AppControl {
  background: rgba(0, 0, 0, 0.1);

  &__buttons {
    height: 40px;
    -webkit-app-region: no-drag;
  }
}
</style>
