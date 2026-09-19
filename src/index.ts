export { TSTextMarkerViewer } from "./TS_TextMarkerViewer";
export { JOSEPHUS_DEMO_TEXT, JOSEPHUS_DEMO_ANNOTATIONS } from "./demoData";
export type { MarkerMode, TextAnnotation } from "./types";

import { TSTextMarkerViewer } from "./TS_TextMarkerViewer";

if (!customElements.get("ts-text-marker-viewer")) {
  customElements.define("ts-text-marker-viewer", TSTextMarkerViewer);
}

declare global {
  interface HTMLElementTagNameMap {
    "ts-text-marker-viewer": TSTextMarkerViewer;
  }
}
