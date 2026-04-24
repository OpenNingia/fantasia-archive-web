<template>
  <div class="wrapper">
    <div>
      projects
    </div>

    <div>
      <q-img
        :src="localImages.tut1_image1"
        contain
        />
    </div>
  </div>
</template>

<script setup lang="ts">
import { tutorialImages } from "src/scripts/utilities/tutorialImages"

const localImages = tutorialImages as unknown as any
</script>

<style  lang="scss">
</style>
