<template>

  <q-header
    elevated
    class="bg-dark text-cultured appHeader"
  >

    <div class="appHeaderInner">
      <appControl
        class="appControl"
      />
      <topTabs
        class="topTabs"
      />
    </div>

  </q-header>

</template>

<script setup lang="ts">

import topTabs from "src/components/appHeader/TopTabs.vue"
import appControl from "src/components/appHeader/AppControl.vue"

</script>

<style lang="scss" scoped>

.appHeaderInner {
  z-index: 999999;
  display: flex;
  min-height: 40px;
  -webkit-app-region: drag;
  width: calc(100% - 147px);

  .appControl {
    width: 375px;
    flex-shrink: 0;
    flex-grow: 0;
  }

  .topTabs {
    max-width: calc(100% - 415px);
  }
}
</style>
