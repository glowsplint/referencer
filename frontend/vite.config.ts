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
    pool: "forks",
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
        "src/types/**",
        "src/i18n/**",
        "src/data/**",
        "src/**/index.ts",
        "src/components/tiptap-templates/**",
        "src/lib/tiptap/nodes.ts",
        "src/lib/tiptap/schema.ts",
        "src/lib/tiptap/extensions/**",
        "src/lib/tiptap/selection.ts",
        "src/components/CollaborationPresence.tsx",
        "src/components/SelectionRingOverlay.tsx",
        "src/components/MiniCommentEditor.tsx",
        "src/hooks/ui/use-tiptap-editor.ts",
        "src/hooks/ui/use-spotlight-rect.ts",
        "src/hooks/utilities/use-element-rect.ts",
        "src/hooks/annotations/use-layer-underline-decorations.ts",
        "src/hooks/annotations/use-editor-arrows.ts",
        "src/components/recording/RecordingStepBrowser.tsx",
        "src/components/recording/RecordingListItem.tsx",
        "src/lib/yjs/provider.ts",
        "src/hooks/data/use-auth.ts",
        "src/hooks/data/use-yjs.ts",
        "src/hooks/data/use-yjs-offline.ts",
        "src/lib/tiptap-utils.ts",
        "src/components/arrow-overlay/types.ts",
        "src/hooks/recording/use-playback.ts",
        "src/hooks/recording/use-recordings.ts",
        "src/hooks/selection/use-selection-decoration.ts",
      ],
      thresholds: {
        statements: 80,
        branches: 75,
        functions: 80,
        lines: 80,
      },
    },
  },
});
