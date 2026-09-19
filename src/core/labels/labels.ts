import type { Annotation, AnnotationDocument, AnnotationLabel } from "../types";

export function createLabelLookup(labels: readonly AnnotationLabel[]): Map<string, AnnotationLabel> {
  return new Map(labels.map((label) => [label.id, label]));
}

export function getAnnotationLabel(
  document: AnnotationDocument,
  annotation: Annotation
): AnnotationLabel | undefined {
  return createLabelLookup(document.labels).get(annotation.labelId);
}
