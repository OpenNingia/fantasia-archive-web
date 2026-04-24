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

    <!-- Changelog dialog -->
    <changeLogDialog
      :dialog-trigger="changeLogDialogTrigger"
      @trigger-dialog-close="changeLogDialogClose"
    />

    <!-- Program settings dialog -->
    <programSettingsDialog
      :dialog-trigger="programSettingsDialogTrigger"
      @trigger-dialog-close="programSettingsDialogClose"
    />

    <!-- Program tutorials dialog -->
    <programTutorialsDialog
      :dialog-trigger="programTutorialsDialogTrigger"
      @trigger-dialog-close="programTutorialsDialogClose"
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

             <q-item
              @click="programTutorialsDialogAssignUID"
              v-close-popup
              clickable
              active
              active-class="bg-gunmetal-light text-cultured"
              class="noHigh"
              >
              <q-item-section>Program tutorials</q-item-section>
              <q-item-section avatar>
                <q-icon name="mdi-book-open-page-variant" />
              </q-item-section>
            </q-item>

            <q-separator dark />

            <q-item
              @click="changeLogDialogAssignUID"
              v-close-popup
              clickable
              active
              active-class="bg-gunmetal-light text-cultured"
              class="noHigh"
              >
              <q-item-section>Changelog</q-item-section>
              <q-item-section avatar>
                <q-icon name="mdi-clipboard-text" />
              </q-item-section>
            </q-item>

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

            <q-separator dark />

            <q-item
              @click="toggleDevTools"
              v-close-popup
              clickable
              active
              active-class="bg-gunmetal-light text-cultured"
              class="noHigh"
              >
              <q-item-section>Toggle developer tools</q-item-section>
              <q-item-section avatar>
                <q-icon name="mdi-code-tags" />
              </q-item-section>
            </q-item>

          </q-list>
        </q-menu>

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
import changeLogDialog from "src/components/dialogs/ChangeLog.vue"
import programSettingsDialog from "src/components/dialogs/ProgramSettings.vue"
import programTutorialsDialog from "src/components/dialogs/ProgramTutorials.vue"
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
import { toggleDevTools } from "src/scripts/utilities/devTools"

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

function checkProjectStatus () {
  projectExists.value = (projectStore.getProjectName.length > 0)
  isFrontpage.value = (route.path === "/")
  isProjectPage.value = (route.path === "/project")
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

  // Toggle dev tools
  if (determineKeyBind("toggleDeveloperTools")) {
    toggleDevTools()
  }

  // Toggle custom CSS editor
  if (determineKeyBind("openCustomCssEditor")) {
    customCssEditorAssignUID()
  }
}, { deep: true })

/****************************************************************/
// Full page search pop-up
/****************************************************************/

const fullPageSeachPopupTrigger = ref<string | false>(false)
function fullPageSeachPopupClose () {
  fullPageSeachPopupTrigger.value = false
}

function fullPageSeachPopupAssignUID () {
  fullPageSeachPopupTrigger.value = generateUID()
}

/****************************************************************/
// Navigate to project page action
/****************************************************************/

function navigateToProjectPage () {
  router.push({ path: "/project" }).catch((e: {name: string}) => {
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

const projectCloseCheckDialogTrigger = ref<string | false>(false)
function projectCloseCheckDialogClose () {
  projectCloseCheckDialogTrigger.value = false
}

function projectCloseCheckDialogAssignUID () {
  projectCloseCheckDialogTrigger.value = generateUID()
}

/****************************************************************/
// Import project dialog
/****************************************************************/

const loadProjectDialogTrigger = ref<string | false>(false)
function loadProjectDialogClose () {
  loadProjectDialogTrigger.value = false
}

function loadProjectAssignUID () {
  loadProjectDialogTrigger.value = generateUID()
}

/****************************************************************/
// Merge project dialog
/****************************************************************/

const mergeProjectDialogTrigger = ref<string | false>(false)
function mergeProjectDialogClose () {
  mergeProjectDialogTrigger.value = false
}

function mergeProjectAssignUID () {
  mergeProjectDialogTrigger.value = generateUID()
}

/****************************************************************/
// Custom CSS editor dialog
/****************************************************************/

const customCssEditorDialogTrigger = ref<string | false>(false)
function customCssEditorDialogClose () {
  customCssEditorDialogTrigger.value = false
}

function customCssEditorAssignUID () {
  customCssEditorDialogTrigger.value = generateUID()
}

/****************************************************************/
// Export project dialog
/****************************************************************/

const exportProjectDialogTrigger = ref<string | false>(false)
function exportProjectDialogClose () {
  exportProjectDialogTrigger.value = false
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

const newProjectDialogTrigger = ref<string | false>(false)
function newProjectDialogClose () {
  newProjectDialogTrigger.value = false
}

function newProjectAssignUID () {
  newProjectDialogTrigger.value = generateUID()
}

/****************************************************************/
// Keybinds cheatsheet dialog
/****************************************************************/

const keybindsDialogTrigger = ref<string | false>(false)
function keybindsDialogClose () {
  keybindsDialogTrigger.value = false
}

function keybindsDialogAssignUID () {
  keybindsDialogTrigger.value = generateUID()
}

/****************************************************************/
// About app dialog
/****************************************************************/

const aboutAppDialogTrigger = ref<string | false>(false)
function aboutAppDialogClose () {
  aboutAppDialogTrigger.value = false
}

function aboutAppDialogAssignUID () {
  aboutAppDialogTrigger.value = generateUID()
}

/****************************************************************/
// Changelog dialog
/****************************************************************/

const changeLogDialogTrigger = ref<string | false>(false)
function changeLogDialogClose () {
  changeLogDialogTrigger.value = false
}

function changeLogDialogAssignUID () {
  changeLogDialogTrigger.value = generateUID()
}

/****************************************************************/
// Program settings dialog
/****************************************************************/

const programSettingsDialogTrigger = ref<string | false>(false)
function programSettingsDialogClose () {
  programSettingsDialogTrigger.value = false
}

function programSettingsDialogAssignUID () {
  programSettingsDialogTrigger.value = generateUID()
}

/****************************************************************/
// Program tutorials dialog
/****************************************************************/

const programTutorialsDialogTrigger = ref<string | false>(false)
function programTutorialsDialogClose () {
  programTutorialsDialogTrigger.value = false
}

function programTutorialsDialogAssignUID () {
  programTutorialsDialogTrigger.value = generateUID()
}

/****************************************************************/
// Advanced search guide dialog
/****************************************************************/

const advancedSearchGuideDialogTrigger = ref<string | false>(false)
function advancedSearchGuideDialogClose () {
  advancedSearchGuideDialogTrigger.value = false
}

function advancedSearchGuideAssignUID () {
  advancedSearchGuideDialogTrigger.value = generateUID()
}

/****************************************************************/
// New document dialog
/****************************************************************/

const newObjectDialogTrigger = ref<string | false>(false)
function newObjectDialogClose () {
  newObjectDialogTrigger.value = false
}

function newObjectAssignUID () {
  newObjectDialogTrigger.value = generateUID()
}

/****************************************************************/
// Existing document dialog
/****************************************************************/

const existingObjectDialogTrigger = ref<string | false>(false)
function existingObjectDialogClose () {
  existingObjectDialogTrigger.value = false
}

function existingObjectAssignUID () {
  existingObjectDialogTrigger.value = generateUID()
}

/****************************************************************/
// Tips, Tricks & Trivia dialog
/****************************************************************/

const tipsTricksDialogTrigger = ref<string | false>(false)
function tipsTricksDialogClose () {
  tipsTricksDialogTrigger.value = false
}

function tipsTricksAssignUID () {
  tipsTricksDialogTrigger.value = generateUID()
}

/****************************************************************/
// License dialog
/****************************************************************/

const licenseDialogTrigger = ref<string | false>(false)
function licenseDialogClose () {
  licenseDialogTrigger.value = false
}

function licenseAssignUID () {
  licenseDialogTrigger.value = generateUID()
}

/****************************************************************/
// Repair project dialog
/****************************************************************/

const repairProjectDialogTrigger = ref<string | false>(false)
function repairProjectDialogClose () {
  repairProjectDialogTrigger.value = false
}

function repairProjectAssignUID () {
  repairProjectDialogTrigger.value = generateUID()
}

/****************************************************************/
// Mass delete documents dialog
/****************************************************************/

const massDocumentDeleteDialogTrigger = ref<string | false>(false)
function massDocumentDeleteDialogClose () {
  massDocumentDeleteDialogTrigger.value = false
}

function massDocumentDeleteDialogAssignUID () {
  massDocumentDeleteDialogTrigger.value = generateUID()
}

/****************************************************************/
// Project settings dialog
/****************************************************************/

const projectSettingsDialogTrigger = ref<string | false>(false)
function projectSettingsDialogClose () {
  projectSettingsDialogTrigger.value = false
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
