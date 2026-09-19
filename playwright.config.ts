import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  testMatch: "**/*.spec.ts",
  timeout: 30_000,
  expect: {
    timeout: 8_000
  },
  webServer: {
    command: "npm run dev -- --port 4173",
    url: "http://127.0.0.1:4173/demo/",
    reuseExistingServer: true,
    timeout: 30_000
  },
  use: {
    baseURL: "http://127.0.0.1:4173",
    trace: "retain-on-failure"
  },
  projects: [
    {
      name: "edge",
      use: {
        channel: "msedge",
        viewport: { width: 1366, height: 920 }
      }
    }
  ]
});
