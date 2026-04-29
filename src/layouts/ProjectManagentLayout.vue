<template>
  <q-layout view="lHh LpR lfr">

    <!-- Header -->
    <appHeader
      :is-project="false"
    />

    <q-page-container>
      <router-view v-slot="{ Component }">
        <transition
          enter-active-class="animated fadeIn"
          leave-active-class="animated fadeOut"
          mode="out-in"
          appear
          :duration="50"
        >
          <component :is="Component" :key="$route.path" />
        </transition>
      </router-view>
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">

import { onMounted } from "vue"
import appHeader from "src/components/AppHeader.vue"
import { retrieveCurrentProjectName } from "src/scripts/projectManagement/projectManagent"
import { useAppStores } from "src/composables/useAppStores"

const { projectStore } = useAppStores()

onMounted(async () => {
  const currentProjectName = await retrieveCurrentProjectName()
  projectStore.setProjectName(currentProjectName)
})

</script>

<style lang="scss" scoped>

</style>
