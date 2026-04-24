import { defineStore } from "pinia"
import { uid } from "quasar"
import type { I_ShortenedDocument } from "src/interfaces/I_OpenedDocument"

export interface DocCollection {
  timestamp: string
  docs: I_ShortenedDocument[]
}

export interface DocCollectionByType {
  id: string
  timestamp: string
  docs: I_ShortenedDocument[]
}

export const useAllDocumentsStore = defineStore("allDocuments", {
  state: () => ({
    firstTime: true,
    docs: { timestamp: "", docs: [] } as DocCollection,
    docsWithoutCategories: { timestamp: "", docs: [] } as DocCollection,
    docByType: [] as DocCollectionByType[],
    docbyTypeWithoutCategories: [] as DocCollectionByType[]
  }),

  getters: {
    getFirstRunState: (state) => state.firstTime,
    getAllDocuments: (state) => state.docs,
    getAllDocumentsWithoutCategories: (state) => state.docsWithoutCategories,
    getDocument: (state) => (id: string) => state.docs.docs.find((d) => d._id === id),
    getDocumentsByType: (state) => (id: string) => state.docByType.find((t) => t.id === id),
    getDocumentsByTypeWithoutCategories: (state) => (id: string) =>
      state.docbyTypeWithoutCategories.find((t) => t.id === id)
  },

  actions: {
    markAsNonFirstRun () {
      this.firstTime = false
    },

    addDocument (input: { doc: I_ShortenedDocument }) {
      const ts = uid()
      const isCategory = input.doc.extraFields.find((e) => e.id === "categorySwitch")?.value

      if (this.docs.docs.findIndex((d) => d.type === input.doc.type && d._id === input.doc._id) < 0) {
        this.docs.docs.push(input.doc)
        this.docs.timestamp = ts
      }

      if (this.docsWithoutCategories.docs.findIndex((d) => d.type === input.doc.type && d._id === input.doc._id) < 0 && !isCategory) {
        this.docsWithoutCategories.docs.push(input.doc)
        this.docsWithoutCategories.timestamp = ts
      }

      const typeIndex = this.docByType.findIndex((t) => t.id === input.doc.type)
      if (this.docByType[typeIndex].docs.findIndex((d) => d._id === input.doc._id) < 0) {
        this.docByType[typeIndex].docs.push(input.doc)
        this.docByType[typeIndex].timestamp = ts
      }

      const typeIndexNoCats = this.docbyTypeWithoutCategories.findIndex((t) => t.id === input.doc.type)
      if (this.docbyTypeWithoutCategories[typeIndexNoCats].docs.findIndex((d) => d._id === input.doc._id) < 0 && !isCategory) {
        this.docbyTypeWithoutCategories[typeIndexNoCats].docs.push(input.doc)
        this.docbyTypeWithoutCategories[typeIndex].timestamp = ts
      }
    },

    updateDocument (input: { doc: I_ShortenedDocument }) {
      const ts = uid()
      const isCategory = input.doc.extraFields.find((e) => e.id === "categorySwitch")?.value

      const iDocs = this.docs.docs.findIndex((d) => d.type === input.doc.type && d._id === input.doc._id)
      this.docs.docs[iDocs] = input.doc
      this.docs.timestamp = ts

      const iNoCat = this.docsWithoutCategories.docs.findIndex((d) => d.type === input.doc.type && d._id === input.doc._id)
      if (!isCategory) {
        if (iNoCat < 0) this.docsWithoutCategories.docs.push(input.doc)
        else this.docsWithoutCategories.docs[iNoCat] = input.doc
      }
      else {
        this.docsWithoutCategories.docs.splice(iNoCat, 1)
      }
      this.docsWithoutCategories.timestamp = ts

      const typeIndex = this.docByType.findIndex((t) => t.id === input.doc.type)
      const iType = this.docByType[typeIndex].docs.findIndex((d) => d._id === input.doc._id)
      this.docByType[typeIndex].docs[iType] = input.doc
      this.docByType[typeIndex].timestamp = ts

      const typeIndexNoCats = this.docbyTypeWithoutCategories.findIndex((t) => t.id === input.doc.type)
      const iTypeNoCat = this.docbyTypeWithoutCategories[typeIndexNoCats].docs.findIndex((d) => d._id === input.doc._id)
      if (!isCategory) {
        if (iTypeNoCat < 0) this.docbyTypeWithoutCategories[typeIndexNoCats].docs.push(input.doc)
        else this.docbyTypeWithoutCategories[typeIndexNoCats].docs[iTypeNoCat] = input.doc
      }
      else {
        this.docbyTypeWithoutCategories[typeIndexNoCats].docs.splice(iTypeNoCat, 1)
      }
      this.docbyTypeWithoutCategories[typeIndex].timestamp = ts
    },

    removeDocument (input: { doc: I_ShortenedDocument }) {
      const ts = uid()

      const iDocs = this.docs.docs.findIndex((d) => d.type === input.doc.type && d._id === input.doc._id)
      this.docs.docs.splice(iDocs, 1)
      this.docs.timestamp = ts

      const iNoCat = this.docsWithoutCategories.docs.findIndex((d) => d.type === input.doc.type && d._id === input.doc._id)
      this.docsWithoutCategories.docs.splice(iNoCat, 1)
      this.docsWithoutCategories.timestamp = ts

      const typeIndex = this.docByType.findIndex((t) => t.id === input.doc.type)
      const iType = this.docByType[typeIndex].docs.findIndex((d) => d._id === input.doc._id)
      this.docByType[typeIndex].docs.splice(iType, 1)
      this.docByType[typeIndex].timestamp = ts

      const typeIndexNoCats = this.docbyTypeWithoutCategories.findIndex((t) => t.id === input.doc.type)
      const iTypeNoCat = this.docbyTypeWithoutCategories[typeIndexNoCats].docs.findIndex((d) => d._id === input.doc._id)
      this.docbyTypeWithoutCategories[typeIndexNoCats].docs.splice(iTypeNoCat, 1)
      this.docbyTypeWithoutCategories[typeIndex].timestamp = ts
    },

    mapNewDocumentType (input: { id: string; timestamp: string; docs: I_ShortenedDocument[] }) {
      const ts = uid()
      input.timestamp = ts

      this.docByType.push(input)

      const docsNoCats: DocCollectionByType = {
        id: input.id,
        timestamp: ts,
        docs: input.docs.filter((d) => !d.extraFields.find((e) => e.id === "categorySwitch")?.value)
      }
      this.docbyTypeWithoutCategories.push(docsNoCats)

      this.docs.docs = [...this.docs.docs, ...input.docs]
      this.docs.timestamp = ts

      this.docsWithoutCategories.docs = [...this.docsWithoutCategories.docs, ...docsNoCats.docs]
      this.docsWithoutCategories.timestamp = ts
    },

    resetDocuments () {
      this.firstTime = true
      this.docs.docs = []
      this.docs.timestamp = uid()
      this.docsWithoutCategories.docs = []
      this.docsWithoutCategories.timestamp = uid()
      this.docByType = []
      this.docbyTypeWithoutCategories = []
    }
  }
})
