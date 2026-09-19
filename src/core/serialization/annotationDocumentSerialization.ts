import type { AnnotationDocument } from "../types";
import { assertAnnotationDocument } from "../validation/validateAnnotationDocument";

export function parseAnnotationDocumentJson(json: string): AnnotationDocument {
  const parsed: unknown = JSON.parse(json);
  assertAnnotationDocument(parsed);
  return cloneAnnotationDocument(parsed);
}

export function serializeAnnotationDocument(document: AnnotationDocument): string {
  assertAnnotationDocument(document);
  return `${JSON.stringify(document, null, 2)}\n`;
}

export function cloneAnnotationDocument(document: AnnotationDocument): AnnotationDocument {
  assertAnnotationDocument(document);
  return JSON.parse(JSON.stringify(document)) as AnnotationDocument;
}
