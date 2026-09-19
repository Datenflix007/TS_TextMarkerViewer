import { defineConfig } from "vitest/config";
import { resolve } from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@datenflix/ts-text-marker-viewer": resolve(__dirname, "src/index.ts"),
      "@datenflix/ts-text-marker-core": resolve(__dirname, "src/core/index.ts")
    }
  },
  test: {
    environment: "jsdom",
    exclude: [
      "**/node_modules/**",
      "**/dist/**",
      "tests/screenshots.spec.ts"
    ]
  },
  build: {
    lib: {
      entry: resolve(__dirname, "src/index.ts"),
      name: "TS_TextMarkerViewer",
      formats: ["es"],
      fileName: () => "ts-text-marker-viewer.js"
    }
  }
});
