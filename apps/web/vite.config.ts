import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'


function figmaAssetResolver() {
  return {
    name: 'figma-asset-resolver',
    resolveId(id) {
      if (id.startsWith('figma:asset/')) {
        const filename = id.replace('figma:asset/', '')
        return path.resolve(__dirname, 'src/assets', filename)
      }
    },
  }
}

export default defineConfig({
  plugins: [
    figmaAssetResolver(),
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src/app'),
    },
  },
  build: {
    // Target modern browsers — removes ~60kb of legacy polyfill transpilation
    target: 'ES2020',
    cssMinify: true,
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Bundle ALL lucide-react icon modules into a single chunk.
          // Without this, Vite emits ~40 separate 0.3–0.8 KB icon files,
          // each requiring its own HTTP round-trip (~750 ms overhead × 40 = 30 s).
          // lucide-react has no circular deps so this is safe.
          if (id.includes('/node_modules/lucide-react/')) return 'icons';
        },
      },
    },
  },
})
