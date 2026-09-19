import "../src/index";
import type { TSTextMarkerViewer } from "../src/TS_TextMarkerViewer";
import { JOSEPHUS_DEMO_ANNOTATIONS, JOSEPHUS_DEMO_TEXT } from "../src/demoData";

const viewer = document.querySelector<TSTextMarkerViewer>("#viewer")!;

// Dummy-Aufruf: lateinischer Demonstrationstext nach Motiven aus Josephus.
viewer.setAnnotations(JOSEPHUS_DEMO_ANNOTATIONS);
await viewer.loadText(JOSEPHUS_DEMO_TEXT, "Josephus-Demo.txt");
await viewer.setMode("annotations");

// Beispiele für spätere Einbindung:
// await viewer.setMode("search");
// await viewer.setSearchTerm("bellum");
//
// viewer.setAnnotations([
//   { id: "a1", quote: "Romani", label: "Akteur", color: "#7e57c2" },
//   { id: "a2", quote: "urbs", label: "Ort", color: "#ef5350", occurrence: 2 }
// ]);
