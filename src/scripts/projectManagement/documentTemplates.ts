import type { I_DocumentTemplate } from "./../../interfaces/I_DocumentTemplate"

const storageKey = () => {
  const projectId = (window as Window & { FA_projectId?: string }).FA_projectId ?? "default"
  return `FA_documentTemplates_${projectId}`
}

const load = (): I_DocumentTemplate[] => {
  try {
    return JSON.parse(localStorage.getItem(storageKey()) ?? "[]") as I_DocumentTemplate[]
  }
  catch {
    return []
  }
}

const persist = (templates: I_DocumentTemplate[]) => {
  localStorage.setItem(storageKey(), JSON.stringify(templates))
}

export const saveDocumentTemplateIntoDB = async (editedDocumentTemplate: I_DocumentTemplate): Promise<void> => {
  const templates = load()
  const idx = templates.findIndex(t => t.id === editedDocumentTemplate.id)
  if (idx > -1) {
    templates[idx] = editedDocumentTemplate
  }
  else {
    templates.push(editedDocumentTemplate)
  }
  templates.sort((a, b) => a.name.localeCompare(b.name))
  persist(templates)
}

export const retrieveAllDocumentTemplatesFromDB = async (): Promise<I_DocumentTemplate[]> => load()

export const removeDocumentTemplateFromDB = async (editedDocumentTemplate: I_DocumentTemplate): Promise<void> => {
  const templates = load()
  const idx = templates.findIndex(t => t.id === editedDocumentTemplate.id)
  if (idx > -1) {
    templates.splice(idx, 1)
  }
  persist(templates)
}
