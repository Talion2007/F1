// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import sitemap from 'vite-plugin-sitemap';

console.log('Vite config carregado! Verificando plugin sitemap...'); // ADICIONE ESTA LINHA

export default defineConfig({
  plugins: [
    react(),
    sitemap({
      hostname: 'https://formula1-statistics.vercel.app/',
      routes: [
        '/',
        '/pratices',
        '/sprints',
        '/drivers',
        '/contact',
        '/login',
        '/register',
        '/forgot',
      ],
    }),
  ],
});