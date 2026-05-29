import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath } from 'node:url';

// `server.fs.allow` opens the parent so the dashboard can import the
// committed measurement JSON from data/measurements/output/...
// directly. When the back/ Express API ships, this becomes a fetch
// against /api/measurements/... and this allow-list shrinks back.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    fs: {
      allow: [fileURLToPath(new URL('..', import.meta.url))],
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});
