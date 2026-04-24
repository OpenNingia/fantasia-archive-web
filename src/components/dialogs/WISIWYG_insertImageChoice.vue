<template>
    <q-dialog
      v-model="dialogModel"
      @before-hide="triggerDialogClose"
      no-route-dismiss
      >
      <q-card v-show="startupInput" dark class="WISIWYG_insertImageChoiceDialog">
        <q-card-section class="row justify-center">
          <h6 class="text-center q-my-sm">Insert image</h6>
        </q-card-section>

        <q-card-section class="row q-mx-xl">
          <div>
            <span class="text-primary">Please note the following:</span>
            <ul>
              <li>Images uploaded here are stored on the server and referenced by URL</li>
              <li>Supported formats: JPG, PNG, GIF, WEBP</li>
              <li>You can also use any external image URL</li>
            </ul>
          </div>
        </q-card-section>

        <q-card-section class="row justify-center" horizontal>
          <q-card-section>
            <q-card-actions align="around">
              <q-btn
              flat
              label="Online image"
              color="primary"
              class="q-px-xl q-pt-lg q-pb-md"
              @click="openOnlineImageInput"
              />
            </q-card-actions>
          </q-card-section>

          <q-separator vertical />

          <q-card-section>
            <q-card-actions align="around">
              <q-btn
              flat
              label="Upload local image"
              color="primary"
              class="q-px-xl q-pt-lg q-pb-md"
              @click="triggerFileInput"
              />
              <input
                ref="fileInput"
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                style="display:none"
                @change="handleFileUpload"
              />
            </q-card-actions>
          </q-card-section>
        </q-card-section>

        <q-card-actions align="around" class="q-mx-xl q-mt-sm q-mb-sm" />

      </q-card>

      <q-card v-show="!startupInput" dark class="WISIWYG_insertImageChoiceDialog">
        <q-card-section class="row justify-center">
          <h6 class="text-center q-my-sm">Insert online URL</h6>
        </q-card-section>

        <q-card-section class="row justify-around">
           <q-input
            v-model="externalLink"
            outlined
            filled
            dense
            type="url"
            style="width: 80%;"
            label="Image URL link"
            ref="externalLinkRef"
          />
        </q-card-section>

        <q-card-section class="row justify-around">
           <q-card-actions align="around">
              <q-btn
              flat
              label="Submit"
              color="primary"
              @click="passImageLink(externalLink)"
              />
            </q-card-actions>
        </q-card-section>

            <q-card-actions align="around" class="q-mx-xl q-mt-sm q-mb-sm" />

      </q-card>
    </q-dialog>
</template>

<script setup lang="ts">

import { ref, watch, nextTick } from "vue"
import { useQuasar } from "quasar"
import { useAppStores } from "src/composables/useAppStores"
import { fileApi } from "src/services/api/fileApi"

const props = defineProps<{ dialogTrigger?: string }>()
const emit = defineEmits(["triggerDialogClose", "triggerDialogSubmit", "passing-image-link"])

const q = useQuasar()
const { dialogsStore, projectStore } = useAppStores()

const dialogModel = ref(false)
const startupInput = ref(true)
const externalLink = ref("")
const fileInput = ref<HTMLInputElement | null>(null)
const externalLinkRef = ref<any>(null)

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
  dialogsStore.setDialogState(true)
  dialogModel.value = true
  startupInput.value = true
  externalLink.value = ""
}

function triggerFileInput () {
  fileInput.value?.click()
}

async function handleFileUpload (event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return

  try {
    const projectId = projectStore.currentProjectId as string
    const uploaded = await fileApi.upload(projectId, file)
    passImageLink(fileApi.fileUrl(uploaded.id))
  }
  catch (err) {
    console.error("Image upload failed", err)
    q.notify({ type: "negative", message: "Image upload failed" })
  }
}

async function openOnlineImageInput () {
  startupInput.value = false
  await nextTick()
  // @ts-ignore
  externalLinkRef.value?.focus()
}

function passImageLink (link: string) {
  emit("passing-image-link", link)
  triggerDialogClose()
}
</script>

<style lang="scss" scoped>

.WISIWYG_insertImageChoiceDialog {
  min-width: 800px;
}
</style>
