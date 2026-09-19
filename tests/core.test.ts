import { describe, expect, it } from "vitest";
import {
  getAnnotationLabel,
  parseAnnotationDocumentJson,
  serializeAnnotationDocument,
  validateAnnotationDocument,
  type AnnotationDocument
} from "../src/core";

const validDocument: AnnotationDocument = {
  version: "1.0",
  document: {
    id: "demo",
    title: "Demo",
    type: "txt"
  },
  labels: [
    { id: "person", name: "Person", color: "#7e57c2" },
    { id: "place", name: "Ort", color: "#ef5350" }
  ],
  annotations: [
    {
      id: "ann-1",
      labelId: "person",
      quote: "Vespasianus",
      occurrence: 1
    }
  ]
};

describe("AnnotationDocument core model", () => {
  it("validates a valid AnnotationDocument", () => {
    expect(validateAnnotationDocument(validDocument)).toEqual({
      valid: true,
      document: validDocument,
      issues: []
    });
  });

  it("resolves labels for annotations", () => {
    expect(getAnnotationLabel(validDocument, validDocument.annotations[0])).toEqual({
      id: "person",
      name: "Person",
      color: "#7e57c2"
    });
  });

  it("rejects an invalid AnnotationDocument", () => {
    const invalid = {
      ...validDocument,
      annotations: [
        {
          id: "ann-1",
          labelId: "missing",
          quote: "Vespasianus"
        }
      ]
    };

    const result = validateAnnotationDocument(invalid);
    expect(result.valid).toBe(false);
    expect(result.valid ? [] : result.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: "$.annotations[0].labelId"
        })
      ])
    );
  });

  it("serializes and parses AnnotationDocument JSON", () => {
    const serialized = serializeAnnotationDocument(validDocument);
    expect(parseAnnotationDocumentJson(serialized)).toEqual(validDocument);
  });
});
