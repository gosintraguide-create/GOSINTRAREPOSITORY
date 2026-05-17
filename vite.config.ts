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
    // NOTE: We previously had a manualChunks function that split recharts/d3,
    // react-slick, @stripe, marked, and qrcode into separate chunks. That
    // caused a "Cannot access 'A' before initialization" temporal-dead-zone
    // error because recharts/d3 share internal modules with code that ended
    // up in vendor — creating a circular initialization between the chunks.
    // Vite's default code-splitting already lazy-loads these libs via the
    // React.lazy()'d pages that import them, so the manual override gave us
    // no real benefit at the cost of a broken build.
  },
})
