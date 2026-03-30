import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  build: {
    lib: {
      entry: {
        "pixelcraft-engine": resolve(__dirname, "src/index.ts"),
        react: resolve(__dirname, "src/react/index.tsx"),
      },
      formats: ["es", "cjs"],
    },
    rollupOptions: {
      external: ["react", "react-dom", "react/jsx-runtime"],
    },
    sourcemap: true,
  },
});
