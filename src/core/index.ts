export type {
  Annotation,
  AnnotationBoundingBox,
  AnnotationDocument,
  AnnotationLabel,
  DocumentMetadata,
  DocumentType
} from "./types";

export {
  createLabelLookup,
  getAnnotationLabel
} from "./labels/labels";

export {
  assertAnnotationDocument,
  isAnnotationDocument,
  validateAnnotationDocument
} from "./validation/validateAnnotationDocument";

export type {
  AnnotationDocumentValidationResult,
  ValidationIssue
} from "./validation/validateAnnotationDocument";

export {
  cloneAnnotationDocument,
  parseAnnotationDocumentJson,
  serializeAnnotationDocument
} from "./serialization/annotationDocumentSerialization";
