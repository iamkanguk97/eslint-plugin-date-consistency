import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/eslint-plugin-date-consistency/',
  build: {
    target: 'es2020',
    rollupOptions: {
      output: {
        // vite 8 uses rolldown, which requires manualChunks to be a function
        // (the object form is no longer supported). Preserves the original
        // vendor / monaco split.
        manualChunks(id) {
          if (id.includes('/node_modules/@monaco-editor/')) return 'monaco';
          if (id.includes('/node_modules/react') || id.includes('/node_modules/scheduler')) {
            return 'vendor';
          }
        },
      },
    },
  },
});
