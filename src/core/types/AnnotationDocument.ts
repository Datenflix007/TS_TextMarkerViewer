import type { Annotation } from "./Annotation";
import type { AnnotationLabel } from "./AnnotationLabel";
import type { DocumentMetadata } from "./DocumentMetadata";

export interface AnnotationDocument {
  version: "1.0";
  document: DocumentMetadata;
  labels: AnnotationLabel[];
  annotations: Annotation[];
}
