import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// On GitHub Pages the app is served from https://<user>.github.io/siteforce/,
// so production builds need that base path. Local dev stays at root.
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/siteforce/' : '/',
  plugins: [react(), tailwindcss()],
  server: {
    host: true,
    port: 5173,
  },
}))
