import { defineConfig } from "vitest/config";
import { resolve } from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@datenflix007/ts-text-marker-core": resolve(__dirname, "../TS_TextMarkerCore/src/index.ts"),
      "@datenflix/ts-text-marker-viewer": resolve(__dirname, "src/index.ts")
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
    emptyOutDir: false,
    lib: {
      entry: resolve(__dirname, "src/index.ts"),
      name: "TS_TextMarkerViewer",
      formats: ["es"],
      fileName: () => "ts-text-marker-viewer.js"
    },
    rollupOptions: {
      external: ["@datenflix007/ts-text-marker-core"]
    }
  }
});
