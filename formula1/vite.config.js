// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import sitemap from 'vite-plugin-sitemap'; // Importe o plugin

export default defineConfig({
  plugins: [
    react(),
    sitemap({
      hostname: 'https://formula1-statistics.vercel.app/', // O domínio principal do seu site
      routes: [
        '/', // Sua página inicial
        '/pratices',
        '/sprints',
        '/drivers',
        '/qualifying', // Adicionado!
        '/contact',
        '/login',
        '/register',
        '/forgot',
      ],
      outDir: './dist', // Garante que o sitemap seja salvo na pasta 'dist'
    }),
  ],
  // Adicione esta seção build para garantir a pasta de saída padrão
  build: {
    outDir: 'dist',
    emptyOutDir: true // Limpa a pasta dist antes de cada build
  }
});