import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'url';

const stub = (path: string) => fileURLToPath(new URL(path, import.meta.url));
const EMPTY = stub('./src/stubs/empty.ts');
const URL_STUB = stub('./src/stubs/url.ts');

export default defineConfig({
  plugins: [react()],
  base: '/eslint-plugin-date-consistency/',
  define: {
    'process.env': '{}',
    'process.platform': '"browser"',
    'process.version': '"v20.0.0"',
    global: 'globalThis',
  },
  resolve: {
    alias: [
      // Order matters: more specific paths must come before general ones.
      { find: 'node:fs/promises', replacement: EMPTY },
      { find: 'node:fs',          replacement: EMPTY },
      { find: 'fs/promises',      replacement: EMPTY },
      { find: 'fs',               replacement: EMPTY },
      { find: 'node:path',        replacement: 'path-browserify' },
      { find: 'path',             replacement: 'path-browserify' },
      { find: 'node:os',           replacement: EMPTY },
      { find: 'os',               replacement: EMPTY },
      { find: 'node:url',         replacement: URL_STUB },
      { find: 'url',              replacement: URL_STUB },
      { find: 'node:worker_threads', replacement: EMPTY },
      { find: 'worker_threads',   replacement: EMPTY },
      { find: 'node:module',      replacement: EMPTY },
      { find: 'module',           replacement: EMPTY },
      { find: 'node:assert',      replacement: EMPTY },
      { find: 'assert',           replacement: EMPTY },
      { find: 'node:util',        replacement: EMPTY },
      { find: 'util',             replacement: EMPTY },
      { find: 'node:crypto',      replacement: EMPTY },
      { find: 'crypto',           replacement: EMPTY },
    ],
  },
  build: {
    target: 'es2020',
    chunkSizeWarningLimit: 2000,
    commonjsOptions: {
      transformMixedEsModules: true,
    },
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          monaco: ['@monaco-editor/react'],
          eslint: ['eslint', 'eslint-plugin-date-consistency'],
        },
      },
    },
  },
  optimizeDeps: {
    esbuildOptions: {
      define: { global: 'globalThis' },
    },
  },
});
