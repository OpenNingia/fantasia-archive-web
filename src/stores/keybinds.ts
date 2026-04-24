import { defineStore } from "pinia"
import { uid } from "quasar"
import type { I_KeyPressObject } from "src/interfaces/I_KeypressObject"

const resetCurrentKey = (): I_KeyPressObject => ({
  altKey: true,
  ctrlKey: true,
  shiftKey: true,
  id: "",
  which: 99999
})

export const useKeybindsStore = defineStore("keybinds", {
  state: () => ({
    keyManagement: {
      timestamp: "",
      userKeybinds: [] as I_KeyPressObject[],
      defaults: [] as I_KeyPressObject[],
      currentKeyPress: resetCurrentKey()
    }
  }),

  getters: {
    getCurrentKeyBindData: (state) => state.keyManagement
  },

  actions: {
    registerDefaultKeybind (input: I_KeyPressObject) {
      if (!input.id) return
      this.keyManagement.currentKeyPress = resetCurrentKey()
      const i = this.keyManagement.defaults.findIndex((e) => e.id === input.id)
      if (i > -1) this.keyManagement.defaults[i] = input
      else this.keyManagement.defaults.push(input)
      this.keyManagement.timestamp = uid()
    },

    deregisterDefaultKeybind (input: I_KeyPressObject) {
      if (!input.id) return
      this.keyManagement.currentKeyPress = resetCurrentKey()
      const i = this.keyManagement.defaults.findIndex((e) => e.id === input.id)
      if (i > -1) {
        this.keyManagement.defaults.splice(i, 1)
        this.keyManagement.timestamp = uid()
      }
    },

    registerUserKeybind (input: I_KeyPressObject) {
      if (!input.id) return
      this.keyManagement.currentKeyPress = resetCurrentKey()
      const i = this.keyManagement.userKeybinds.findIndex((e) => e.id === input.id)
      if (i > -1) this.keyManagement.userKeybinds[i] = input
      else this.keyManagement.userKeybinds.push(input)
      this.keyManagement.timestamp = uid()
    },

    deregisterUserKeybind (input: I_KeyPressObject) {
      if (!input.id) return
      this.keyManagement.currentKeyPress = resetCurrentKey()
      const i = this.keyManagement.userKeybinds.findIndex((e) => e.id === input.id)
      if (i > -1) {
        this.keyManagement.userKeybinds.splice(i, 1)
        this.keyManagement.timestamp = uid()
      }
    },

    updatePressedKey (input: I_KeyPressObject) {
      this.keyManagement.currentKeyPress = input
      this.keyManagement.timestamp = uid()
    }
  }
})
