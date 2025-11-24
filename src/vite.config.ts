import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  plugins: [react(), tailwindcss()],
  publicDir: "public", // Ensure public folder is copied to build output
  resolve: {
    alias: {
      "@": resolve(__dirname, "./"),
    },
  },
  build: {
    outDir: "build",
    sourcemap: false, // Disable sourcemaps in production for smaller bundle
    minify: "terser",
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.logs in production
        drop_debugger: true,
      },
    },
    rollupOptions: {
      output: {
        manualChunks: {
          "react-vendor": ["react", "react-dom"],
          "ui-vendor": ["lucide-react", "recharts"],
          "radix-vendor": [
            "@radix-ui/react-accordion",
            "@radix-ui/react-alert-dialog",
            "@radix-ui/react-dialog",
            "@radix-ui/react-dropdown-menu",
            "@radix-ui/react-popover",
            "@radix-ui/react-select",
            "@radix-ui/react-tabs",
            "@radix-ui/react-tooltip",
          ],
          "form-vendor": ["react-hook-form", "zod"],
          "stripe-vendor": ["@stripe/stripe-js"],
        },
        // Optimize chunk file names
        chunkFileNames: "assets/[name]-[hash].js",
        entryFileNames: "assets/[name]-[hash].js",
        assetFileNames: (assetInfo) => {
          // Keep service worker at root level without hash
          if (assetInfo.name === "sw.js") {
            return "sw.js";
          }
          return "assets/[name]-[hash].[ext]";
        },
      },
    },
    // Increase chunk size warning limit
    chunkSizeWarningLimit: 1000,
  },
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "lucide-react",
      "@stripe/stripe-js",
    ],
  },
  server: {
    port: 5173,
    open: true,
  },
  preview: {
    port: 4173,
  },
});