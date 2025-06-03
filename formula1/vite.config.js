import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import sitemap from 'vite-plugin-sitemap';

export default defineConfig({
  plugins: [
    react(),
    sitemap({
      hostname: 'https://formula1-statistics.vercel.app',
      routes: [
        '/',
        '/pratices',
        '/sprints',
        '/drivers',
        '/qualifying',
        '/contact',
        '/login',
        '/register',
        '/forgot',
      ],
      outDir: './dist', // Pasta de saída padrão do build
    }),
  ],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});
