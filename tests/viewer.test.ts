import { afterEach, describe, expect, it } from "vitest";
import type { AnnotationDocument } from "@datenflix007/ts-text-marker-core";
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

  it("rejects invalid Core AnnotationDocuments with readable errors", () => {
    const viewer = createViewer();
    const invalidDocument = {
      ...annotationDocument,
      annotations: [
        {
          id: "ann-invalid",
          labelId: "missing",
          quote: "bellum"
        }
      ]
    } as unknown as AnnotationDocument;

    expect(() => viewer.setAnnotationDocument(invalidDocument)).toThrow(
      /Invalid AnnotationDocument: .*\.labelId/
    );
  });

  it("switches to the bracket annotation display style", async () => {
    const viewer = createViewer();

    await viewer.loadText("bellum et pax", {
      id: "annotation-style-test",
      type: "txt"
    });
    viewer.setAnnotationDocument(annotationDocument);
    viewer.setMode("annotations");
    viewer.setAnnotationDisplayStyle("bracket");
    await nextFrame();

    expect(viewer.getAnnotationDisplayStyle()).toBe("bracket");
    const mark = viewer.shadowRoot?.querySelector<HTMLElement>(".txt-mark-annotation-bracket");
    expect(mark?.dataset.annotationDisplayStyle).toBe("bracket");
    expect(mark?.dataset.label).toBe("Konflikt");
  });

  it("filters annotation labels from the left label sidebar", async () => {
    const viewer = createViewer();

    await viewer.loadText("bellum et pax", {
      id: "annotation-filter-test",
      type: "txt"
    });
    viewer.setAnnotationDocument(annotationDocument);
    viewer.setMode("annotations");
    await nextFrame();

    const button = viewer.shadowRoot?.querySelector<HTMLButtonElement>('[data-label-id="conflict"]');
    expect(button?.classList.contains("is-hidden")).toBe(false);
    expect(viewer.shadowRoot?.querySelectorAll(".txt-mark-annotation")).toHaveLength(1);

    button?.click();
    await nextFrame();

    const hiddenButton = viewer.shadowRoot?.querySelector<HTMLButtonElement>('[data-label-id="conflict"]');
    expect(hiddenButton?.classList.contains("is-hidden")).toBe(true);
    expect(viewer.getHiddenAnnotationLabelIds()).toEqual(["conflict"]);
    expect(viewer.shadowRoot?.querySelectorAll(".txt-mark-annotation")).toHaveLength(0);

    hiddenButton?.click();
    await nextFrame();

    expect(viewer.getHiddenAnnotationLabelIds()).toEqual([]);
    expect(viewer.shadowRoot?.querySelectorAll(".txt-mark-annotation")).toHaveLength(1);
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
