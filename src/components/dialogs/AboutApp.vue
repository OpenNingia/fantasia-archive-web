<template>

  <q-dialog
    v-model="dialogModel"
    @before-hide="triggerDialogClose"
    >
    <q-card
      class="aboutDialog"
      dark
    >
      <q-card-section>
        <h6 class="text-center q-mt-lg q-mb-sm">About Fantasia Archive</h6>
      </q-card-section>

        <q-card-section>
          <div>
            Currently running Fantasia Archive version: <span class="text-bold text-primary">{{appVersion}}</span>
          </div>
       </q-card-section>

      <q-separator color="primary" horizonatal dark class="q-my-lg q-mx-auto" style="opacity: 0.5; width: 400px;" />

       <q-card-section>
        <div class="col-12 q-mx-sm q-my-md">
          <div class="row">

            <div class="col q-mx-sm q-my-md">
              <div class="patreonButton shadow-1" @click="openPatreonLink">
                Support FA on Patreon!
              </div>
            </div>

            <div class="col q-mx-sm q-my-md">
              <div class="kofiButton shadow-1" @click="openKofiLink">
                Support FA on Ko-Fi!
              </div>
            </div>

          </div>
        </div>

        <div class="col-12 q-mb-lg">
          <div class="row justify-center">

            <div class="q-mx-sm q-my-md">
              <div class="discordButton shadow-1" @click="openDiscordInviteLink">
                Discord
              </div>
            </div>

            <div class="q-mx-sm q-my-md">
              <div class="redditButton shadow-1" @click="openRedditLink"></div>
            </div>

            <div class="q-mx-sm q-my-md">
              <div class="websiteButton shadow-1" @click="openWebsiteLink">
                Website
              </div>
            </div>

            <div class="q-mx-sm q-my-md">
              <div class="githubButton shadow-1" @click="openGithubLink">
                GitHub
              </div>
            </div>

          </div>
        </div>

       </q-card-section>

      <q-card-actions align="around" class="q-mb-lg q-mt-md">
          <q-btn flat label="Close" color="accent" v-close-popup />
      </q-card-actions>
    </q-card>
  </q-dialog>

</template>

<script setup lang="ts">

import { ref, watch } from "vue"
import { useAppStores } from "src/composables/useAppStores"

const props = defineProps<{ dialogTrigger?: string }>()
const emit = defineEmits(["triggerDialogClose", "triggerDialogSubmit"])

const { dialogsStore } = useAppStores()

const dialogModel = ref(false)

watch(() => dialogsStore.getDialogsState, (val) => { if (!val) dialogModel.value = false })

watch(() => props.dialogTrigger, (val) => {
  if (val) {
    if (dialogsStore.getDialogsState) {
      return
    }
    dialogsStore.setDialogState(true)
    dialogModel.value = true
  }
})

function triggerDialogClose () { dialogsStore.setDialogState(false); emit("triggerDialogClose", true) }
function triggerDialogSubmit (val: string) { emit("triggerDialogSubmit", val) }

/**
 * Current app version
 */
const appVersion = "1.0.0"

/**
 * Open Discord invite link in the default browser window
 */
function openDiscordInviteLink () {
  window.open("https://discord.gg/JQDBvsN9Te", "_blank")
}

/**
 * Open Patreon link in the default browser window
 */
function openPatreonLink () {
  window.open("https://www.patreon.com/c/vishiri", "_blank")
}

/**
 * Open Ko-Fi link in the default browser window
 */
function openKofiLink () {
  window.open("https://ko-fi.com/vishiri", "_blank")
}

/**
 * Open Reddit link in the default browser window
 */
function openRedditLink () {
  window.open("https://www.reddit.com/r/FantasiaArchive/", "_blank")
}

/**
 * Open Website link in the default browser window
 */
function openWebsiteLink () {
  window.open("http://fantasiaarchive.com/", "_blank")
}

/**
 * Open GitHub link in the default browser window
 */
function openGithubLink () {
  window.open("https://github.com/vishiri/fantasia-archive-v1", "_blank")
}
</script>

<style lang="scss">
.aboutDialog {
  text-align: center;
  width: 650px;
  max-width: 650px !important;

  h6 {
    display: block;
  }
}
</style>
