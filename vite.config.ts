import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({mode}) => ({
  plugins: [react()],
  base: mode === 'pages' ? '/ai-song-cover/' : '/',
  publicDir: mode === 'pages' ? false : 'public',
  build: {outDir: mode === 'pages' ? 'dist-pages' : 'dist'},
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://127.0.0.1:3333',
      '/outputs': 'http://127.0.0.1:3333'
    }
  }
}));
