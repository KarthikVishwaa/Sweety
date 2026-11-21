import { fileURLToPath } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const VENDOR_CHUNKS: Record<string, string[]> = {
  'vendor-react': ['react', 'react-dom', 'react-router', 'react-router-dom', 'scheduler'],
  'vendor-motion': ['motion', 'motion-dom', 'motion-utils', 'framer-motion'],
  'vendor-data': ['@tanstack/query-core', '@tanstack/react-query', 'axios', 'zod'],
};

function vendorChunk(id: string): string | undefined {
  const match = /node_modules\/((?:@[^/]+\/)?[^/]+)/.exec(id.replaceAll('\\', '/'));
  const packageName = match?.[1];
  return Object.entries(VENDOR_CHUNKS).find(([, packages]) =>
    packages.includes(packageName ?? ''),
  )?.[0];
}

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  build: {
    rollupOptions: { output: { manualChunks: vendorChunk } },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': { target: 'http://127.0.0.1:4000', changeOrigin: true },
    },
  },
});
