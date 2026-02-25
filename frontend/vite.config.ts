/// <reference types="vitest/config" />
import path from "path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const backendUrl = process.env.VITE_BACKEND_URL || "http://localhost:8787";
const collabWsUrl = process.env.VITE_COLLAB_WS_URL || "ws://localhost:8788";

// https://vite.dev/config/
export default defineConfig({
  base: "/",
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    watch: {
      usePolling: !!process.env.VITE_USE_POLLING,
    },
    proxy: {
      "/api": {
        target: backendUrl,
        changeOrigin: true,
      },
      "/s/": {
        target: backendUrl,
      },
      "/auth": {
        target: backendUrl,
      },
      "/yjs": {
        target: collabWsUrl,
        ws: true,
        rewrite: (path) => path.replace(/^\/yjs/, ""),
      },
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    css: false,
    exclude: ["e2e/**", "node_modules/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov", "json-summary"],
      reportsDirectory: "./coverage",
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/test/**",
        "src/**/*.d.ts",
        "src/vite-env.d.ts",
        "src/main.tsx",
        "src/components/tiptap-icons/**",
        "src/components/tiptap-ui/**",
        "src/components/tiptap-ui-primitive/**",
        "src/components/tiptap-node/**",
        "src/components/tiptap-extension/**",
      ],
      thresholds: {
        statements: 70,
        branches: 60,
        functions: 70,
        lines: 70,
      },
    },
  },
});
