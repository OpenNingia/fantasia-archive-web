<template>
  <div id="q-app">

    <component v-bind:is="'style'" type="text/css" v-html="customCSS"></component>

    <component v-if="allowWiderScrollbars" v-bind:is="'style'" type="text/css" v-html="widerScrollBarCSSS"></component>

    <router-view />

    <!-- Document preview panel (replaces Vue-2-only q-window) -->
    <q-dialog
      v-model="documentPreviewWindowVisible"
      seamless
      position="left"
    >
      <q-card dark :class="{'bg-gunmetal-light text-accent docPreviewWindow': true, '-noBar': disableDocumentControlBar}" style="width:420px;max-width:90vw;">
        <q-btn
          icon="mdi-close"
          color="secondary"
          round
          flat
          size="md"
          class="previewCloseButton"
          @click="refreshDocumentPreviewWindow(false)"
        >
          <q-tooltip :delay="500" anchor="bottom middle" self="top middle">
            Close document preview
          </q-tooltip>
        </q-btn>
        <documentPreview
          :document-id="documentPreviewElementID"
          :display-mode="'document'"
        />
      </q-card>
    </q-dialog>

    <!-- Advanced Search Cheatsheet panel -->
    <q-dialog
      v-model="advSearchWindowVisible"
      seamless
      position="left"
    >
      <q-card dark class="bg-gunmetal-light text-accent advSearchWindow" style="width:500px;max-width:90vw;max-height:90vh;overflow:auto;">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">Advanced Search Cheatsheet</div>
          <q-space />
          <q-btn icon="mdi-close" flat round dense @click="advSearchWindowVisible = false" />
        </q-card-section>
        <q-card-section>
          <div class="markdown-body" v-html="renderedSearchCheatSheet" />
        </q-card-section>
      </q-card>
    </q-dialog>

    <!-- Note board / Corkboard panel -->
    <q-dialog
      v-model="corkboardWindowVisible"
      seamless
      position="right"
    >
      <q-card dark class="bg-gunmetal-light text-accent noteBoardWindow" style="width:350px;max-width:90vw;max-height:90vh;">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">Note board</div>
          <q-space />
          <q-btn icon="mdi-close" flat round dense @click="corkboardWindowVisible = false" />
        </q-card-section>
        <q-card-section>
          <form autocorrect="off" autocapitalize="off" autocomplete="off" spellcheck="false" class="corkboardInput">
            <q-input
              v-model="corkboardContent"
              filled
              dark
              @keyup="processCorkboardInput"
              type="textarea"
              style="min-height:400px;"
            />
          </form>
        </q-card-section>
      </q-card>
    </q-dialog>

  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed, onMounted, onUnmounted } from "vue"
import { useRoute } from "vue-router"
import { useI18n } from "vue-i18n"
import { useQuasar, setCssVar } from "quasar"
import { defaultKeybinds } from "src/scripts/appSettings/defaultKeybinds"
import type { OptionsStateInteface } from "./store/module-options/state"
import { tipsTricks } from "src/scripts/utilities/tipsTricks"
import { summonAllPlusheForms } from "src/scripts/utilities/plusheMascot"
import { saveCorkboard, retrieveCorkboard } from "src/scripts/projectManagement/projectManagent"
import documentPreview from "src/components/DocumentPreview.vue"
import { useAppStores } from "src/composables/useAppStores"
import { useDocumentHelpers } from "src/composables/useDocumentHelpers"
import { useMarkdown } from "src/composables/useMarkdown"

const q = useQuasar()
const route = useRoute()
const {
  keybindsStore,
  optionsStore,
  floatingWindowsStore,
  projectStore
} = useAppStores()
const { openLink, determineKeyBind } = useDocumentHelpers()
const { t } = useI18n()
const { render: renderMarkdown } = useMarkdown()
const renderedSearchCheatSheet = computed(() => renderMarkdown(t("documents.advancedSearchCheatSheet")))

// App is locked to dark mode — the original design assumes always-dark.
// Apply before mount so Quasar components render with the right theme on first paint.
q.dark.set(true)
setCssVar("dark", "#1b333e")
setCssVar("primary", "#ffd673")

/****************************************************************/
// APP START & END SETUP
/****************************************************************/

onMounted(async () => {
  // Catch middle clicks
  window.addEventListener("auxclick", reactToMiddleClick)

  // Add a secondary blocker to prevent the middle-mouse button scrolling
  document.body.onmousedown = function (e) {
    if (e.button === 1) {
      e.preventDefault()
      return false
    }
  }

  // Load settings
  loadSettings()

  await loadCorkboardCotent()

  // Load the popup hint on
  loadHintPopup()

  // React to keybind presses
  window.addEventListener("keydown", triggerKeyPush)

  // Catch normal clicks inside wysiwyg
  window.addEventListener("click", openWysiwygLink)
})

onUnmounted(() => {
  window.removeEventListener("auxclick", reactToMiddleClick)

  deregisterCustomKeybinds()
  deregisterDefaultKeybinds()
  window.removeEventListener("keydown", triggerKeyPush)
})

/****************************************************************/
// START NOTIFICATION
/****************************************************************/

/**
 * Model for the startup notification
 */
let starupNotif = null as any

/**
 * Notification checker
 * Can go up to 3
 */
let popupCheck = 0

/**
 * Show the actual popup
 */
function loadHintPopup () {
  const options = optionsStore.getOptions

  // Considering there is a bit of a delay between the initial load of the store DB content, we give the program 3 attempts to load the data over 3 seconds. If no is loaded in that time, we assume that the settings are not set at all and display the hint as normal.
  if ((!options._id || !options._rev) && popupCheck < 3) {
    setTimeout(() => {
      popupCheck++
      loadHintPopup()
    }, 1000)
    return
  }

  if (options.hideTooltipsStart) {
    return
  }

  const messageToShow = tipsTricks[Math.floor(Math.random() * tipsTricks.length)]
  const plusheForm = summonAllPlusheForms[Math.floor(Math.random() * summonAllPlusheForms.length)]
  starupNotif = q.notify({
    timeout: 15000,
    icon: (hidePlushes.value) ? "mdi-help" : undefined,
    color: "info",
    message: "Did you know?",
    avatar: (!hidePlushes.value) ? plusheForm : undefined,
    caption: messageToShow,
    actions: [{ icon: "mdi-close", color: "white" }]
  })
}

/**
 * Hide the startup notification if the user changed the route before it disappeared
 */
watch(route, () => {
  if (typeof starupNotif === "function") {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    starupNotif()
  }
})

/****************************************************************/
// KEYBIND HANDLING
/****************************************************************/

/**
 * React to keybind combinations being pushed and submit them to the store
 */
function triggerKeyPush (e: any) {
  const specialKeyList = [
    // F11
    122
  ]

  if (e?.altKey === true || e?.ctrlKey || e?.shiftKey || specialKeyList.includes(e?.which)) {
    const ouputKeycombo = {
      altKey: e.altKey,
      ctrlKey: e.ctrlKey,
      shiftKey: e.shiftKey,
      which: e.which
    }

    keybindsStore.updatePressedKey(ouputKeycombo)
  }
}

/**
 * Registers a default keybind into the store
 */
function registerDefaultKeybinds () {
  // @ts-ignore
  defaultKeybinds.forEach(e => keybindsStore.registerDefaultKeybind(e))
}

/**
 * Removes a default keybind from the store
 */
function deregisterDefaultKeybinds () {
  // @ts-ignore
  defaultKeybinds.forEach(e => keybindsStore.deregisterDefaultKeybind(e))
}

/**
 * Registers a custom keybind into the store
 */
function registerCustomKeybinds () {
  setTimeout(() => {
    optionsStore.getOptions.userKeybindList.forEach(e => keybindsStore.registerUserKeybind(e))
  }, 1000)
}

/**
 * Removes a custom keybind from the store
 */
function deregisterCustomKeybinds () {
  // @ts-ignore
  defaultKeybinds.forEach(e => keybindsStore.deregisterUserKeybind(e))
}

/****************************************************************/
// VARIOUS APP FUNCTIONALITY
/****************************************************************/

/**
 * Open wysiwyg links in default browser window
 */
function openWysiwygLink (event: MouseEvent) {
  event.preventDefault()
  // @ts-ignore
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  if (event.target && event.target.tagName.toLowerCase() === "a" && event.target.closest(".fieldWysiwyg")) {
    // @ts-ignore
    openLink(event.target.href as string)
    // @ts-ignore
  }
}

/**
 * React to middle mouse button clicks
 */
function reactToMiddleClick (e: {button: number, preventDefault: ()=> void}) {
  if (e.button === 1) {
    e.preventDefault()
    return false
  }
}

/**
 * Load settings from localStorage on app start.
 */
function loadSettings () {
  const raw = localStorage.getItem("fa_settings")
  if (raw) {
    try {
      const settings = JSON.parse(raw) as OptionsStateInteface
      // App is locked to dark mode — override any persisted value.
      settings.darkMode = true
      optionsStore.setOptions(settings)
    }
    catch (e) {
      console.warn("Failed to parse stored settings", e)
    }
  }

  registerDefaultKeybinds()
  registerCustomKeybinds()
}

/**
 * Propagate option changes that affect app-level UI state.
 */
watch(() => optionsStore.getOptions, () => {
  const options = optionsStore.getOptions

  hidePlushes.value = options.hidePlushes
  allowWiderScrollbars.value = options.allowWiderScrollbars

  disableDocumentControlBar.value = options.disableDocumentControlBar
  refreshDocumentPreviewWindow()

  if (options.disableSpellCheck) {
    document.body.setAttribute("spellcheck", "false")
  }
  else {
    document.body.setAttribute("spellcheck", "true")
  }
}, { deep: true })

const disableDocumentControlBar = ref(false)

/**
 * Hides the mascot... nooo :(
 */
const hidePlushes = ref(false)

const allowWiderScrollbars = ref(false)

watch(() => floatingWindowsStore.getAdvSearchWindowVisible, () => {
  advSearchWindowVisible.value = true
})

const advSearchWindowVisible = ref(false)

watch(() => floatingWindowsStore.getNoteCorkboardWindowVisible, () => {
  corkboardWindowVisible.value = true
})

const corkboardWindowVisible = ref(false)

const corkboardContent = ref("")

/**
 * Debounce timer to prevent buggy input sync
 */
let corkboardTimer = null as any

function processCorkboardInput () {
  clearTimeout(corkboardTimer)
  corkboardTimer = setTimeout(() => {
    saveCorkboard(corkboardContent.value, projectStore.currentProjectId).catch(e => console.log(e))
  }, 1000)
}

/**
 * Corkboard checker
 * Can go up to 3
 */
let corkboardCheck = 0

async function loadCorkboardCotent () {
  const options = optionsStore.getOptions

  corkboardContent.value = await retrieveCorkboard(projectStore.currentProjectId)

  // Considering there is a bit of a delay between the initial load of the store DB content, we give the program 3 attempts to load the data over 3 seconds. If no is loaded in that time, we assume that the settings are not set at all and display the hint as normal.
  if ((!options._id || !options._rev) && corkboardCheck < 3) {
    setTimeout(() => {
      corkboardCheck++
      loadCorkboardCotent().catch(e => console.log(e))
    }, 1000)
    return
  }

  if (options.preventFilledNoteBoardPopup) {
    return
  }

  if (corkboardContent.value.length) {
    corkboardWindowVisible.value = true
  }
}

const documentPreviewWindowVisible = ref(false)
const documentPreviewElementID = ref("")

watch(() => floatingWindowsStore.getDocumentPreviewWindowID, () => {
  refreshDocumentPreviewWindow()
})

watch(() => floatingWindowsStore.getDocumentPreviewVisible, () => {
  if (floatingWindowsStore.getDocumentPreviewVisible !== "") {
    refreshDocumentPreviewWindow()
  }
})

function refreshDocumentPreviewWindow (input = true) {
  documentPreviewElementID.value = floatingWindowsStore.getDocumentPreviewWindowID
  const newOpenString = floatingWindowsStore.getDocumentPreviewVisible

  if (!input || newOpenString.length === 0) {
    floatingWindowsStore.setDocumentPreviewWindowVisible(false)
    documentPreviewWindowVisible.value = false
  }
  else {
    documentPreviewWindowVisible.value = true
  }
}

/****************************************************************/
// Local keybinds
/****************************************************************/

watch(() => keybindsStore.getCurrentKeyBindData, () => {
  // Toggle the Advanced search cheatsheet
  if (determineKeyBind("toggleAdvSearchCheatsheet")) {
    advSearchWindowVisible.value = !advSearchWindowVisible.value
  }

  // Toggle Note Board - CTRL + ALT + SHIFT + P
  if (determineKeyBind("toggleNoteCorkboard")) {
    corkboardWindowVisible.value = !corkboardWindowVisible.value
  }
}, { deep: true })

/****************************************************************/
// CUSTOM CSS ATTACHING
/****************************************************************/

const widerScrollBarCSSS = "*::-webkit-scrollbar{width: 15px !important; height: 15px !important;}"

const customCSS = ref("")

watch(() => projectStore.getProjectCustomCSS, () => {
  customCSS.value = projectStore.getProjectCustomCSS
}, { deep: true })

</script>
