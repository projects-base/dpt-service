import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

/**
 * Builds straight into the service's static resources, so the study app ships
 * inside the same jar as the API it talks to.
 *
 * `base` matters: the assets are served from /prep/, not the domain root.
 * No SPA fallback rule is needed anywhere because the app uses HashRouter —
 * the server only ever sees /prep/index.html.
 */
export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: '/prep/',
  build: {
    outDir: '../src/main/resources/static/prep',
    emptyOutDir: true,
  },
  server: {
    port: 5180,
    // dev server talks to the locally running service
    proxy: { '/api': 'http://localhost:8080', '/actuator': 'http://localhost:8080' },
  },
})
