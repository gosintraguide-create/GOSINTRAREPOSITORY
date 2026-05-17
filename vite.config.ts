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
        // Split heavy libs into their own chunks so they only load on the
        // pages that actually use them, not on every page load.
        manualChunks(id: string) {
          // Charts — only DriverDashboard
          if (id.includes('recharts') || id.includes('/d3-')) return 'chunk-charts';
          // Slider — only AttractionDetailPage
          if (id.includes('react-slick') || id.includes('slick-carousel')) return 'chunk-slick';
          // Payments — only BuyTicketPage
          if (id.includes('@stripe/')) return 'chunk-stripe';
          // Markdown — only blog pages
          if (id.includes('/marked/') || id.includes('/marked@')) return 'chunk-markdown';
          // QR code — only driver portal
          if (id.includes('qrcode')) return 'chunk-qrcode';
          // All other node_modules → shared vendor chunk
          if (id.includes('node_modules')) return 'vendor';
        },
      },
    },
  },
})
