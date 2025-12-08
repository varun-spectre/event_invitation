import { defineConfig } from 'vite';

export default defineConfig({
  base: '/event_invitation/', // MUST match your GitHub repo name exactly
  build: {
    chunkSizeWarningLimit: 1600, // Suppresses warnings about large 3D model files
  },
});