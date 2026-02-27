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
    pool: "threads",
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
