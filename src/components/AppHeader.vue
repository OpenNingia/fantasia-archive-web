<template>

  <q-header
    elevated
    class="bg-dark text-cultured appHeader"
  >

    <div :class="['appHeaderInner', { '-mobile': isMobile }]">
      <q-btn
        v-if="isMobile && drawer"
        flat
        dense
        round
        dark
        icon="mdi-menu"
        aria-label="Open navigation"
        data-testid="mobile-drawer-toggle"
        class="mobileDrawerToggle"
        @click="drawer.toggle"
      />
      <appControl
        class="appControl"
      />
      <topTabs
        v-if="!isMobile"
        class="topTabs"
      />
    </div>

  </q-header>

</template>

<script setup lang="ts">

import topTabs from "src/components/appHeader/TopTabs.vue"
import appControl from "src/components/appHeader/AppControl.vue"
import { useIsMobile } from "src/composables/useIsMobile"
import { useMobileDrawer } from "src/composables/mobileDrawer"

const isMobile = useIsMobile()
const drawer = useMobileDrawer()

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

  &.-mobile {
    width: 100%;
    align-items: center;

    .appControl {
      width: auto;
      flex-shrink: 1;
      flex-grow: 1;
      min-width: 0;
      overflow-x: auto;
    }
  }
}

.mobileDrawerToggle {
  -webkit-app-region: no-drag;
  flex-shrink: 0;
}
</style>
