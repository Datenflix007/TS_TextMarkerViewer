import "@datenflix/ts-text-marker-viewer";
import type { AnnotationDocument } from "@datenflix/ts-text-marker-core";
import type { TSTextMarkerViewer, ViewerMode } from "@datenflix/ts-text-marker-viewer";
import annotationData from "./josephus-annotations.json";
import { josephusText } from "./josephus-demo";

const viewer = document.querySelector<TSTextMarkerViewer>("ts-text-marker-viewer");
const josephusAnnotations = annotationData as AnnotationDocument;

async function loadJosephusDemo(mode: ViewerMode = "annotations"): Promise<void> {
  if (!viewer) return;

  await viewer.loadText(josephusText, {
    id: "josephus-demo",
    title: "Flavius Josephus - Bellum Judaicum",
    type: "txt"
  });

  viewer.setAnnotationDocument(josephusAnnotations);
  viewer.setMode(mode);

  if (mode === "search") {
    viewer.setSearchTerm("bellum");
  }
}

viewer?.addEventListener("ts-demo-requested", () => {
  void loadJosephusDemo("annotations");
});

await loadJosephusDemo("annotations");
