import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    // vueDevTools(),
  ],
    server: {
    proxy: {
      // Semua request ke /gsheet-api akan diproxy ke Apps Script
      '/gsheet-api': {
        target: 'https://script.google.com',
        changeOrigin: true,
        secure: true,
        rewrite: (path) =>
          path.replace(
            /^\/gsheet-api/,
            '/macros/s/AKfycbzKJr003Ws5vzFTHjCXZaU5j0DNpcRCpmiYN-4nTlr7T8e9LatBhrxfTVpIN93DWPCC/exec'
          ),
      },
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
})
