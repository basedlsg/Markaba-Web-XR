import { defineConfig } from 'vite';
import basicSsl from '@vitejs/plugin-basic-ssl';

export default defineConfig({
  plugins: [basicSsl()], // Auto-generates SSL cert for WebXR
  server: {
    https: true,
    port: 5173,
    host: true, // Expose to network for Quest 3 testing
  },
  build: {
    target: 'esnext',
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: {
          'babylon': ['@babylonjs/core', '@babylonjs/loaders'],
        },
      },
    },
  },
  optimizeDeps: {
    include: ['@babylonjs/core', '@babylonjs/loaders'],
  },
});
