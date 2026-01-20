import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import { copyFileSync, existsSync } from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  plugins: [
    react(), 
    tailwindcss(),
    {
      name: 'copy-sitemap',
      closeBundle() {
        const sourcePath = resolve(__dirname, 'public/sitemap.xml');
        const destPath = resolve(__dirname, 'dist/sitemap.xml');
        if (existsSync(sourcePath)) {
          copyFileSync(sourcePath, destPath);
          console.log('✅ Sitemap copied to dist/sitemap.xml');
        }
      }
    }
  ],
  publicDir: "public", // Ensure public folder is copied to build output (includes sitemap.xml)
  base: "/", // Ensure base path is set correctly for deployment
  resolve: {
    alias: {
      "@": resolve(__dirname, "./"),
    },
  },
  build: {
    outDir: "dist",
    sourcemap: false,
    minify: "terser",
    terserOptions: {
      compress: {
        drop_console: false, // Keep console logs for debugging
        drop_debugger: true,
        passes: 2, // Multiple passes for better compression
        pure_funcs: ['console.log'], // Remove console.log in production
      },
      mangle: {
        safari10: true, // Handle Safari 10 issues
      },
    },
    cssMinify: true,
    cssCodeSplit: true, // Split CSS into separate chunks
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
        chunkFileNames: "assets/[name]-[hash].js",
        entryFileNames: "assets/[name]-[hash].js",
        assetFileNames: (assetInfo) => {
          // Don't hash these important files - keep original names
          const keepOriginalName = [
            'sitemap.xml',
            'robots.txt',
            'manifest.json',
            '404.html',
            'offline.html',
            'sw.js'
          ];
          
          if (assetInfo.name && keepOriginalName.some(name => assetInfo.name?.includes(name))) {
            return '[name].[ext]';
          }
          
          // Hash everything else
          return 'assets/[name]-[hash].[ext]';
        },
      },
    },
    chunkSizeWarningLimit: 1000,
    reportCompressedSize: false, // Faster builds
    // Enable modern browser optimizations
    target: 'es2020',
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