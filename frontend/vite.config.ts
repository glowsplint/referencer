/// <reference types="vitest/config" />
import path from "path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// Environment variables — set in frontend/.env.local (not committed)
//
// VITE_BACKEND_URL       — Backend URL for dev proxy (dev only, default: http://localhost:8787)
// VITE_COLLAB_WS_URL     — WebSocket URL for dev proxy (dev only, default: ws://localhost:8788)
//                          At runtime, the client auto-detects from window.location (see src/lib/yjs/provider.ts)
// VITE_API_URL            — API base URL prepended to fetch paths (default: "", same origin)
//                          See src/lib/api-client.ts
// VITE_USE_POLLING        — Enable file polling in watch mode (dev only, default: false)

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
    projects: [
      {
        extends: true,
        test: {
          name: "node",
          environment: "node",
          include: [
            "src/lib/**/*.test.ts",
            "src/constants/**/*.test.ts",
            "src/hooks/recording/*.test.ts",
          ],
          exclude: [
            "src/lib/dom.test.ts",
            "src/lib/arrow/svg-helpers.test.ts",
            "src/lib/auth-client.test.ts",
            "src/lib/annotation/migrate-annotation.test.ts",
            "src/lib/tiptap/nearest-word.test.ts",
            "src/lib/tiptap/platform.test.ts",
            "src/lib/tiptap/upload.test.ts",
            "src/lib/yjs/__tests__/annotation-visibility.test.ts",
            "src/lib/yjs/__tests__/annotations-crud.test.ts",
            "src/hooks/recording/use-recording-manager.test.ts",
          ],
        },
      },
      {
        extends: true,
        test: {
          name: "jsdom",
          include: ["src/**/*.test.{ts,tsx}"],
          exclude: [
            "e2e/**",
            "node_modules/**",
            // Pure-logic files handled by the node project
            "src/lib/**/*.test.ts",
            "src/constants/**/*.test.ts",
            "src/hooks/recording/*.test.ts",
          ],
        },
      },
      {
        extends: true,
        test: {
          name: "jsdom-lib",
          include: [
            "src/lib/dom.test.ts",
            "src/lib/arrow/svg-helpers.test.ts",
            "src/lib/auth-client.test.ts",
            "src/lib/annotation/migrate-annotation.test.ts",
            "src/lib/tiptap/nearest-word.test.ts",
            "src/lib/tiptap/platform.test.ts",
            "src/lib/tiptap/upload.test.ts",
            "src/lib/yjs/__tests__/annotation-visibility.test.ts",
            "src/lib/yjs/__tests__/annotations-crud.test.ts",
            "src/hooks/recording/use-recording-manager.test.ts",
          ],
        },
      },
    ],
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
        "src/tiptap-icons/**",
        "src/tiptap-ui/**",
        "src/tiptap-ui-primitive/**",
        "src/tiptap-node/**",
        "src/tiptap-extension/**",
      ],
      thresholds: {
        statements: 45,
        branches: 40,
        functions: 45,
        lines: 45,
      },
    },
  },
});
