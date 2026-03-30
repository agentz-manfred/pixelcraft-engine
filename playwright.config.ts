import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "tests/visual",
  use: {
    baseURL: "http://localhost:3333",
    screenshot: "only-on-failure",
  },
  webServer: {
    command: "npx vite serve playground --port 3333 --strictPort",
    port: 3333,
    reuseExistingServer: true,
    timeout: 15000,
  },
  snapshotPathTemplate: "tests/visual/fixtures/{arg}{ext}",
  expect: {
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.01,
    },
  },
});
