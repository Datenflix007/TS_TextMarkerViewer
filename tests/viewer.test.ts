import { afterEach, describe, expect, it } from "vitest";
import type { AnnotationDocument } from "../src/core";
import "../src/index";
import type { TSTextMarkerViewer } from "../src/viewer";

const annotationDocument: AnnotationDocument = {
  version: "1.0",
  document: {
    id: "viewer-test",
    type: "txt"
  },
  labels: [
    { id: "conflict", name: "Konflikt", color: "#ff9800" }
  ],
  annotations: [
    {
      id: "ann-1",
      labelId: "conflict",
      quote: "bellum",
      occurrence: 1
    }
  ]
};

describe("TSTextMarkerViewer", () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it("loads TXT through loadText", async () => {
    const viewer = createViewer();

    await viewer.loadText("bellum et pax", {
      id: "txt-test",
      title: "TXT Test",
      type: "txt"
    });

    expect(viewer.getPageCount()).toBe(1);
    expect(viewer.shadowRoot?.querySelector(".txt-page")?.textContent).toContain("bellum et pax");
  });

  it("loads TXT through loadFile", async () => {
    const viewer = createViewer();
    const file = new File(["bellum in tabula"], "demo.txt", { type: "text/plain" });

    await viewer.loadFile(file);

    expect(viewer.getPageCount()).toBe(1);
    expect(viewer.shadowRoot?.querySelector(".txt-page")?.textContent).toContain("bellum in tabula");
  });

  it("renders search mode", async () => {
    const viewer = createViewer();

    await viewer.loadText("Bellum bellum", {
      id: "search-test",
      type: "txt"
    });
    viewer.setMode("search");
    viewer.setSearchTerm("bellum");
    await nextFrame();

    expect(viewer.shadowRoot?.querySelectorAll(".txt-mark-search")).toHaveLength(2);
  });

  it("renders annotation mode", async () => {
    const viewer = createViewer();

    await viewer.loadText("bellum et pax", {
      id: "annotation-test",
      type: "txt"
    });
    viewer.setAnnotationDocument(annotationDocument);
    viewer.setMode("annotations");
    await nextFrame();

    const mark = viewer.shadowRoot?.querySelector<HTMLElement>(".txt-mark-annotation");
    expect(mark?.textContent).toBe("bellum");
    expect(mark?.dataset.label).toBe("Konflikt");
  });
});

function createViewer(): TSTextMarkerViewer {
  const viewer = document.createElement("ts-text-marker-viewer") as TSTextMarkerViewer;
  document.body.appendChild(viewer);
  return viewer;
}

function nextFrame(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}
