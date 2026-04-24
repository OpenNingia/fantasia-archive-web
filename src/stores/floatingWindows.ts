import { defineStore } from "pinia"
import { uid } from "quasar"

export const useFloatingWindowsStore = defineStore("floatingWindows", {
  state: () => ({
    advSearchWindowVisible: "",
    noteCorkboardWindowVisible: "",
    documentPreviewVisible: "",
    documentPreviewWindowID: ""
  }),

  getters: {
    getAdvSearchWindowVisible: (state) => state.advSearchWindowVisible,
    getNoteCorkboardWindowVisible: (state) => state.noteCorkboardWindowVisible,
    getDocumentPreviewVisible: (state) => state.documentPreviewVisible,
    getDocumentPreviewWindowID: (state) => state.documentPreviewWindowID
  },

  actions: {
    setAdvSearchWindowVisible () {
      this.advSearchWindowVisible = uid()
    },

    setNoteCorkboardWindowVisible () {
      this.noteCorkboardWindowVisible = uid()
    },

    setDocumentPreviewWindowVisible (input: boolean) {
      this.documentPreviewVisible = input ? uid() : ""
    },

    setDocumentPreviewWindowID (input: string) {
      this.documentPreviewWindowID = input
    }
  }
})
