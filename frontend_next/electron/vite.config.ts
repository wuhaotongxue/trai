import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],

  root: ".",
  base: "./",

  build: {
    outDir: "dist/renderer",
    emptyOutDir: true,
  },

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@components": path.resolve(__dirname, "./src/components"),
      "@hooks": path.resolve(__dirname, "./src/hooks"),
      "@lib": path.resolve(__dirname, "./src/lib"),
      "@i18n": path.resolve(__dirname, "./src/i18n"),
    },
  },

  server: {
    port: 5173,
    strictPort: true,
  },

  // Optimize dependencies for Electron
  optimizeDeps: {
    exclude: ["electron"],
  },
});
