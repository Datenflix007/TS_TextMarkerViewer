import { defineConfig } from "vite";
import { resolve } from "node:path";

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, "src/index.ts"),
      name: "TS_TextMarkerViewer",
      formats: ["es"],
      fileName: () => "ts-text-marker-viewer.js"
    }
  }
});
