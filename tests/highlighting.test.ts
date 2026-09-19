import { describe, expect, it } from "vitest";
import type { AnnotationDocument } from "@datenflix007/ts-text-marker-core";
import {
  annotationHighlightRanges,
  searchHighlightRanges
} from "../src/viewer/highlighting/textRanges";

const text = "Bellum venit. bellum manet. Vespasianus bellum audit.";

const annotationDocument: AnnotationDocument = {
  version: "1.0",
  document: {
    id: "demo",
    type: "txt"
  },
  labels: [
    { id: "conflict", name: "Konflikt", color: "#ff9800" },
    { id: "person", name: "Person", color: "#7e57c2" }
  ],
  annotations: [
    {
      id: "ann-occurrence",
      labelId: "conflict",
      quote: "bellum",
      occurrence: 2
    },
    {
      id: "ann-range",
      labelId: "person",
      quote: "Vespasianus",
      start: 28,
      end: 39
    }
  ]
};

describe("text range helpers", () => {
  it("converts Core search occurrences into viewer highlight ranges", () => {
    expect(searchHighlightRanges(text, "bellum")).toEqual([
      expect.objectContaining({ start: 0, end: 6, color: "#ffeb3b" }),
      expect.objectContaining({ start: 14, end: 20, color: "#ffeb3b" }),
      expect.objectContaining({ start: 40, end: 46, color: "#ffeb3b" })
    ]);
  });

  it("locates an annotation by occurrence", () => {
    expect(annotationHighlightRanges(text, annotationDocument)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          annotationId: "ann-occurrence",
          start: 14,
          end: 20,
          label: "Konflikt",
          color: "#ff9800"
        })
      ])
    );
  });

  it("locates an annotation by start/end", () => {
    expect(annotationHighlightRanges(text, annotationDocument)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          annotationId: "ann-range",
          start: 28,
          end: 39,
          label: "Person",
          color: "#7e57c2"
        })
      ])
    );
  });

  it("filters annotation ranges by visible labels", () => {
    const ranges = annotationHighlightRanges(
      text,
      annotationDocument,
      undefined,
      new Set(["person"])
    );

    expect(ranges).toHaveLength(1);
    expect(ranges[0]).toEqual(expect.objectContaining({
      annotationId: "ann-range",
      label: "Person"
    }));
  });

  it("locates a multi-word annotation across a line break by start/end", () => {
    const lineBreakText = "Vespasianus cum exercitu Romano ad provincias\nvenit in Iudaeam.";
    const lineBreakDocument: AnnotationDocument = {
      version: "1.0",
      document: {
        id: "line-break-demo",
        type: "txt"
      },
      labels: [
        { id: "actor", name: "Akteur", color: "#26a69a" }
      ],
      annotations: [
        {
          id: "ann-line-break",
          labelId: "actor",
          quote: "cum exercitu Romano ad provincias\nvenit",
          start: 12,
          end: 51
        }
      ]
    };

    expect(annotationHighlightRanges(lineBreakText, lineBreakDocument)).toEqual([
      expect.objectContaining({
        annotationId: "ann-line-break",
        start: 12,
        end: 51,
        label: "Akteur"
      })
    ]);
  });
});
