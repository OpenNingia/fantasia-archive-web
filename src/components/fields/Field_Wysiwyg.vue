<template>
  <div v-if="!isMasterOnlyField || canEditMasterOnlyField">
    <!-- Insert image dialog -->
    <WISIWYG_insertImageChoice
      :dialog-trigger="WISIWYG_insertImageChoiceDialogTrigger"
      @trigger-dialog-close="WISIWYG_insertImageChoiceDialogClose"
      @passing-image-link="insertImageLink"
    />

    <!-- Change image path dialog -->
    <WISIWYG_changeImagePath
      :dialog-trigger="WISIWYG_changeImagePathDialogTrigger"
      @trigger-dialog-close="WISIWYG_changeImagePathDialogClose"
      @passing-image-path-change="changeImagePath"
      :current-image-path="currentImagePath"
      :current-image-target="currentImageTarget"
    />

    <!-- Insert existing document dialog -->
    <existingDocumentDialog
      v-if="editMode"
      :prevent-open="true"
      :quick-insert-mode="true"
      :dialog-trigger="existingObjectDialogTrigger"
      @trigger-dialog-close="existingObjectDialogClose"
      @signal-document-selected="handleDocumentSelected"
    />

    <div class="flex justify-center items-center text-weight-bolder q-mb-sm q-mt-md fieldWysiwygTitle">
      <span>
      <q-icon v-if="inputIcon" :name="inputIcon"  :size="(inputIcon.includes('fas') || inputIcon.includes('fab'))? '15px': '20px'"   class="q-mr-md"/>
      {{inputDataBluePrint.name}}
       <q-icon v-if="toolTip && !disableDocumentToolTips" name="mdi-help-circle" size="16px" class="q-ml-md">
         <q-tooltip :delay="500">
           <span v-html="toolTip"/>
        </q-tooltip>
      </q-icon>
      </span>
    </div>

    <div
      v-if="!editMode"
      class="fieldWysiwyg"
      v-html="localInput">
    </div>

    <div>
      <q-editor
      v-model="localInput"
      :id="inputDataBluePrint.id"
      :ref="`wysiwygField${inputDataBluePrint.id}`"
      @paste.native="evt => pasteCapture(evt)"
      :toolbar="wysiwygOptions"
      :fonts="wysiwygFonts"
      @update:model-value="processInput"
      :flat="isDarkMode"
      :dense="isMobile"
      v-if="editMode"
      :definitions="definitions"
      :min-height="isMobile ? '200px' : '350px'"
      :class="{
        'limitEditorHeight': limitEditorHeight,
        'fieldWysiwygEditor--mobile': isMobile
      }"
      @keypress.native="handleEditorKeypress"
      @click.native="handleEditorClick"
      @contextmenu="handleRightClick($event)"
      >
      </q-editor>
    </div>

    <div class="separatorWrapper">
      <q-separator color="grey q-mt-md" />
    </div>

  </div>

</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUpdated, onBeforeUpdate, nextTick } from "vue"
import { useAppStores } from "src/composables/useAppStores"
import { useDocumentHelpers } from "src/composables/useDocumentHelpers"
import { useIsMobile } from "src/composables/useIsMobile"
import type { I_ExtraFields } from "src/interfaces/I_Blueprint"
import { QEditor, extend } from "quasar"
import type { I_HasFullScreenEditMode, I_OpenedDocument } from "src/interfaces/I_OpenedDocument"
import { useQuasar } from "quasar"

import WISIWYG_insertImageChoice from "src/components/dialogs/WISIWYG_insertImageChoice.vue"
import WISIWYG_changeImagePath from "src/components/dialogs/WISIWYG_changeImagePath.vue"
import existingDocumentDialog from "src/components/dialogs/ExistingDocument.vue"

const props = defineProps<{
  inputDataBluePrint: I_ExtraFields
  editMode?: boolean
  inputDataValue?: string
  fullScreenStatus?: I_HasFullScreenEditMode
  fullScreenScrollDistance?: number
}>()

const emit = defineEmits(["signalInput", "signalFullScreenStatusChange"])

const { optionsStore, projectStore, openedDocumentsStore, allDocumentsStore } = useAppStores()
const { generateUID, openLink, findRequestedOrActiveDocument } = useDocumentHelpers()
const q = useQuasar()
const isMobile = useIsMobile()

const isDarkMode = ref(false)
const disableDocumentToolTips = ref(false)
const textShadow = ref(false)
const hideDeadCrossThrough = ref(false)
const hideAdvSearchCheatsheetButton = ref(false)
const preventPreviewsDocuments = ref(false)
const agressiveRelationshipFilter = ref(false)

const inputIcon = computed(() => props.inputDataBluePrint?.icon)
const toolTip = computed(() => props.inputDataBluePrint?.tooltip)
const isMasterOnlyField = computed(() => props.inputDataBluePrint?.masterOnly === true)
const canEditMasterOnlyField = computed(() => projectStore.currentUserRole === "master")

// Local settings
const limitEditorHeight = ref(false)

watch(() => optionsStore.getOptions, (options) => {
  isDarkMode.value = options.darkMode
  disableDocumentToolTips.value = options.disableDocumentToolTips
  textShadow.value = options.textShadow
  hideDeadCrossThrough.value = options.hideDeadCrossThrough
  hideAdvSearchCheatsheetButton.value = options.hideAdvSearchCheatsheetButton
  preventPreviewsDocuments.value = options.preventPreviewsDocuments
  agressiveRelationshipFilter.value = options.agressiveRelationshipFilter
  limitEditorHeight.value = options.limitEditorHeight
}, { immediate: true, deep: true })

// Input handling
const localInput = ref("")
const wysiwygFieldRef = ref<any>(null)

watch(() => props.inputDataValue, () => {
  localInput.value = props.inputDataValue ?? ""
}, { deep: true, immediate: true })

watch(() => props.fullScreenStatus, () => {
  nextTick(() => {
    const fullScreenFieldID = props.fullScreenStatus?.fieldID
    const localID = props.inputDataBluePrint.id

    const fullScreenValue = props.fullScreenStatus?.value
    if (fullScreenFieldID === localID) {
      const editor = wysiwygFieldRef.value as QEditor

      if (fullScreenValue) {
        // @ts-ignore
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        editor.setFullscreen()
        editor.focus()
      }
      else {
        // @ts-ignore
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        editor.exitFullscreen()
        editor.focus()
      }
    }
  })
}, { deep: true, immediate: true })

watch(() => props.editMode, () => {
  if (!props.editMode && wysiwygFieldRef.value) {
    /*eslint-disable */
    // @ts-ignore
    wysiwygFieldRef.value.exitFullscreen()
    /* eslint-enable */
  }
})

let pullTimer = null as any

function processInput () {
  clearTimeout(pullTimer)
  pullTimer = setTimeout(() => {
    signalInput()
  }, 500)
}

function signalInput () {
  emit("signalInput", localInput.value.trim())
}

function signalFullScreenStatusChange () {
  const editor = wysiwygFieldRef.value as QEditor

  // @ts-ignore
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  const fullScreenState = editor.inFullscreen

  emit("signalFullScreenStatusChange", {
    fieldID: props.inputDataBluePrint.id,
    value: !fullScreenState
  })
}

// WYSIWYG functionality
function pasteCapture (evt: any) {
  /*eslint-disable */
  if (evt.target.nodeName === "INPUT") {
    return
  }
  let text, onPasteStripFormattingIEPaste
  evt.preventDefault()
  if (evt.originalEvent && evt.originalEvent.clipboardData.getData) {
    text = evt.originalEvent.clipboardData.getData("text/plain")
    // @ts-ignore
    wysiwygFieldRef.value?.runCmd("insertText", text)
  }
  else if (evt.clipboardData && evt.clipboardData.getData) {
    text = evt.clipboardData.getData("text/plain")
    // @ts-ignore
    wysiwygFieldRef.value?.runCmd("insertText", text)
  }
  // @ts-ignore
  else if (window.clipboardData && window.clipboardData.getData) {
    if (!onPasteStripFormattingIEPaste) {
      onPasteStripFormattingIEPaste = true
      // @ts-ignore
      wysiwygFieldRef.value?.runCmd("ms-pasteTextOnly", text)
    }
    onPasteStripFormattingIEPaste = false
  }
  /* eslint-enable */
}

const existingObjectDialogTrigger = ref("")

function handleDocumentSelected (id: string) {
  /*eslint-disable */
  const editor = wysiwygFieldRef.value as any

  const doc = allDocumentsStore.getDocument(id)

  setTimeout(() => {
    editor.runCmd("insertHtml", `<a href="document:${id}">${doc.label}</a>&nbsp;`)
  }, 100)
  /* eslint-enable */
}

function existingObjectDialogClose () {
  existingObjectDialogTrigger.value = ""
}

function existingObjectAssignUID () {
  existingObjectDialogTrigger.value = generateUID()
}

function handleEditorKeypress (evt: any) {
  /*eslint-disable */
  if (evt.key === "@" && props.editMode) {
    const editor = wysiwygFieldRef.value as QEditor

    // We don't want to paste anything special in the source mode editor
    if ((editor as any).isViewingSource) {
      return
    }

    evt.preventDefault()

    setTimeout(() => {
      existingObjectAssignUID()
    }, 1)
  }
  /* eslint-enable */
}

function handleEditorClick (evt: any) {
  /*eslint-disable */
  if (evt.target.tagName.toLowerCase() === "a") {
    if (evt.ctrlKey) {
      const link = evt.target.href
      evt.stopPropagation()
      openLink(link)
    }
  }
  /* eslint-enable */
}

function insertImageLink (imageLink: string) {
  const editor = wysiwygFieldRef.value as QEditor

  editor.focus()
  editor.runCmd("insertParagraph")

  // @ts-ignore
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  editor.caret.restore()

  editor.runCmd("insertHTML", `<img src='${imageLink}'>`)

  editor.runCmd("insertParagraph")

  // @ts-ignore
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  editor.caret.restore()

  editor.focus()
}

function changeImagePath (imagePath: string, imageTarget: HTMLImageElement) {
  const editor = wysiwygFieldRef.value as QEditor

  imageTarget.src = imagePath

  editor.runCmd("insertHTML", "")
}

const currentImagePath = ref("")
const currentImageTarget = ref(null as unknown as HTMLImageElement)

function toggleEditorFullScreen () {
  const editor = wysiwygFieldRef.value as QEditor

  // @ts-ignore
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  const fullScreenState = editor.inFullscreen

  if (fullScreenState) {
    signalFullScreenStatusChange()

    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    editor.exitFullscreen()
    editor.focus()
  }
  else {
    signalFullScreenStatusChange()

    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    editor.setFullscreen()
    editor.focus()
  }
}

function handleRightClick (event: MouseEvent) {
  if (event?.target) {
    // @ts-ignore
    const target = event.target as unknown as HTMLImageElement
    const targetType: string = target.tagName

    if (targetType === "IMG") {
      currentImagePath.value = target.src
      currentImageTarget.value = target

      WISIWYG_changeImagePathAssignUID()
    }
  }
}

// Definitions must be plain object (not computed) since it references methods
const definitions = {
  toggleFullSceen: {
    tip: "Toggle fullscreen <br><br> (Ctrl + Shift + F / F11)",
    icon: "fullscreen",
    label: "Fullscreen",
    handler: toggleEditorFullScreen
  },
  insertImageLink: {
    tip: "Insert image link",
    icon: "image",
    label: "",
    handler: WISIWYG_insertImageChoiceAssignUID
  },
  quote: {
    tip: "Quote",
    key: false
  }
}

const wysiwygFonts = {
  arial: "Arial",
  arial_black: "Arial Black",
  comic_sans: "Comic Sans MS",
  courier_new: "Courier New",
  impact: "Impact",
  lucida_grande: "Lucida Grande",
  times_new_roman: "Times New Roman",
  verdana: "Verdana"
}

const desktopWysiwygOptions = [
  ["left", "center", "right", "justify"],
  ["bold", "italic", "underline", "subscript", "superscript"],
  [
    {
      label: q.lang.editor.formatting,
      icon: q.iconSet.editor.formatting,
      list: "no-icons",
      fixedIcon: true,
      options: [
        "h1",
        "h2",
        "h3",
        "h4",
        "h5",
        "h6",
        "p"
      ]
    },
    {
      label: q.lang.editor.fontSize,
      icon: q.iconSet.editor.fontSize,
      fixedIcon: true,
      list: "no-icons",
      options: [
        "size-1",
        "size-2",
        "size-3",
        "size-4",
        "size-5",
        "size-6",
        "size-7"
      ]
    },
    {
      label: q.lang.editor.defaultFont,
      icon: q.iconSet.editor.font,
      fixedIcon: true,
      list: "no-icons",
      options: [
        "default_font",
        "arial",
        "arial_black",
        "comic_sans",
        "courier_new",
        "impact",
        "lucida_grande",
        "times_new_roman",
        "verdana"
      ]
    },
    "removeFormat"
  ],
  ["hr", "link", "quote", "unordered", "ordered", "outdent", "indent"],
  ["insertImageLink"],
  ["undo", "redo"],
  ["toggleFullSceen"],
  ["viewsource"]
]

// Mobile drops alignment, fontSize, defaultFont, advanced lists, fullscreen
// and viewsource — they take a lot of toolbar space and are rarely used on a
// phone. Heading dropdown stays so users can mark sections.
const mobileWysiwygOptions = [
  ["bold", "italic", "underline"],
  [
    {
      label: q.lang.editor.formatting,
      icon: q.iconSet.editor.formatting,
      list: "no-icons",
      fixedIcon: true,
      options: ["h1", "h2", "h3", "p"]
    },
    "removeFormat"
  ],
  ["link", "unordered", "ordered"],
  ["insertImageLink"],
  ["undo", "redo"]
]

const wysiwygOptions = computed(() => isMobile.value ? mobileWysiwygOptions : desktopWysiwygOptions)

// Insert image dialog
const WISIWYG_insertImageChoiceDialogTrigger = ref("")
function WISIWYG_insertImageChoiceDialogClose () {
  WISIWYG_insertImageChoiceDialogTrigger.value = ""
}

function WISIWYG_insertImageChoiceAssignUID () {
  WISIWYG_insertImageChoiceDialogTrigger.value = generateUID()
}

// Change image path dialog
const WISIWYG_changeImagePathDialogTrigger = ref("")
function WISIWYG_changeImagePathDialogClose () {
  WISIWYG_changeImagePathDialogTrigger.value = ""
}

function WISIWYG_changeImagePathAssignUID () {
  WISIWYG_changeImagePathDialogTrigger.value = generateUID()
}

// FullScreen Scrolling support
const preventAutoScroll = ref(false)
const decounceScrollTimer = ref(false as any)

onMounted(() => {
  addEditorScrollWatcher()
  fullScreenAutoScroll()
})

onUpdated(() => {
  addEditorScrollWatcher()
})

onBeforeUpdate(() => {
  const editor = wysiwygFieldRef.value as QEditor

  if (!editor) {
    return
  }

  const editorContent = editor.$el.querySelector(".q-editor__content")

  if (!editorContent) {
    return
  }
  editorContent.removeEventListener("scroll", (e: Event) => {
    watchEditorScroll(e)
  })
})

function fullScreenAutoScroll () {
  const editor = wysiwygFieldRef.value as QEditor

  if (!editor) {
    return
  }

  const editorContent = editor.$el.querySelector(".q-editor__content")

  if (!editorContent) {
    return
  }

  const scrollTop = (props.fullScreenScrollDistance && !preventAutoScroll.value) ? props.fullScreenScrollDistance : 0

  setTimeout(() => {
    editorContent.scrollTo({ top: scrollTop, behavior: "auto" })
  }, 120)
}

function addEditorScrollWatcher () {
  const editor = wysiwygFieldRef.value as QEditor

  if (!editor) {
    return
  }

  const editorContent = editor.$el.querySelector(".q-editor__content")

  if (!editorContent) {
    return
  }

  setTimeout(() => {
    editorContent.addEventListener("scroll", (e: Event) => {
      watchEditorScroll(e)
    })
  }, 100)
}

function watchEditorScroll (event: Event) {
  if (preventAutoScroll.value || !props.editMode || !props.fullScreenStatus?.value) {
    return
  }

  if (decounceScrollTimer.value) {
    window.clearTimeout(decounceScrollTimer.value)
  }

  decounceScrollTimer.value = window.setTimeout(() => {
    const dataCopy: I_OpenedDocument = extend(true, {}, findRequestedOrActiveDocument())

    // @ts-ignore
    dataCopy.fullScreenScrollDistance = event.target.scrollTop

    const dataPass = { doc: dataCopy, treeAction: false }
    openedDocumentsStore.updateDocument(dataPass)
  }, 100)
}
</script>

<style lang="scss">
.fieldWysiwyg {
  padding-top: 15px;
  padding-bottom: 15px;
}
</style>
