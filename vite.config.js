import { defineConfig } from 'vite';

export default defineConfig({
  // This line is the most important part!
  base: '/event_invitation/', 
  build: {
    chunkSizeWarningLimit: 1600,
  },
});