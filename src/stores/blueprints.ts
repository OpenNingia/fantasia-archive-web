import { defineStore } from "pinia"
import type { I_Blueprint } from "src/interfaces/I_Blueprint"

export const useBlueprintsStore = defineStore("blueprints", {
  state: () => ({
    blueprints: [] as I_Blueprint[]
  }),

  getters: {
    getAllBlueprints: (state) => state.blueprints,
    getBlueprint: (state) => (type: string) =>
      state.blueprints.find((b) => b._id === type)
  },

  actions: {
    setAllBlueprints (blueprints: I_Blueprint[]) {
      this.blueprints = blueprints
    },

    setBlueprint (blueprint: I_Blueprint) {
      const index = this.blueprints.findIndex((b) => b._id === blueprint._id)
      if (index !== -1) this.blueprints[index] = blueprint
      else this.blueprints.push(blueprint)
    }
  }
})
