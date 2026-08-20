import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react(), tailwindcss()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
    build: {
      target: 'esnext',
      cssCodeSplit: true,
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('leaflet')) {
                return 'leaflet-vendor';
              }
              if (id.includes('firebase')) {
                return 'firebase-vendor';
              }
              if (id.includes('html2canvas') || id.includes('jspdf') || id.includes('html2pdf')) {
                return 'pdf-vendor';
              }
              if (id.includes('motion')) {
                return 'motion-vendor';
              }
              if (id.includes('lucide-react')) {
                return 'lucide-vendor';
              }
              if (id.includes('react-hot-toast')) {
                return 'toast-vendor';
              }
              if (id.includes('react') || id.includes('react-dom') || id.includes('scheduler')) {
                return 'react-vendor';
              }
            }
          },
        },
      },
    },
  };
});
