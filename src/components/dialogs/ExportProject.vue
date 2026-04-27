<template>

  <q-dialog
    v-model="dialogModel"
    @before-hide="triggerDialogClose"
    :persistent="exportOngoing || editingDocumentTemplates"
    >
    <q-card
      v-if="!exportOngoing && !editingDocumentTemplates"
      class="exportDialog"
      dark
    >
      <q-card-section class="row justify-center text-center">
        <h6 class="text-center q-my-sm">Export project/documents</h6>
      </q-card-section>

      <q-card-section>
        <div class="row justify-center">
          <div class="col-4">
            <div class="q-mx-lg">

              <div class="row">
                <div class="col">
                  <q-select
                    class="exportTypeSelect q-mb-md"
                    dark
                    popup-content-class="menuResizer"
                    :options="exportFormats"
                    label="Export file format"
                    filled
                    input-debounce="0"
                    v-model="selectedExportFormat"
                  />
                </div>
                <div class="col-auto self-center q-ml-sm" v-if="selectedExportFormat === 'Adobe Reader - PDF'">
                   <q-icon name="mdi-alert-circle" size="20px">
                      <q-tooltip :delay="500">
                        Please note that the PDF export doesn't play nice with:
                        <ul>
                          <li>
                            Images - It will export them, but each has to places on a new page due to limitations of the PDF-creator software.
                          </li>
                          <li>
                            Underlined text if different parts of the same paragraph have increased/decreased font sizes.
                          </li>
                          <li>
                            Underlines in headings.
                          </li>
                          <li>
                            Currently custom fonts and nestes lists are not supported.
                          </li>
                        </ul>
                      </q-tooltip>
                    </q-icon>
                </div>
              </div>

              <q-list class="exportSettings">

                <q-item>
                  <q-item-section side>
                    <q-icon name="mdi-help-circle" size="18px">
                      <q-tooltip :delay="500">
                        Determines if the export should append a unique text string
                        <br>
                        at the end of the output files to prevent overriding
                        <br>
                        of the file content if multiple documents with the same name exist.
                      </q-tooltip>
                    </q-icon>
                  </q-item-section>
                  <q-item-section>
                    <q-checkbox
                      dark
                      :class="{'highlight': useCompatibilityMode}"
                      color="primary"
                      v-model="useCompatibilityMode"
                      label="Use unique-indentifier export-mode?"
                    />
                  </q-item-section>
                </q-item>

                <q-item>
                  <q-item-section side>
                    <q-icon name="mdi-help-circle" size="18px">
                      <q-tooltip :delay="500">
                        Determines if the export should use
                        <br>
                        the individual document templates set
                        <br>
                        inside of each document currently being exported.
                        <br>
                        In case this is off no such template will get used.
                      </q-tooltip>
                    </q-icon>
                  </q-item-section>
                  <q-item-section>
                    <q-checkbox
                      dark
                      v-model="useLocalDocumentTemplates"
                      label="Use documents' local templates?"
                    />
                  </q-item-section>
                </q-item>

                <q-item>
                  <q-item-section side>
                    <q-icon name="mdi-help-circle" size="18px">
                      <q-tooltip :delay="500">
                        Determines if the export should output a corresponding
                        <br>
                        folder structure to how FA structures the document types.
                        <br>
                        If this is ticked on, only the file/s will be exported
                        <br>
                        with no folders included.
                      </q-tooltip>
                    </q-icon>
                  </q-item-section>
                  <q-item-section>
                    <q-checkbox
                      dark
                      :class="{'highlight': noFolderMode}"
                      color="primary"
                      v-model="noFolderMode"
                      label="No-folder export?"
                    />
                  </q-item-section>
                </q-item>

                <q-item>
                  <q-item-section side>
                    <q-icon name="mdi-help-circle" size="18px">
                      <q-tooltip :delay="500">
                        Determines if the spoiler fields
                        <br>
                        should be included in the export.
                      </q-tooltip>
                    </q-icon>
                  </q-item-section>
                  <q-item-section>
                    <q-checkbox
                      dark
                      :class="{'warning': includeSpoilers}"
                      color="primary"
                      v-model="includeSpoilers"
                      label="Include spoilers?"
                    />
                  </q-item-section>
                </q-item>

                <q-item>
                  <q-item-section side>
                    <q-icon name="mdi-help-circle" size="18px">
                      <q-tooltip :delay="500">
                        Automatically exports all documents in your project.
                      </q-tooltip>
                    </q-icon>
                  </q-item-section>
                  <q-item-section>
                    <q-checkbox
                      :class="{'warning': noFolderMode && exportWholeProject}"
                      dark color="primary"
                      v-model="exportWholeProject"
                      label="Export whole project?"
                    />
                  </q-item-section>
                </q-item>

                <q-item v-if="selectedExportFormat === 'Adobe Reader - PDF'">
                  <q-item-section side>
                    <q-icon name="mdi-help-circle" size="18px">
                      <q-tooltip :delay="500">
                        If the exported document doesn't show some characters properly.
                        <br>
                        Try turning this on and exporting again.
                      </q-tooltip>
                    </q-icon>
                  </q-item-section>
                  <q-item-section>
                    <q-checkbox
                      dark color="primary"
                      v-model="useFallbackFont"
                      label="Use high-compatibility font?"
                    />
                  </q-item-section>
                </q-item>

                <q-item>
                  <q-item-section side>
                    <q-icon name="mdi-help-circle" size="18px">
                      <q-tooltip :delay="500">
                      This setting exports ONLY the main document name.
                      <br>
                      And text editors with content.
                      </q-tooltip>
                    </q-icon>
                  </q-item-section>
                  <q-item-section>
                  <q-checkbox
                    dark color="primary"
                    v-model="writerMode"
                    label="Use writer mode?"
                    />
                  </q-item-section>
                </q-item>

                <q-item v-if='writerMode'>
                  <q-item-section side>
                    <q-icon name="mdi-help-circle" size="18px">
                      <q-tooltip :delay="500">
                        Determines if the text editors should have their respective titles or not.
                      </q-tooltip>
                    </q-icon>
                  </q-item-section>
                  <q-item-section>
                    <q-checkbox
                      dark color="primary"
                      v-model="writerModeTitles"
                      label="Include text editor field titles?"
                      />
                  </q-item-section>
                </q-item>

                <q-item v-if='!writerMode'>
                  <q-item-section side>
                    <q-icon name="mdi-help-circle" size="18px">
                      <q-tooltip :delay="500">
                      Determines if tags will be included in the export or not.
                      </q-tooltip>
                    </q-icon>
                  </q-item-section>
                  <q-item-section>
                    <q-checkbox
                      dark color="primary"
                      v-model="includeTags"
                      label="Include tags in the export?"
                      />
                  </q-item-section>
                </q-item>

                <q-item v-if='!writerMode'>
                  <q-item-section side>
                    <q-icon name="mdi-help-circle" size="18px">
                      <q-tooltip :delay="500">
                        Determines if hierarchical path will be included in the export or not.
                      </q-tooltip>
                    </q-icon>
                  </q-item-section>
                  <q-item-section>
                    <q-checkbox
                      dark color="primary"
                      v-model="includeHierarchyPath"
                      label="Include hierarchical path in the export?"
                      />
                  </q-item-section>
                </q-item>

                <q-item v-if='!writerMode'>
                  <q-item-section side>
                    <q-icon name="mdi-help-circle" size="18px">
                      <q-tooltip :delay="500">
                        Determines if documents with status "Dead/Gone/Destroyed"
                        <br>
                        will be included in the export or not.
                      </q-tooltip>
                    </q-icon>
                  </q-item-section>
                  <q-item-section>
                    <q-checkbox
                      dark color="primary"
                      v-model="includeIsDead"
                      label="Include dead/gone/destroyed documents in the export?"
                      />
                  </q-item-section>
                </q-item>

                <q-item v-if='!writerMode && includeIsDead'>
                  <q-item-section side>
                    <q-icon name="mdi-help-circle" size="18px">
                      <q-tooltip :delay="500">
                        Determines if the status "Dead/Gone/Destroyed"
                        <br>
                        should be excluded from the exported documents.
                      </q-tooltip>
                    </q-icon>
                  </q-item-section>
                  <q-item-section>
                    <q-checkbox
                      dark color="primary"
                      v-model="hideDeadInformation"
                      label="Hide dead/gone/destroyed status in the exported documents?"
                    />
                  </q-item-section>
                </q-item>

              </q-list>

            </div>
          </div>

          <div class="col-8">
            <div
             style="height: 100%;"
             class="q-mx-lg"
             >

             <div class="row">

                <div class="col q-mb-lg">
                  <q-select
                    dark
                    filled
                    class="flex-grow"
                    :options="documentTemplateList"
                    use-input
                    v-model="selectedDocumentTemplate"
                    menu-anchor="bottom middle"
                    menu-self="top middle"
                    label="Selected template"
                    option-value="id"
                    clearable
                  >
                  <template v-slot:selected-item="scope">
                    {{scope.opt.name}}
                  </template>
                  <template v-slot:option="{ itemProps, itemEvents, opt }">
                    <q-item
                      v-bind="itemProps"
                      v-on="itemEvents"
                      :key="opt.id"
                    >
                      <q-item-section>
                        <q-item-label>
                          {{opt.name}}
                        </q-item-label>
                      </q-item-section>
                    </q-item>
                  </template>

                  </q-select>
                </div>

                <div
                  v-if="selectedDocumentTemplate"
                  class="col-auto flex items-center q-ml-md q-mb-lg"
                >
                  <q-btn round dense flat icon="mdi-pencil" @click.stop.prevent="editExistingDocumentTemplate">
                    <q-tooltip :delay="500">
                      Edit this template
                    </q-tooltip>
                  </q-btn>
                </div>

                <div class="col-auto flex items-center q-ml-md q-mb-lg">
                  <q-btn round dense flat icon="mdi-plus" @click.stop.prevent="setupNewDocumentTemplate">
                    <q-tooltip :delay="500">
                      Add a new template
                    </q-tooltip>
                  </q-btn>
                </div>

              </div>

              <div
                style="height: calc(100% - 75px); line-height: 2;"
                class="column justify-center items-center text-center"
                v-if="exportWholeProject"
              >

                <span class="text-bold text-secondary" v-if="noFolderMode && exportWholeProject">
                  <br>
                  ALL of your documents will dumped RIGHT where you export. NO folder will be generated!
                  <br>
                </span>

                <span class="text-bold text-secondary" v-if="!useCompatibilityMode && exportWholeProject">
                  <br>
                  Please condider turning the unique-indentifier mode ON before exporting to avoid data loss!
                </span>

                <span>
                  <br>
                  FA currently needs to generate individual files for <span class="text-bold text-primary">{{allDocumentsStore.getAllDocuments.docs.length}} </span> documents.
                </span>
                <span>
                  Estimated export time: <span class="text-bold text-primary">{{(allDocumentsStore.getAllDocuments.docs.length / 25 + 2).toFixed(1)}} - {{(allDocumentsStore.getAllDocuments.docs.length / 15 + 2).toFixed(1)}} </span> seconds.
                </span>
              </div>
              <q-select
                ref="ref_exportDocument"
                class="exportDocumentSelect"
                dark
                popup-content-class="menuResizer"
                v-if="!exportWholeProject"
                menu-anchor="bottom middle"
                menu-self="top middle"
                :options="filteredExistingInput"
                use-input
                multiple
                use-chips
                filled
                label="Selected documents"
                input-debounce="500"
                v-model="exportDocumentsModel"
                @filter="filterExistingSelect"
              >
                <template v-slot:append v-if="!hideAdvSearchCheatsheetButton">
                  <q-btn round dense flat icon="mdi-help-rhombus" @click.stop.prevent="floatingWindowsStore.setAdvSearchWindowVisible"
                  >
                    <q-tooltip :delay="500">
                      Open search cheatsheet
                    </q-tooltip>
                  </q-btn>
                </template>
                <template v-slot:option="{ itemProps, itemEvents, opt }">
                    <q-item
                      :class="{'hasTextShadow': textShadow, 'isMinor':opt.isMinor}"
                      v-bind="itemProps"
                      v-on="itemEvents"
                      :key="opt.id"
                      :style="`color: ${opt.color}; background-color: ${opt.bgColor}`"
                      @mouseleave="setDocumentPreviewClose"
                    >
                    <documentPreview
                      :document-id="opt._id"
                      :external-close-trigger="documentPreviewClose"
                      :special-z-index="999999999"
                      :custom-anchor="'top end'"
                      :custom-self="'center left'"
                      :custom-delay="1200"
                    />
                      <q-item-section avatar>
                        <q-icon
                          :style="`color: ${retrieveIconColor(opt)}`"
                          :name="(opt.isCategory) ? 'fas fa-folder-open' : opt.icon"
                          />
                      </q-item-section>
                      <q-item-section>
                        <q-item-label>
                          <span class="isDeadIndicator" v-if="opt.isDead">
                            †
                          </span>
                          <span :class="{'isDead': (opt.isDead && !hideDeadCrossThrough)}" v-html="opt.label">
                          </span>
                        </q-item-label>
                        <q-item-label caption class="text-cultured" v-html="opt.hierarchicalPath"></q-item-label>
                        <q-item-label caption class="text-cultured" v-if="opt.tags">
                          <q-chip
                          v-for="(input,index) in opt.tags" :key="index"
                          outline
                          style="opacity: 0.8;"
                          size="12px"
                          class="text-cultured"
                          v-html="`${input}`"
                          >
                          </q-chip>
                        </q-item-label>
                      </q-item-section>
                    </q-item>
                </template>
                <template v-slot:selected-item="scope">
                  <q-chip
                    removable
                    dense
                    @remove="removeInput(scope)"
                    :tabindex="scope.tabindex"
                    :color="(scope.opt.isAutoGenerated) ? 'teal-3' : 'accent'"
                    text-color="dark"
                    class="text-bold"
                  >

                    <div
                      class="relationShipChipOverlay"
                      @mouseleave="setDocumentPreviewClose"
                    />

                    <div class="relationShipChipContent">
                      <template v-if="scope.opt.isDead">
                        †
                      </template>
                      {{ stripTags(scope.opt.label) }}
                    </div>
                    <documentPreview
                      :special-z-index="999999999"
                      :custom-delay="1200"
                      :document-id="scope.opt._id"
                      :external-close-trigger="documentPreviewClose"
                    />

                  </q-chip>
                </template>
              </q-select>
            </div>
          </div>
        </div>

      </q-card-section>

      <q-card-actions align="right" class="q-mb-lg q-mr-xl">
        <q-btn flat label="Cancel" color="accent" v-close-popup class="q-mr-lg" />
          <q-btn
          :flat="!exportWholeProject && exportDocumentsModel.length === 0"
          :outline="exportWholeProject || exportDocumentsModel.length > 0"
          label="Export"
          color="primary"
          :disable="!exportWholeProject && exportDocumentsModel.length === 0"
          @click="exportDocuments"
          />
      </q-card-actions>
    </q-card>

    <q-card v-if="editingDocumentTemplates" dark class="exportTemplates">
      <div style="width: 100%;">
        <q-input
          class="exportTemplateNameInput"
          filled
          dark
          :bottom-slots="false"
          hide-bottom-space
          style="width: 100%;"
          :label="(editedDocumentTemplate.name.length === 0) ? 'Enter template name' : 'Export template name'"
          v-model="editedDocumentTemplate.name"
          :error="editedDocumentTemplate.name.length === 0"
        />
      </div>

      <div class="exportTemplatesInner">
      <q-card-section horizontal class="exportTemplatesTabList">
        <q-tabs
          v-model="activeDocumentTemplateTab"
          class="text-accent"
          active-color="primary"
          indicator-color="primary"
          vertical
          style="width: 100%;"
          :class="{'hasTextShadow': textShadow}"
          align="left"
          inline-label
          dense
          no-caps
        >
          <q-tab
            class="exportTemplatesTab"
            v-for="(blueprint,index) in blueprintsStore.getAllBlueprints"
            :key="blueprint._id"
            :icon="blueprint.icon"
            :name="blueprint._id"
            :label="`${blueprint.namePlural} - ${selecteddocumentTemplateTableData[index].fields.length}/${documentTemplateTableData[index].fields.length}`"
          />

        </q-tabs>
      </q-card-section>
      <q-separator vertical dark />

      <q-card-section horizontal class="exportTemplatesTabContent">
        <q-tab-panels
          dark
          v-model="activeDocumentTemplateTab"
          animated
          style="width: 100%;"
          vertical
          transition-prev="jump-up"
          transition-next="jump-down"
         >
          <q-tab-panel
            v-for="(blueprint,index) in blueprintsStore.getAllBlueprints"
            :key="blueprint._id"
            :name="blueprint._id"
            dark
            >

            <q-table
              :title="blueprint.namePlural"
              :data="documentTemplateTableData[index].fields"
              :columns="documentTemplateDataColumns"
              virtual-scroll
              :rows-per-page-options="[0]"
              :virtual-scroll-sticky-size-start="48"
              row-key="id"
              selection="multiple"
              :selected.sync="selecteddocumentTemplateTableData[index].fields"
              dark
              flat
              dense
              hide-bottom
              @selection="reactToRowUpdate"
            />
          </q-tab-panel
          >
        </q-tab-panels>
      </q-card-section>

      </div>

      <q-card-actions align="right" class="q-mb-lg q-mt-md q-mx-xl controlButtons">
         <q-btn
          outline
          label="Delete template"
          color="secondary"
          class="q-mr-auto deleteTemplateButton"
          v-if="!adddingNewTemplate"
          @click="deleteDocumentTemplate"
        />
        <q-btn
          flat
          label="Cancel editing"
          color="accent"
          class="q-mr-lg"
          @click="editingDocumentTemplates = false"
        />
        <q-btn
          outline
          :disable="editedDocumentTemplate.name.length === 0"
          label="Save template"
          color="primary"
          @click="saveDocumentTemplate"
        />
      </q-card-actions>

    </q-card>

    <q-card v-if="exportOngoing" dark class="exportDialog">
        <q-card-section class="row justify-center">
        <h6 class="text-center q-my-sm">Exporting...</h6>
      </q-card-section>

      <q-card-section class="row justify-center q-mx-xl">
        <div>
          Current document: {{currentDocName}}
        </div>
      </q-card-section>

      <q-card-section class="row justify-center q-mx-xl q-mb-lg">
          <q-linear-progress stripe round dark size="20px" :value="progressCounter" color="primary" class="q-mt-sm">
            <div class="absolute-full flex flex-center">
              <q-badge text-color="accent" color="dark" :label="`${exportedDocuments}/${exportList.length}`" />
            </div>
          </q-linear-progress>
      </q-card-section>
    </q-card>
  </q-dialog>

</template>

<script setup lang="ts">

interface I_ShotrenedExtraField{
  order: number
  name: string
  type: string
  id: string
}

import { ref, computed, watch, nextTick, defineAsyncComponent } from "vue"
// @ts-ignore
import json2md from "json2md/lib/index.js"
// @ts-ignore
import PDFkit from "pdfkit/js/pdfkit.standalone.js"
// @ts-ignore
import htmlParseStringify from "html-parse-stringify/dist/html-parse-stringify.modern.js"
import { uid, extend, useQuasar } from "quasar"
import JSZip from "jszip"
import { saveAs } from "file-saver"

import type { I_ExportObject } from "src/interfaces/I_ExportObject"
import type { I_ShortenedDocument } from "src/interfaces/I_OpenedDocument"
import type { I_Blueprint } from "src/interfaces/I_Blueprint"
import type { I_DocumentTemplate } from "src/interfaces/I_DocumentTemplate"
import type { I_PDFKitDocument } from "src/interfaces/I_PDFKitDocument"
import type { I_HtmlParserNode } from "src/interfaces/I_HtmlParserNode"
import { advancedDocumentFilter } from "src/scripts/utilities/advancedDocumentFilter"
import { saveDocumentTemplateIntoDB, retrieveAllDocumentTemplatesFromDB, removeDocumentTemplateFromDB } from "src/scripts/projectManagement/documentTemplates"

import { useAppStores } from "src/composables/useAppStores"
import { useDocumentHelpers } from "src/composables/useDocumentHelpers"

const documentPreview = defineAsyncComponent(() => import("src/components/DocumentPreview.vue"))

const props = defineProps<{
  dialogTrigger?: string
  prepickedIds?: string[]
  prepickedNoFolderMode?: boolean
}>()

const emit = defineEmits(["triggerDialogClose", "triggerDialogSubmit"])

const q = useQuasar()
const { dialogsStore, blueprintsStore, allDocumentsStore, optionsStore, floatingWindowsStore, projectStore } = useAppStores()
const { stripTags, retrieveIconColor, sleep, getDocumentHieararchicalPath } = useDocumentHelpers()

const dialogModel = ref(false)
const thumbStyle = { right: "-40px", borderRadius: "5px", backgroundColor: "#61a2bd", width: "5px", opacity: 1 }
const thumbStyleTabs = { right: "0px", borderRadius: "5px", backgroundColor: "#61a2bd", width: "5px", opacity: 1 }
const thumbStyleTutorialTabContent = { right: "-55px", borderRadius: "5px", backgroundColor: "#61a2bd", width: "5px", opacity: 1 }

watch(() => dialogsStore.getDialogsState, (val) => { if (!val) dialogModel.value = false })

watch(() => props.dialogTrigger, async (val) => {
  if (val) {
    if (dialogsStore.getDialogsState) return
    dialogsStore.setDialogState(true)
    dialogModel.value = true

    documentTemplateList.value = await retrieveAllDocumentTemplatesFromDB()

    resetLocalData()
    reloadOptions()
    populateExportObjectDialog()

    if ((props.prepickedIds ?? []).length > 0) {
      exportDocumentsModel.value = allDocumentsStore.getAllDocuments.docs.filter(doc => {
        return (props.prepickedIds ?? []).includes(doc._id)
      })
    }

    noFolderMode.value = props.prepickedNoFolderMode ?? false
  }
})

function triggerDialogClose () { dialogsStore.setDialogState(false); emit("triggerDialogClose", true) }
function triggerDialogSubmit (val: string) { emit("triggerDialogSubmit", val) }

function resetLocalData () {
  selectedExportFormat.value = "Adobe Reader - PDF"
  exportWholeProject.value = false
  useCompatibilityMode.value = true
  includeSpoilers.value = false
  includeTags.value = false
  includeHierarchyPath.value = false
  hideDeadInformation.value = false
  includeIsDead.value = true
  writerMode.value = false
  writerModeTitles.value = false
  useFallbackFont.value = false
  exportDocumentsModel.value = []
  exportOngoing.value = false
  exportList.value = []
  selectedDocumentTemplate.value = null as unknown as I_DocumentTemplate
}

const exportFormats = [
  "Adobe Reader - PDF",
  "Markdown - MD"
]

const selectedExportFormat = ref("Adobe Reader - PDF")
const useCompatibilityMode = ref(true)
const exportWholeProject = ref(false)
const writerMode = ref(false)
const writerModeTitles = ref(false)
const includeTags = ref(false)
const includeHierarchyPath = ref(false)
const hideDeadInformation = ref(false)
const includeIsDead = ref(true)
const includeSpoilers = ref(false)
const useFallbackFont = ref(false)
const noFolderMode = ref(false)
const useLocalDocumentTemplates = ref(true)

const documentPreviewClose = ref("")

function setDocumentPreviewClose () {
  documentPreviewClose.value = uid()
}

const hideAdvSearchCheatsheetButton = ref(false)
const hideDeadCrossThrough = ref(false)
const textShadow = ref(false)

function reloadOptions () {
  textShadow.value = optionsStore.getOptions.textShadow
  hideDeadCrossThrough.value = optionsStore.getOptions.hideDeadCrossThrough
  hideAdvSearchCheatsheetButton.value = optionsStore.getOptions.hideAdvSearchCheatsheetButton
}

const exportDocumentsModel = ref<any[]>([])
const existingObjectsFullList = ref([] as I_ShortenedDocument[])
const allDocumentBluePrints = ref([] as I_Blueprint[])
const filteredExistingInput = ref(null as unknown as I_ShortenedDocument[])
const listCopy = ref<I_ShortenedDocument[]>([])
const documentTemplateList = ref<I_DocumentTemplate[]>([])
const selectedDocumentTemplate = ref(null as unknown as I_DocumentTemplate)
const editingDocumentTemplates = ref(false)
const editedDocumentTemplate = ref({
  id: "",
  name: "",
  documentTypeList: []
} as I_DocumentTemplate)
const activeDocumentTemplateTab = ref("")
const adddingNewTemplate = ref(false)

function setupNewDocumentTemplate () {
  adddingNewTemplate.value = true
  editedDocumentTemplate.value.id = uid()
  editedDocumentTemplate.value.name = ""
  activeDocumentTemplateTab.value = blueprintsStore.getAllBlueprints[0]._id

  editedDocumentTemplate.value.documentTypeList = blueprintsStore.getAllBlueprints.map(blueprint => {
    return {
      documentTypeID: blueprint._id,
      excludedFieldIDList: []
    }
  })
  mapDocumentFieldTableData()
  editingDocumentTemplates.value = true
}

function editExistingDocumentTemplate () {
  adddingNewTemplate.value = false
  editedDocumentTemplate.value.id = selectedDocumentTemplate.value.id
  editedDocumentTemplate.value.name = selectedDocumentTemplate.value.name
  activeDocumentTemplateTab.value = blueprintsStore.getAllBlueprints[0]._id

  editedDocumentTemplate.value.documentTypeList = selectedDocumentTemplate.value.documentTypeList
  mapDocumentFieldTableData()
  editingDocumentTemplates.value = true
}

const documentTemplateTableData = ref<{
  timestamp: string
  blueprintID: string
  fields: I_ShotrenedExtraField[]
}[]>([])

const selecteddocumentTemplateTableData = ref<{
  timestamp: string
  blueprintID: string
  fields: I_ShotrenedExtraField[]
}[]>([])

function mapDocumentFieldTableData () {
  for (let index = 0; index < blueprintsStore.getAllBlueprints.length; index++) {
    const blueprint = blueprintsStore.getAllBlueprints[index]

    documentTemplateTableData.value[index] = {
      timestamp: uid(),
      blueprintID: blueprint._id,
      fields: []
    }
    selecteddocumentTemplateTableData.value[index] = {
      timestamp: uid(),
      blueprintID: blueprint._id,
      fields: []
    }

    let counter = 1

    for (let index2 = 0; index2 < blueprint.extraFields.length; index2++) {
      const field = blueprint.extraFields[index2]

      const remappedField: I_ShotrenedExtraField = {
        order: counter,
        name: field.name,
        type: field.type,
        id: field.id
      }
      if (
        !field.isLegacy &&
        field.type !== "tags" &&
        field.type !== "switch" &&
        field.id !== "name" &&
        field.id !== "order" &&
        field.id !== "deadSwitch" &&
        field.id !== "categorySwitch" &&
        field.id !== "parentDoc" &&
        field.id !== "documentColor" &&
        field.id !== "documentBackgroundColor" &&
        field.id !== "breakDocumentSettings" &&
        field.id !== "docTemplate"
      ) {
        documentTemplateTableData.value[index].fields.push(remappedField)

        const matchedExludedList = editedDocumentTemplate.value.documentTypeList.find(list => list.documentTypeID === blueprint._id)?.excludedFieldIDList

        if (!matchedExludedList || !matchedExludedList.includes(remappedField.id)) {
          selecteddocumentTemplateTableData.value[index].fields.push(remappedField)
        }
        counter++
      }
    }
  }
}

function reactToRowUpdate () {
  selecteddocumentTemplateTableData.value = selecteddocumentTemplateTableData.value.map(single => {
    single.timestamp = uid()
    return single
  })
}

async function saveDocumentTemplate () {
  const newDocumentTemplate: I_DocumentTemplate = extend(true, [], editedDocumentTemplate.value)
  newDocumentTemplate.documentTypeList = newDocumentTemplate.documentTypeList.map(docType => {
    const matchedBlueprint = blueprintsStore.getBlueprint(docType.documentTypeID)
    const matchedTableRow = documentTemplateTableData.value.find(row => row.blueprintID === matchedBlueprint._id)
    const matchedSelectTableRow = selecteddocumentTemplateTableData.value.find(row => row.blueprintID === matchedBlueprint._id)

    if (matchedTableRow && matchedSelectTableRow) {
      const excludedFieldIDList = matchedTableRow.fields
        .filter(field =>
          !matchedSelectTableRow.fields.find(selField => selField.id === field.id)
        )
        .map(field => field.id)
      return {
        documentTypeID: matchedBlueprint._id,
        excludedFieldIDList: excludedFieldIDList
      }
    }
    else {
      return {
        documentTypeID: matchedBlueprint._id,
        excludedFieldIDList: []
      }
    }
  })

  await saveDocumentTemplateIntoDB(newDocumentTemplate)
  documentTemplateList.value = await retrieveAllDocumentTemplatesFromDB()
  editingDocumentTemplates.value = false
  q.notify({
    group: false,
    type: "positive",
    message: "Template succesfully saved"
  })

  await nextTick()

  selectedDocumentTemplate.value = documentTemplateList.value.find(t => t.id === newDocumentTemplate.id) as I_DocumentTemplate
}

async function deleteDocumentTemplate () {
  const newDocumentTemplate: I_DocumentTemplate = extend(true, [], editedDocumentTemplate.value)

  await removeDocumentTemplateFromDB(newDocumentTemplate)

  documentTemplateList.value = await retrieveAllDocumentTemplatesFromDB()
  editingDocumentTemplates.value = false
  q.notify({
    group: false,
    type: "positive",
    message: "Template succesfully deleted"
  })

  await nextTick()
  selectedDocumentTemplate.value = null as unknown as I_DocumentTemplate
}

function mapFields (fieldType: string) {
  switch (fieldType) {
    case "text": return "Text"
    case "number": return "Number"
    case "colorPicker": return "Color picker"
    case "switch": return "On/Off switch"
    case "list": return "List"
    case "wysiwyg": return "Text editor"
    case "singleSelect": return "Single select"
    case "multiSelect": return "Multi select"
    case "singleToNoneRelationship": return "Single-to-None relationship"
    case "manyToNoneRelationship": return "Many-to-None relationship"
    case "singleToSingleRelationship": return "Single-to-Single relationship"
    case "singleToManyRelationship": return "Single-to-Many relationship"
    case "manyToSingleRelationship": return "Many-to-Single relationship"
    case "manyToManyRelationship": return "Many-to-Many relationship"
    case "break": return "Subtitle"
    case "tags": return "Tags"
  }
}

const documentTemplateDataColumns = [
  {
    name: "order",
    required: true,
    label: "Order",
    align: "left",
    field: (row: I_ShotrenedExtraField) => row.order,
    sortable: true
  },
  {
    name: "name",
    required: true,
    label: "Field name",
    align: "left",
    field: (row: I_ShotrenedExtraField) => row.name,
    sortable: true
  },
  {
    name: "type",
    align: "left",
    label: "Type",
    field: (row: I_ShotrenedExtraField) => mapFields(row.type),
    sortable: true
  }
]

const ref_exportDocument = ref<any>(null)

async function refocusSelect () {
  await nextTick()
  ref_exportDocument.value?.setOptionIndex(-1)
  ref_exportDocument.value?.moveOptionSelection(1, true)
}

function filterExistingSelect (val: string, update: (e: () => void) => void) {
  if (val === "") {
    update(() => {
      filteredExistingInput.value = existingObjectsFullList.value.filter((obj) => !obj.isMinor)
      if (ref_exportDocument.value && filteredExistingInput.value.length > 0) {
        refocusSelect().catch(e => console.log(e))
      }
    })
    return
  }

  update(() => {
    const needle = val.toLowerCase()
    listCopy.value = extend(true, [], existingObjectsFullList.value)
    filteredExistingInput.value = advancedDocumentFilter(needle, listCopy.value, allDocumentBluePrints.value, existingObjectsFullList.value)

    if (ref_exportDocument.value && filteredExistingInput.value.length > 0) {
      refocusSelect().catch(e => console.log(e))
    }
  })
}

function populateExportObjectDialog () {
  allDocumentBluePrints.value = blueprintsStore.getAllBlueprints
  existingObjectsFullList.value = allDocumentsStore.getAllDocuments.docs
}

async function removeInput (scope: {
  index: number
  removeAtIndex: (index: number) => void
}) {
  scope.removeAtIndex(scope.index)

  await nextTick()
  ref_exportDocument.value?.hidePopup()
}

const exportOngoing = ref(false)
const exportList = ref<I_ShortenedDocument[]>([])
const exportedDocuments = ref(0)
const currentDocName = ref("")

const progressCounter = computed(() => {
  return (exportedDocuments.value / exportList.value.length)
})

// ── Export path helpers ──────────────────────────────────────────────────────

const reservedExportChars = ["/", ">", "<", "|", ":", "&", "\\", "-", "[", "]", "{", "}", "*", "?", "'", "\"", "#", "%", "$", "!", "@"]

function fixExportName (name: string): string {
  let result = name
  reservedExportChars.forEach(c => {
    // Replace multiple times to catch repeated occurrences (original logic)
    for (let i = 0; i < 6; i++) result = result.replace(c, "-")
  })
  return result
}

function getExportPaths (input: I_ExportObject): { dir: string, filename: string, suffix: string } {
  const dir = noFolderMode.value ? "" : fixExportName(input.documentDirectory) + "/"
  let filename = fixExportName(input.name)
  if (input.isCategory) filename = "_" + filename
  const suffix = useCompatibilityMode.value ? `-${input.id}` : ""
  return { dir, filename, suffix }
}

// ── Fonts helper ─────────────────────────────────────────────────────────────

async function fetchFonts (fallback: boolean): Promise<{ normal: ArrayBuffer, bold: ArrayBuffer }> {
  const [normal, bold] = await Promise.all([
    fetch(fallback ? "/fonts/ArialUnicodeMS.ttf" : "/fonts/Roboto-Regular.ttf").then(r => r.arrayBuffer()),
    fetch(fallback ? "/fonts/ArialUnicodeMS-Bold.ttf" : "/fonts/Roboto-Bold.ttf").then(r => r.arrayBuffer())
  ])
  return { normal, bold }
}

// ── MD content builder ───────────────────────────────────────────────────────

function buildMdContent (input: I_ExportObject): string {
  const JSONExport: any[] = []

  JSONExport.push({ h1: input.name })
  if (input.isCategory) {
    JSONExport[0] = `${JSONExport[0] as string} - Category`
  }

  if (!writerMode.value) {
    JSONExport.push({ h2: "Document type" })
    JSONExport.push({ ul: [input.documentType] })

    if (!hideDeadInformation.value) {
      JSONExport.push({ h2: "Status" })
      JSONExport.push({ ul: [(input.isDead) ? "Dead/Gone/Destroyed" : "Active/Alive"] })
    }

    if (includeHierarchyPath.value) {
      JSONExport.push({ h2: "Hierarchical path" })
      JSONExport.push({ ul: [input.hierarchicalPath] })
    }

    if (includeTags.value) {
      JSONExport.push({ h2: "Tags" })
      JSONExport.push({ ul: (Array.isArray(input.tags) ? input.tags : []) })
    }
  }

  input.fieldValues.forEach(field => {
    if (field.type === "break" && !writerMode.value) {
      JSONExport.push({ hr: "" })
      JSONExport.push({ h1: field.label })
    } else if (field.type === "wysiwyg") {
      if (!writerMode.value || writerModeTitles.value) JSONExport.push({ h2: field.label })

      let localValue = field.value as unknown as string

      const replacements: [RegExp, string][] = [
        [/\*/g, "\\*"],
        [/#/g, "\\#"],
        [/\(/g, "\\("],
        [/\)/g, "\\)"],
        [/\[/g, "\\["],
        [/\]/g, "\\]"],
        [/_/g, "\\_"]
      ]
      replacements.forEach(([from, to]) => { localValue = localValue.replace(from, to) })
      JSONExport.push({ p: localValue })
    } else if (!writerMode.value) {
      JSONExport.push({ h2: field.label })
      if (Array.isArray(field.value)) JSONExport.push({ ul: field.value })
      else JSONExport.push({ ul: [field.value] })
    }
  })

  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  let mdContent: string = json2md(JSONExport)
  const EOL = mdContent.match(/\r\n/gm) ? "\r\n" : "\n"
  mdContent = mdContent.replace(new RegExp("(" + EOL + "){3,}", "gm"), EOL + EOL)
  return mdContent
}

// ── PDF wysiwyg content builder ──────────────────────────────────────────────

function buildPDFWysiwygContent (input: string): I_HtmlParserNode[] {
  const blockTagList = ["div", "h1", "h2", "h3", "h4", "h5", "h6", "li", "blockquote", "img"]
  const headingsList = ["h1", "h2", "h3", "h4", "h5", "h6"]
  const returnNodeList: I_HtmlParserNode[] = []

  const processNodeStyles = (styleString: string) => {
    const alignMatch = styleString.match(/text-align:\s*([^;}]*)/)
    return alignMatch ? alignMatch[1] : false
  }

  const processHeadingFontSize = (heading: string): number => {
    switch (heading) {
      case "h1": return 24
      case "h2": return 20
      case "h3": return 18
      case "h4": return 16
      case "h5": return 14
      case "h6": return 12
      default: return 11
    }
  }

  const processNodeFontSize = (fontString: string): number => {
    const fontNumber = parseInt(fontString)
    switch (fontNumber) {
      case 1: return 7
      case 2: return 9
      case 3: return 11
      case 4: return 13
      case 5: return 16
      case 6: return 19
      case 7: return 23
      default: return 11
    }
  }

  const processNode = (node: I_HtmlParserNode) => {
    let nodeStyles: false | string = false
    if (node?.attrs?.style) {
      const snapshot: { style: string } = extend(true, {}, node.attrs)
      nodeStyles = processNodeStyles(snapshot.style) ? snapshot.style : false
    }

    let nodeFontSize: false | string = false
    if (node?.attrs?.size) {
      const snapshot: { size: string } = extend(true, {}, node.attrs)
      nodeFontSize = snapshot.size || false
    }

    const parentIsBlockquote = !!(node.parentNode?.attrs?.blockquotePadding)
    node.src = node?.attrs?.src ? node.attrs.src : false
    node.attrs = {}
    node.attrs.continued = false

    // @ts-ignore
    const nextNode = node.selfNodeList[node.selfIndex + 1]
    // @ts-ignore
    const nextParentNode = node?.parentNode?.selfNodeList[node?.parentNode?.selfIndex + 1]

    if (!nextNode) node.isLast = true

    // Headings
    if ((node.type === "tag" && headingsList.includes(node.name)) || node?.parentNode?.attrs.hasHeadingFontSize === true) {
      node.attrs.hasHeadingFontSize = true
      if (headingsList.includes(node.name)) {
        node.attrs.nodeHeadingSize = processHeadingFontSize(node.name)
      } else if (node?.parentNode?.attrs?.nodeHeadingSize) {
        node.attrs.nodeHeadingSize = node?.parentNode?.attrs?.nodeHeadingSize
      }
      node.attrs.continued = false
    } else {
      node.attrs.hasHeadingFontSize = false
    }

    // Continue on inline next nodes
    if (nextNode) {
      if ((nextNode.type === "tag" && ["i", "b", "u", "font", "span", "a"].includes(nextNode.name))) {
        node.attrs.continued = true
      }
    }

    // Text align
    if (nodeStyles) {
      const textAlign = processNodeStyles(nodeStyles as string)
      if (textAlign && textAlign !== "left") node.attrs.align = textAlign
    } else if (node.parentNode?.attrs?.align && node.parentNode?.attrs?.align !== "left") {
      node.attrs.align = node.parentNode.attrs.align
    }

    // Span
    if ((node.type === "tag" && node.name === "span") || node?.parentNode?.attrs.isSpan === true) {
      node.attrs.isSpan = true
      node.attrs.continued = true
    } else { node.attrs.isSpan = false }

    // Link
    if ((node.type === "tag" && node.name === "a") || node?.parentNode?.attrs.isLink === true) {
      node.attrs.isLink = true
      node.attrs.continued = true
    } else { node.attrs.isLink = false }

    // Italic
    if ((node.type === "tag" && node.name === "i") || node?.parentNode?.attrs.italic === true) {
      node.attrs.italic = true
      node.attrs.continued = true
    } else { node.attrs.italic = false }

    // Bold
    if ((node.type === "tag" && node.name === "b") || node?.parentNode?.attrs.bold === true) {
      node.attrs.bold = true
      node.attrs.continued = true
    } else { node.attrs.bold = false }

    // Underline
    if ((node.type === "tag" && node.name === "u") || node?.parentNode?.attrs.underline === true) {
      node.attrs.underline = true
      node.attrs.continued = true
    } else { node.attrs.underline = false }

    // Font size
    if ((node.type === "tag" && node.name === "font") || node?.parentNode?.attrs.hasSpecialFontSize === true) {
      node.attrs.hasSpecialFontSize = true
      node.attrs.specialFontSize = nodeFontSize
        ? processNodeFontSize(nodeFontSize)
        : node?.parentNode?.attrs?.specialFontSize
      if (!nodeFontSize) node.attrs.specialFontSize = 11
      node.attrs.continued = true
    } else { node.attrs.hasSpecialFontSize = false }

    // Don't continue on block boundaries
    if (
      (node.parentNode?.isLast && !nextNode) ||
      (nextNode && nextNode.type === "tag" && blockTagList.includes(nextNode.name)) ||
      (node.isLast && nextParentNode?.type === "tag" && blockTagList.includes(nextParentNode?.name)) ||
      (node.isLast && node.parentNode?.isLast)
    ) {
      node.attrs.continued = false
    }

    // Blockquote padding
    if ((node.type === "tag" && node.name === "blockquote") || parentIsBlockquote) {
      node.attrs.blockquotePadding = true
    }

    // List item bullet
    if (node.type === "tag" && node.name === "li") {
      returnNodeList.push({
        type: "text",
        content: "     • ",
        attrs: { continued: true },
        voidElement: false,
        name: "",
        children: []
      })
    }

    // Image node
    if (node.type === "tag" && node.name === "img") {
      returnNodeList.push({
        type: "image",
        attrs: { src: node.src },
        voidElement: true,
        name: "img",
        children: []
      })
    }

    // Text node
    if (node.type === "text" && node.content) {
      const returnNode = node
      // @ts-ignore
      returnNode.content = (returnNode.content as string)
        .replace(/&nbsp;/g, " ")
        .replace(/(\r\n|\n|\r)/gm, "")
        .replace(/&amp;/g, "&")
      if (node.attrs.isSpan) returnNode.content = (returnNode.content as string) + " "
      returnNodeList.push(returnNode)
    } else if (node?.children?.length > 0) {
      node.children.forEach((childNode, i) => {
        childNode.selfIndex = i
        childNode.selfNodeList = node.children.filter(subNode => subNode.name !== "br")
        childNode.parentNode = node
        processNode(childNode)
      })
    }
  }

  // @ts-ignore
  const parsedHTML: I_HtmlParserNode[] = htmlParseStringify.parse(`<div>${input}</div>`)
  parsedHTML[0].selfNodeList = [parsedHTML[0]].filter(subNode => subNode.name !== "br")
  parsedHTML[0].selfIndex = 0
  parsedHTML[0].attrs = {}
  processNode(parsedHTML[0])

  return returnNodeList
}

// ── PDF blob generator ───────────────────────────────────────────────────────

async function generatePdfBlob (input: I_ExportObject, normalFont: ArrayBuffer, boldFont: ArrayBuffer): Promise<Blob> {
  return new Promise((resolve) => {
    const textFont = 11
    const subTitleFont = 15
    const listPadding = 60
    const textPadding = 40
    const blockquotePadding = 85

    const paragraphOptions = {
      lineGap: 3,
      paragraphGap: 8
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    const doc: I_PDFKitDocument = new PDFkit({ size: "A4" })
    doc.registerFont("Roboto-Regular", normalFont)
    doc.registerFont("Roboto-Bold", boldFont)

    const chunks: Uint8Array[] = []
    // @ts-ignore
    doc.on("data", (chunk: Uint8Array) => chunks.push(chunk))
    // @ts-ignore
    doc.on("end", () => resolve(new Blob(chunks, { type: "application/pdf" })))

    // Title
    let title = input.name
    if (input.isCategory) title = `${title} - Category`
    doc.font("Roboto-Bold").fillColor("#18303a").fontSize(20)
      .text(title, { align: "center" })
    doc.fontSize(textFont).moveDown().moveDown()

    if (!writerMode.value) {
      doc.font("Roboto-Bold").fillColor("#000000").fontSize(textFont)
        .text("Document type", textPadding, undefined, paragraphOptions)
      doc.font("Roboto-Regular").fillColor("#000000").fontSize(textFont)
        .list([input.documentType], listPadding, undefined, paragraphOptions)
        .moveDown()

      if (!hideDeadInformation.value) {
        doc.font("Roboto-Bold").fillColor("#000000").fontSize(textFont)
          .text("Status", textPadding, undefined, paragraphOptions)
        doc.font("Roboto-Regular").fillColor("#000000").fontSize(textFont)
          .list([(input.isDead) ? "Dead/Gone/Destroyed" : "Active/Alive"], listPadding, undefined, paragraphOptions)
          .moveDown()
      }

      if (includeHierarchyPath.value) {
        doc.font("Roboto-Bold").fillColor("#000000").fontSize(textFont)
          .text("Hierarchical path", textPadding, undefined, paragraphOptions)
        doc.font("Roboto-Regular").fillColor("#000000").fontSize(textFont)
          .list([input.hierarchicalPath], listPadding)
          .moveDown()
      }

      if (includeTags.value) {
        doc.font("Roboto-Bold").fillColor("#000000").fontSize(textFont)
          .text("Tags", textPadding, undefined, paragraphOptions)
        doc.font("Roboto-Regular").fillColor("#000000").fontSize(textFont)
          .list((Array.isArray(input.tags) ? input.tags : []), listPadding, undefined, paragraphOptions)
          .moveDown()
      }
    }

    for (const field of input.fieldValues) {
      if (field.type === "break" && !writerMode.value) {
        doc.moveDown()
          .font("Roboto-Bold").fillColor("#000000").fontSize(subTitleFont)
          .text(field.label, textPadding, undefined, paragraphOptions)
          .moveDown()
      } else if (field.type === "wysiwyg") {
        if (!writerMode.value || writerModeTitles.value) {
          doc.font("Roboto-Bold").fillColor("#000000").fontSize(textFont)
            .text(field.label, textPadding, undefined, paragraphOptions)
            .moveDown()
        }

        const returnList = buildPDFWysiwygContent(field.value as string)
        doc.font("Roboto-Regular").fillColor("#000000").fontSize(textFont)

        for (const node of returnList) {
          if (node.type === "text") {
            const wysiwygOptions: { [key: string]: any } = extend(true, {}, paragraphOptions)
            wysiwygOptions.baseline = "alphabetic"
            wysiwygOptions.width = 400
            doc.fontSize(textFont)
            wysiwygOptions.oblique = node.attrs.italic
            wysiwygOptions.underline = node.attrs.underline
            doc.font((node?.attrs?.bold) ? "Roboto-Bold" : "Roboto-Regular")
            if (node?.attrs?.hasHeadingFontSize) {
              // @ts-ignore
              doc.fontSize(node.attrs.nodeHeadingSize)
              doc.font("Roboto-Bold")
            }
            if (node?.attrs?.hasSpecialFontSize) {
              // @ts-ignore
              doc.fontSize(node.attrs.specialFontSize)
            }
            wysiwygOptions.continued = node.attrs.continued
            wysiwygOptions.align = node?.attrs?.align ? node.attrs.align : "left"
            const wysiwygPadding = (node?.attrs?.blockquotePadding) ? blockquotePadding : listPadding
            // @ts-ignore
            doc.text(node.content, wysiwygPadding, undefined, wysiwygOptions)
          }

          if (node.type === "image") {
            const rawPath = node.attrs.src as unknown as string
            if (rawPath && (rawPath.includes("https://") || rawPath.includes("http://"))) {
              // Web: skip online images with a note
              doc.addPage()
              doc.text(`[Image: ${rawPath}]`, blockquotePadding, undefined)
              doc.moveDown()
              doc.moveDown()
            } else if (rawPath) {
              doc.addPage()
              doc.text(`[Local image: ${rawPath}]`, blockquotePadding, undefined)
              doc.moveDown()
              doc.moveDown()
            }
          }

          if (node.type === "br") {
            doc.moveDown()
          }
        }
        doc.moveDown()
      } else if (!writerMode.value) {
        doc.font("Roboto-Bold").fillColor("#000000").fontSize(textFont)
          .text(field.label, textPadding, undefined, paragraphOptions)
        doc.font("Roboto-Regular").fillColor("#000000").fontSize(textFont)
          .list((Array.isArray(field.value) ? field.value : [field.value]), listPadding, undefined, paragraphOptions)
          .moveDown()
      }
    }

    doc.end()
  })
}

// ── Main export function ─────────────────────────────────────────────────────

async function exportDocuments () {
  exportOngoing.value = true
  exportedDocuments.value = 0

  let list: any[] = exportWholeProject.value
    ? allDocumentsStore.getAllDocuments.docs
    : exportDocumentsModel.value

  if (!includeIsDead.value) {
    list = list.filter((doc: any) => doc.extraFields.find((e: any) => e.id === "deadSwitch")?.value !== true)
  }

  exportList.value = list.map((doc: any) =>
    allDocumentsStore.getAllDocuments.docs.find((d: any) => d._id === doc._id)
  ).filter(Boolean) as any[]

  const zip = new JSZip()
  const isPDF = selectedExportFormat.value === "Adobe Reader - PDF"

  let normalFont: ArrayBuffer | null = null
  let boldFont: ArrayBuffer | null = null
  if (isPDF) {
    try {
      const fonts = await fetchFonts(useFallbackFont.value)
      normalFont = fonts.normal
      boldFont = fonts.bold
    } catch (e) {
      q.notify({ group: false, type: "negative", message: "Failed to load fonts for PDF export." })
      exportOngoing.value = false
      return
    }
  }

  const projectName = projectStore.getActiveProject?.name ?? "export"

  for (const doc of exportList.value) {
    currentDocName.value = (doc as any).label ?? ""
    const exportObject = buildExportObject(doc as any)
    const { dir, filename, suffix } = getExportPaths(exportObject)

    if (selectedExportFormat.value === "Markdown - MD") {
      const mdContent = buildMdContent(exportObject)
      zip.file(`${dir}${filename}${suffix}.md`, mdContent)
    } else {
      const pdfBlob = await generatePdfBlob(exportObject, normalFont!, boldFont!)
      zip.file(`${dir}${filename}${suffix}.pdf`, pdfBlob)
    }

    exportedDocuments.value++
    await sleep(1)
  }

  const zipBlob = await zip.generateAsync({ type: "blob" })
  const ext = isPDF ? "pdf" : "md"
  saveAs(zipBlob, `${projectName} - Export (${ext}).zip`)

  q.notify({ group: false, type: "positive", message: "Export finished" })
  exportOngoing.value = false
  dialogModel.value = false
  triggerDialogClose()
}

function buildExportObject (input: I_ShortenedDocument): I_ExportObject {
  const matchingBlueprint = blueprintsStore.getBlueprint(input.type)

  const exportObject = {
    name: input.extraFields.find(e => e.id === "name")?.value,
    id: input._id,
    documentType: matchingBlueprint.nameSingular,
    documentDirectory: matchingBlueprint.namePlural,
    isCategory: input.extraFields.find(e => e.id === "categorySwitch")?.value,
    fieldValues: buildFieldValues(input, matchingBlueprint)
  } as I_ExportObject

  if (!hideDeadInformation.value && includeIsDead.value) {
    exportObject.isDead = input.extraFields.find(e => e.id === "deadSwitch")?.value
  }
  else {
    exportObject.isDead = false
  }

  if (includeTags.value) {
    exportObject.tags = input.extraFields.find(e => e.id === "tags")?.value
  }
  if (includeHierarchyPath.value) {
    // @ts-ignore
    exportObject.hierarchicalPath = getDocumentHieararchicalPath(input, allDocumentsStore.getAllDocuments.docs)
  }

  return exportObject
}

function buildFieldValues (input: I_ShortenedDocument, blueprint: I_Blueprint) {
  const catIgnoreList = ["breakDocumentSettings", "name", "documentColor", "documentBackgroundColor", "parentDoc", "order", "categorySwitch", "minorSwitch", "deadSwitch", "finishedSwitch", "tags", "otherNames", "categoryDescription", "docTemplate"]

  const prepickedTemplateID = input.extraFields.find(e => e.id === "docTemplate")?.value

  const prepickedTemplate = documentTemplateList.value.find(t => t.id === prepickedTemplateID)

  const mappedFields = blueprint.extraFields
    .filter(field => field.type !== "tags")
    .filter(field => field.type !== "switch")
    .filter(field => field.id !== "name")
    .filter(field => field.id !== "order")
    .filter(field => field.id !== "deadSwitch")
    .filter(field => field.id !== "categorySwitch")
    .filter(field => field.id !== "parentDoc")
    .filter(field => field.id !== "documentColor")
    .filter(field => field.id !== "documentBackgroundColor")
    .filter(field => field.id !== "docTemplate")
    .filter(field => field.id !== "breakDocumentSettings")
    .filter(field => !field.isLegacy)
    .filter(field => !field.isSpoiler || includeSpoilers.value)
    .filter(field => {
      if (prepickedTemplate && useLocalDocumentTemplates.value) {
        const currentFieldID = field.id
        const curentBlueprintID = blueprint._id
        const matchedTemplateRow = prepickedTemplate.documentTypeList.find(e => e.documentTypeID === curentBlueprintID)
        if (matchedTemplateRow) {
          return !(matchedTemplateRow.excludedFieldIDList.includes(currentFieldID))
        }
        else {
          return true
        }
      }

      if (selectedDocumentTemplate.value) {
        const currentFieldID = field.id
        const curentBlueprintID = blueprint._id
        const matchedTemplateRow = selectedDocumentTemplate.value.documentTypeList.find(e => e.documentTypeID === curentBlueprintID)
        if (matchedTemplateRow) {
          return !(matchedTemplateRow.excludedFieldIDList.includes(currentFieldID))
        }
        else {
          return true
        }
      }
      else {
        return true
      }
    })
    .filter(field => {
      if (input.extraFields.find(e => e.id === "categorySwitch")?.value) {
        if (catIgnoreList.includes(field.id)) {
          return true
        }
        else {
          return false
        }
      }
      else {
        return true
      }
    })
    .map(field => {
      const matchedField = input.extraFields.find(sub => sub.id === field.id)
      let returnValue = matchedField?.value

      if (field.type === "number" && typeof returnValue === "number") {
        returnValue = returnValue.toString()
      }

      if (field.type === "list" && Array.isArray(returnValue)) {
        if (!field.predefinedListExtras) {
          returnValue = returnValue.map((e: {value: string}) => {
            const returnString = e.value.replace(/(\r\n|\n|\r)/gm, "")
            return returnString
          })
        }
        else {
          if (field.predefinedListExtras?.reverse) {
            returnValue = returnValue.map((e: {value: string, affix: string}) => {
              let returnString = e.affix
              if (e.value) {
                returnString = `${returnString}: ${e.value}`
              }
              returnString = returnString.replace(/(\r\n|\n|\r)/gm, "")
              return returnString
            })
          }
          else {
            returnValue = returnValue.map((e: {value: string, affix: string}) => {
              let returnString = e.value
              if (e.affix) {
                returnString = `${e.value} (${e.affix})`
              }
              returnString = returnString.replace(/(\r\n|\n|\r)/gm, "")
              return returnString
            })
          }
        }
      }

      if ((
        field.type === "singleToManyRelationship" ||
          field.type === "singleToSingleRelationship" ||
          field.type === "singleToNoneRelationship"
      ) && returnValue && returnValue.value
      ) {
        const valueToMap = Array.isArray(returnValue.value) ? returnValue.value[0] : returnValue.value

        // @ts-ignore
        const matchingDocument = allDocumentsStore.getAllDocuments.docs.find(doc => doc.id === valueToMap._id)

        if (matchingDocument) {
          // @ts-ignore
          let localReturnValue = matchingDocument.extraFields.find(e => e.id === "name")?.value as string

          const matchedNote = returnValue?.addedValues
          if (matchedNote?.value?.length > 0) {
            // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
            localReturnValue = `${localReturnValue} (${matchedNote.value})`
          }
          returnValue = localReturnValue.replace(/(\r\n|\n|\r)/gm, "")
        }
        else {
          returnValue = ""
        }
      }

      if ((
        field.type === "manyToManyRelationship" ||
          field.type === "manyToSingleRelationship" ||
          field.type === "manyToNoneRelationship"
      ) && returnValue && returnValue.value
      ) {
        const valuesToMap = returnValue.value as {_id: string, type: string}[]

        const mappedValues = valuesToMap
          .filter(value => {
            return value.type === field?.relationshipSettings?.connectedObjectType
          })
          .map(value => {
            // @ts-ignore
            const matchingDocument = allDocumentsStore.getAllDocuments.docs.find(doc => doc.id === value._id)
            if (matchingDocument) {
              // @ts-ignore
              let localReturnValue = matchingDocument.extraFields.find(e => e.id === "name")?.value as string

              const matchedNote = returnValue?.addedValues?.find((e: {pairedId: string}) => e.pairedId === value._id)
              if (matchedNote?.value?.length > 0) {
                // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
                localReturnValue = `${localReturnValue} (${matchedNote.value})`
              }
              localReturnValue = localReturnValue.replace(/(\r\n|\n|\r)/gm, "")
              return localReturnValue
            }
            return " "
          })
          .filter(e => e !== " ")

        returnValue = mappedValues
      }

      if (returnValue === undefined) {
        returnValue = ""
      }

      const returnValueFormat = returnValue as string

      const name = field.name

      return {
        label: name,
        value: returnValueFormat,
        type: field.type,
        id: field.id
      }
    })
    .filter(field => field?.value?.length > 0 || field.type === "break")

  const idsToRemove = []
  for (let index = 0; index < mappedFields.length; index++) {
    const field = mappedFields[index]

    if (field.type === "break" && mappedFields[index + 1]?.type === "break") {
      idsToRemove.push(field.id)
    }
  }

  idsToRemove.forEach(id => {
    const indexToRemove = mappedFields.findIndex(field => field.id === id)

    if (indexToRemove > -1) {
      mappedFields.splice(indexToRemove, 1)
    }
  })

  if (mappedFields[mappedFields.length - 1]?.type === "break") {
    mappedFields.splice(mappedFields.length - 1, 1)
  }

  return mappedFields
}
</script>

<style lang="scss">
.exportDialog {
  width: 1000px;
  max-width: calc(100vw - 100px) !important;
  margin-top: 100px;
  align-self: flex-start;
  max-height: calc(100vh - 160px) !important;

  h6 {
    display: block;
  }

  .exportSettings {
    max-height: calc(100vh - 420px);
    overflow-x: auto;
    padding-right: 20px;

    .q-item {
      padding-right: 0;
      padding-left: 0;
    }
  }
}

.exportTemplates {
  max-width: calc(100vw - 100px) !important;
  width: 1300px;
  max-height: calc(100vh - 120px) !important;
  margin-top: 100px;
  align-self: flex-start;
  display: flex;
  flex-wrap: wrap;

  .exportTemplateNameInput.q-field--error {
    .q-field__label {
      color: $secondary !important;
      font-weight: 600;
    }

    .text-negative {
      color: $secondary !important;
    }
  }

  h6 {
    display: block;
    width: 100%;
  }

  .controlButtons {
    width: 100%;
  }

  .deleteTemplateButton {
    margin-left: 330px;
  }

  .exportTemplatesInner {
    overflow: hidden;
    max-width: calc(100vw - 100px) !important;
    width: 1300px;
    max-height: calc(100vh - 300px) !important;
    align-self: flex-start;
    display: flex;
    flex-wrap: wrap;
  }

  .exportTemplatesTabList,
  .exportTemplatesTabContent {
    overflow: auto;
    max-height: calc(100vh - 300px) !important;

    .q-tabs__content {
      height: auto !important;
    }
  }

  .exportTemplatesTabList {
    width: 330px;

    .q-tab {
      padding: 0 16px;
      justify-content: flex-start !important;
      text-align: left !important;
    }
  }

  .exportTemplatesTab .fas,
  .exportTemplatesTab .fab {
    font-size: 16px;
  }

  .exportTemplatesTab .mdi {
    font-size: 18px;
  }

  .exportTemplatesTabContent {
    width: calc(100% - 360px);
  }
}
</style>
