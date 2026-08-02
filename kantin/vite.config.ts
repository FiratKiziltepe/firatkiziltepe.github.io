import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/kantin/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['icon.svg'],
      manifest: {
        name: 'Kantin Defteri',
        short_name: 'Kantin',
        description: 'Şeffaf tüketim ve haftalık kantin hesabı takibi',
        id: '/kantin/',
        start_url: '/kantin/',
        scope: '/kantin/',
        display: 'standalone',
        background_color: '#f4f6f3',
        theme_color: '#123b3a',
        lang: 'tr',
        icons: [{ src: '/kantin/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' }],
      },
      workbox: {
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
        globPatterns: ['**/*.{html,js,css,svg,webmanifest}'],
      },
    }),
  ],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
})
