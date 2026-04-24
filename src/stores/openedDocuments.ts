import { defineStore } from "pinia"
import { uid } from "quasar"
import type { I_OpenedDocument } from "src/interfaces/I_OpenedDocument"

export interface OpenedDocumentsData {
  timestamp: string
  treeAction: boolean
  lastRemovedIndex: number
  docs: I_OpenedDocument[]
}

export const useOpenedDocumentsStore = defineStore("openedDocuments", {
  state: () => ({
    documents: {
      timestamp: "",
      treeAction: false,
      lastRemovedIndex: -1,
      docs: []
    } as OpenedDocumentsData
  }),

  getters: {
    getAllDocuments: (state) => state.documents,
    getDocument: (state) => (id: string) =>
      state.documents.docs.find((doc) => doc._id === id)
  },

  actions: {
    _resetTreeAction () {
      this.documents.treeAction = false
    },

    addDocument (input: { doc: I_OpenedDocument; treeAction: boolean }) {
      if (!this.documents.docs.find((d) => d.type === input.doc.type && d._id === input.doc._id)) {
        this.documents.docs.push(input.doc)
        this.documents.treeAction = input.treeAction
        this.documents.timestamp = uid()
      }
      setTimeout(() => this._resetTreeAction(), 200)
    },

    updateDocument (input: { doc: I_OpenedDocument; treeAction: boolean }) {
      const i = this.documents.docs.findIndex((d) => d.type === input.doc.type && d._id === input.doc._id)
      this.documents.docs[i] = input.doc
      this.documents.treeAction = input.treeAction
      this.documents.timestamp = uid()
      setTimeout(() => this._resetTreeAction(), 200)
    },

    removeDocument (input: { doc: I_OpenedDocument; treeAction: boolean }) {
      const i = this.documents.docs.findIndex((d) => d.type === input.doc.type && d._id === input.doc._id)
      this.documents.docs.splice(i, 1)
      this.documents.treeAction = input.treeAction
      this.documents.lastRemovedIndex = i
      this.documents.timestamp = uid()
      setTimeout(() => this._resetTreeAction(), 200)
    },

    resetRemoveIndex () {
      this.documents.lastRemovedIndex = -1
    },

    triggerTreeAction () {
      this.documents.treeAction = true
      setTimeout(() => this._resetTreeAction(), 200)
    },

    closeAllDocuments () {
      this.documents.docs = this.documents.docs.filter((d) => d.hasEdits)
      this.documents.treeAction = true
      this.documents.timestamp = uid()
      setTimeout(() => this._resetTreeAction(), 200)
    },

    forceCloseAllDocuments () {
      this.documents.docs = []
      this.documents.treeAction = true
      this.documents.timestamp = uid()
      setTimeout(() => this._resetTreeAction(), 200)
    },

    closeAllButCurrentDocuments (doc: I_OpenedDocument) {
      this.documents.docs = this.documents.docs.filter((d) => d.hasEdits || d._id === doc._id)
      this.documents.treeAction = true
      this.documents.timestamp = uid()
      setTimeout(() => this._resetTreeAction(), 200)
    },

    forceCloseAllButCurrentDocuments (doc: I_OpenedDocument) {
      this.documents.docs = this.documents.docs.filter((d) => d._id === doc._id)
      this.documents.treeAction = true
      this.documents.timestamp = uid()
      setTimeout(() => this._resetTreeAction(), 200)
    },

    resetDocuments () {
      this.documents.docs = []
      this.documents.treeAction = true
      this.documents.timestamp = uid()
    }
  }
})
