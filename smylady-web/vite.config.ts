import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

export default defineConfig({
  plugins: [react()],
  base: '/',  // Für Upload ins Root-Verzeichnis
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5173,
    host: true,
  },
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom') || id.includes('node_modules/react-router-dom')) {
            return 'vendor-react'
          }
          if (id.includes('node_modules/@tanstack')) {
            return 'vendor-query'
          }
          if (id.includes('node_modules/@stripe')) {
            return 'vendor-stripe'
          }
          if (id.includes('node_modules/@radix-ui')) {
            return 'vendor-ui'
          }
          if (id.includes('node_modules/heic2any')) {
            return 'vendor-heic2any'
          }
          if (id.includes('node_modules/socket.io')) {
            return 'vendor-socket'
          }
          if (id.includes('node_modules/i18next') || id.includes('node_modules/react-i18next')) {
            return 'vendor-i18n'
          }
          if (id.includes('node_modules/date-fns')) {
            return 'vendor-date'
          }
          if (id.includes('node_modules/lucide-react')) {
            return 'vendor-icons'
          }
        },
      }
    }
  }
})
