import { defineStore } from "pinia"
import { uid } from "quasar"

export const useDialogsStore = defineStore("dialogs", {
  state: () => ({
    dialogExists: false,
    exportDialog: {
      prepickedValue: [] as string[],
      triggerTimestamp: "",
      prepickedDocumentTemplate: ""
    }
  }),

  getters: {
    getDialogsState: (state) => state.dialogExists,
    getExportDialogState: (state) => state.exportDialog
  },

  actions: {
    setDialogState (input: boolean) {
      this.dialogExists = input
    },

    setExportDialogState (input: string[], prepickedTemplateID = "") {
      this.exportDialog = {
        prepickedValue: input,
        triggerTimestamp: uid(),
        prepickedDocumentTemplate: prepickedTemplateID
      }
    }
  }
})
