// Relationship sync is handled server-side by documentService.ts.
// These stubs exist to satisfy any lingering imports during the Phase 4 migration.
import type { I_ExtraDocumentFields, I_OpenedDocument } from "../../interfaces/I_OpenedDocument"
import type { I_FieldRelationship } from "src/interfaces/I_FieldRelationship"

export const single_changeRelationshipToAnotherObject = async (
  _field: I_ExtraDocumentFields,
  _currentDocument: I_OpenedDocument,
  _previousDocument: I_OpenedDocument
): Promise<I_OpenedDocument[]> => []

export const many_changeRelationshipToAnotherObject = async (
  _field: I_ExtraDocumentFields,
  _currentDocument: I_OpenedDocument,
  _previousDocument: I_OpenedDocument
): Promise<I_OpenedDocument[]> => []

export const single_addRelationshipToAnotherObject = async (
  _field: I_ExtraDocumentFields,
  _currentValue: I_FieldRelationship,
  _currentDocument: I_OpenedDocument
): Promise<I_OpenedDocument> => ({} as I_OpenedDocument)

export const single_removeRelationshipFromAnotherObject = async (
  _currentValue: I_FieldRelationship,
  _previousValue: I_FieldRelationship
): Promise<I_OpenedDocument | false> => false

export const many_addRelationshipToAnotherObject = async (
  _field: I_ExtraDocumentFields,
  _currentValue: I_FieldRelationship,
  _currentDocument: I_OpenedDocument
): Promise<I_OpenedDocument> => ({} as I_OpenedDocument)

export const many_removeRelationshipFromAnotherObject = async (
  _previousValue: I_FieldRelationship,
  _currentDocument: I_OpenedDocument
): Promise<I_OpenedDocument | false> => false
