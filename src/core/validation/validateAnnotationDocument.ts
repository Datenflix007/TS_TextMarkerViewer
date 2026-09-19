import type {
  Annotation,
  AnnotationBoundingBox,
  AnnotationDocument,
  AnnotationLabel,
  DocumentMetadata,
  DocumentType
} from "../types";

export interface ValidationIssue {
  path: string;
  message: string;
}

export type AnnotationDocumentValidationResult =
  | { valid: true; document: AnnotationDocument; issues: [] }
  | { valid: false; issues: ValidationIssue[] };

const SUPPORTED_VERSION = "1.0";
const DOCUMENT_TYPES = new Set<DocumentType>(["pdf", "txt"]);

export function validateAnnotationDocument(input: unknown): AnnotationDocumentValidationResult {
  const issues: ValidationIssue[] = [];

  if (!isRecord(input)) {
    return {
      valid: false,
      issues: [{ path: "$", message: "AnnotationDocument must be an object." }]
    };
  }

  if (input.version !== SUPPORTED_VERSION) {
    issues.push({ path: "$.version", message: 'Version must be "1.0".' });
  }

  validateDocumentMetadata(input.document, "$.document", issues);
  validateLabels(input.labels, "$.labels", issues);
  validateAnnotations(input.annotations, "$.annotations", input.labels, issues);

  if (issues.length > 0) {
    return { valid: false, issues };
  }

  return {
    valid: true,
    document: input as unknown as AnnotationDocument,
    issues: []
  };
}

export function isAnnotationDocument(input: unknown): input is AnnotationDocument {
  return validateAnnotationDocument(input).valid;
}

export function assertAnnotationDocument(input: unknown): asserts input is AnnotationDocument {
  const result = validateAnnotationDocument(input);
  if (!result.valid) {
    const details = result.issues.map((issue) => `${issue.path}: ${issue.message}`).join("; ");
    throw new Error(`Invalid AnnotationDocument: ${details}`);
  }
}

function validateDocumentMetadata(input: unknown, path: string, issues: ValidationIssue[]): void {
  if (!isRecord(input)) {
    issues.push({ path, message: "Document metadata must be an object." });
    return;
  }

  requireNonEmptyString(input.id, `${path}.id`, issues);
  optionalString(input.title, `${path}.title`, issues);
  optionalString(input.source, `${path}.source`, issues);

  if (input.type !== undefined && !DOCUMENT_TYPES.has(input.type as DocumentType)) {
    issues.push({ path: `${path}.type`, message: 'Document type must be "pdf" or "txt".' });
  }
}

function validateLabels(input: unknown, path: string, issues: ValidationIssue[]): void {
  if (!Array.isArray(input)) {
    issues.push({ path, message: "Labels must be an array." });
    return;
  }

  const ids = new Set<string>();

  input.forEach((label, index) => {
    const labelPath = `${path}[${index}]`;
    if (!isRecord(label)) {
      issues.push({ path: labelPath, message: "Label must be an object." });
      return;
    }

    if (requireNonEmptyString(label.id, `${labelPath}.id`, issues)) {
      if (ids.has(label.id)) {
        issues.push({ path: `${labelPath}.id`, message: "Label id must be unique." });
      }
      ids.add(label.id);
    }

    requireNonEmptyString(label.name, `${labelPath}.name`, issues);
    requireNonEmptyString(label.color, `${labelPath}.color`, issues);
  });
}

function validateAnnotations(
  input: unknown,
  path: string,
  labelsInput: unknown,
  issues: ValidationIssue[]
): void {
  if (!Array.isArray(input)) {
    issues.push({ path, message: "Annotations must be an array." });
    return;
  }

  const labelIds = new Set(
    Array.isArray(labelsInput)
      ? labelsInput
          .filter((label): label is AnnotationLabel => isRecord(label) && typeof label.id === "string")
          .map((label) => label.id)
      : []
  );
  const annotationIds = new Set<string>();

  input.forEach((annotation, index) => {
    const annotationPath = `${path}[${index}]`;
    if (!isRecord(annotation)) {
      issues.push({ path: annotationPath, message: "Annotation must be an object." });
      return;
    }

    if (requireNonEmptyString(annotation.id, `${annotationPath}.id`, issues)) {
      if (annotationIds.has(annotation.id)) {
        issues.push({ path: `${annotationPath}.id`, message: "Annotation id must be unique." });
      }
      annotationIds.add(annotation.id);
    }

    if (requireNonEmptyString(annotation.labelId, `${annotationPath}.labelId`, issues)) {
      if (!labelIds.has(annotation.labelId)) {
        issues.push({ path: `${annotationPath}.labelId`, message: "Referenced label does not exist." });
      }
    }

    requireNonEmptyString(annotation.quote, `${annotationPath}.quote`, issues);
    optionalPositiveInteger(annotation.page, `${annotationPath}.page`, issues);
    optionalPositiveInteger(annotation.occurrence, `${annotationPath}.occurrence`, issues);
    optionalString(annotation.comment, `${annotationPath}.comment`, issues);
    validateRange(annotation as Partial<Annotation>, annotationPath, issues);
    validateMetadata(annotation.metadata, `${annotationPath}.metadata`, issues);
    validateBoundingBox(annotation.boundingBox, `${annotationPath}.boundingBox`, issues);
  });
}

function validateRange(annotation: Partial<Annotation>, path: string, issues: ValidationIssue[]): void {
  const hasStart = annotation.start !== undefined;
  const hasEnd = annotation.end !== undefined;

  if (hasStart !== hasEnd) {
    issues.push({ path, message: "start and end must be provided together." });
    return;
  }

  if (!hasStart || !hasEnd) return;

  if (!isNonNegativeInteger(annotation.start)) {
    issues.push({ path: `${path}.start`, message: "start must be a non-negative integer." });
  }
  if (!isNonNegativeInteger(annotation.end)) {
    issues.push({ path: `${path}.end`, message: "end must be a non-negative integer." });
  }
  if (
    isNonNegativeInteger(annotation.start) &&
    isNonNegativeInteger(annotation.end) &&
    annotation.end <= annotation.start
  ) {
    issues.push({ path, message: "end must be greater than start." });
  }
}

function validateMetadata(input: unknown, path: string, issues: ValidationIssue[]): void {
  if (input !== undefined && !isRecord(input)) {
    issues.push({ path, message: "metadata must be an object when provided." });
  }
}

function validateBoundingBox(input: unknown, path: string, issues: ValidationIssue[]): void {
  if (input === undefined) return;
  if (!isRecord(input)) {
    issues.push({ path, message: "boundingBox must be an object when provided." });
    return;
  }

  const box = input as Partial<AnnotationBoundingBox>;
  requireFiniteNumber(box.x, `${path}.x`, issues);
  requireFiniteNumber(box.y, `${path}.y`, issues);
  requireFiniteNumber(box.width, `${path}.width`, issues);
  requireFiniteNumber(box.height, `${path}.height`, issues);
}

function requireNonEmptyString(input: unknown, path: string, issues: ValidationIssue[]): input is string {
  if (typeof input !== "string" || input.trim().length === 0) {
    issues.push({ path, message: "Value must be a non-empty string." });
    return false;
  }
  return true;
}

function optionalString(input: unknown, path: string, issues: ValidationIssue[]): void {
  if (input !== undefined && typeof input !== "string") {
    issues.push({ path, message: "Value must be a string when provided." });
  }
}

function optionalPositiveInteger(input: unknown, path: string, issues: ValidationIssue[]): void {
  if (input !== undefined && (!Number.isInteger(input) || typeof input !== "number" || input < 1)) {
    issues.push({ path, message: "Value must be a positive integer when provided." });
  }
}

function requireFiniteNumber(input: unknown, path: string, issues: ValidationIssue[]): void {
  if (typeof input !== "number" || !Number.isFinite(input)) {
    issues.push({ path, message: "Value must be a finite number." });
  }
}

function isNonNegativeInteger(input: unknown): input is number {
  return typeof input === "number" && Number.isInteger(input) && input >= 0;
}

function isRecord(input: unknown): input is Record<string, unknown> {
  return typeof input === "object" && input !== null && !Array.isArray(input);
}
