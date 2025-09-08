import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // Hacer que las variables de entorno estén disponibles en tiempo de build
    __API_URL__: JSON.stringify(process.env.VITE_API_URL),
  },
  server: {
    host: '0.0.0.0', // Permite acceso externo
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
      }
    }
  },
  preview: {
    host: true,
    port: 4173,
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
        },
      },
    },
  },
  base: './', // Usar rutas relativas en lugar de absolutas
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
