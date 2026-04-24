<template>

   <q-btn-group
      flat
      class="appWindowButtons bg-dark"
   >

    <projectCloseCheckDialog
     :dialog-trigger="projectCloseCheckDialogTrigger"
     :dialog-mode="'appClose'"
      @trigger-dialog-close="projectCloseCheckDialogClose"
    />

    <!-- Minimize button-->
    <q-btn
      flat
      :ripple="false"
      :class="{'minimize': osSystem === 'darwin'}"
      dark
      size='sm'
      @click="minimizeWindow">
        <q-icon name="mdi-window-minimize"></q-icon>
    </q-btn>

    <!-- MinMax button-->
    <q-btn
      flat
      :ripple="false"
      :class="{'minMax': osSystem === 'darwin'}"
      dark
      size='sm'
      @click="resizeWindow">
        <q-icon :name="(isMaximized)? 'mdi-window-restore' : 'mdi-window-maximize'"></q-icon>
    </q-btn>

    <!-- Close button-->
    <q-btn
      flat
      :ripple="false"
      dark
      size='sm'
      @click="projectCloseCheckDialogAssignUID"
      :class="[{'close': osSystem === 'darwin'}]"
    >
      <q-icon name="mdi-window-close"></q-icon>
    </q-btn>

  </q-btn-group>

</template>

<script setup lang="ts">

import { ref, onMounted, onUnmounted } from "vue"
import projectCloseCheckDialog from "src/components/dialogs/ProjectCloseCheck.vue"
import { useDocumentHelpers } from "src/composables/useDocumentHelpers"

const { generateUID } = useDocumentHelpers()

/****************************************************************/
// Basic component functionality
/****************************************************************/

/**
 * Determines if the window is maximed or not
 */
const isMaximized = ref(false)

/**
 * Gets the currently used OS — not available in browser build
 */
const osSystem = ref("")

/**
 * Checks if the window is currently maximized or not
 */
function checkIfMaximized () {
  // No-op in browser build (Electron remote not available)
}

/**
 * Minimizes the current window
 */
function minimizeWindow () {
  // No-op in browser build
}

/**
 * Resizes the window to either smaller or maximized
 */
function resizeWindow () {
  // No-op in browser build
}

onMounted(() => {
  window.addEventListener("resize", checkIfMaximized)
  checkIfMaximized()
})

onUnmounted(() => {
  window.removeEventListener("resize", checkIfMaximized)
})

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

</script>

<style lang="scss" scoped>
.appWindowButtons {
  border-radius: 0;
  position: fixed;
  right: 0;
  top: 0;
  height: 40px;
  z-index: 99999999;
  color: #fff;
  -webkit-app-region: no-drag;
}
</style>

<style lang="scss" >

</style>
