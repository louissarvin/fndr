import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { nodePolyfills } from "vite-plugin-node-polyfills";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    nodePolyfills({
      include: ["buffer", "process", "util", "stream", "crypto"],
      globals: {
        Buffer: true,
        global: true,
        process: true,
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  worker: {
    format: "es",
  },
  optimizeDeps: {
    exclude: ["@zkpassport/sdk"],
    include: [
      "@zkpassport/sdk > debug",
      "@zkpassport/sdk > buffer",
      "@zkpassport/sdk > process",
      "@zkpassport/sdk > util",
      "@zkpassport/sdk > stream-browserify",
      "@zkpassport/sdk > i18n-iso-countries",
      "@zkpassport/sdk > pino",
    ],
    esbuildOptions: {
      target: "esnext",
    },
  },
}));
