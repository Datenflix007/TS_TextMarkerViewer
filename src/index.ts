export { TSTextMarkerViewer } from "./viewer";
export type { ViewerMode } from "./viewer";

import { TSTextMarkerViewer } from "./viewer";

if (typeof customElements !== "undefined" && !customElements.get("ts-text-marker-viewer")) {
  customElements.define("ts-text-marker-viewer", TSTextMarkerViewer);
}

declare global {
  interface HTMLElementTagNameMap {
    "ts-text-marker-viewer": TSTextMarkerViewer;
  }
}
