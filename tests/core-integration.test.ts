import { afterEach, describe, expect, it } from "vitest";
import {
  validateAnnotationDocument,
  type AnnotationDocument
} from "@datenflix007/ts-text-marker-core";
import "../src/index";
import type { TSTextMarkerViewer } from "../src/viewer";

const coreAnnotationDocument: AnnotationDocument = {
  version: "1.0",
  document: {
    id: "core-viewer-integration",
    title: "Core Viewer Integration",
    type: "txt"
  },
  labels: [
    {
      id: "person",
      name: "Person",
      color: "#7e57c2"
    }
  ],
  annotations: [
    {
      id: "ann-vespasianus",
      labelId: "person",
      quote: "Vespasianus"
    }
  ]
};

describe("Core and Viewer integration", () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it("renders a Core AnnotationDocument with label text and color", async () => {
    expect(validateAnnotationDocument(coreAnnotationDocument).valid).toBe(true);

    const viewer = document.createElement("ts-text-marker-viewer") as TSTextMarkerViewer;
    document.body.appendChild(viewer);

    await viewer.loadText("Vespasianus venit.", coreAnnotationDocument.document);
    viewer.setAnnotationDocument(coreAnnotationDocument);
    viewer.setMode("annotations");
    await nextFrame();

    const mark = viewer.shadowRoot?.querySelector<HTMLElement>(".txt-mark-annotation");
    expect(mark?.textContent).toBe("Vespasianus");
    expect(mark?.dataset.label).toBe("Person");
    expect(mark?.style.getPropertyValue("--label-color")).toBe("#7e57c2");
  });
});

function nextFrame(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}
