import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/eslint-plugin-date-consistency/',
  resolve: {
    alias: {
      // eslint requires esquery and calls its API directly (esquery.matches),
      // but esquery's "module" build wraps the API in a default export, so
      // bundler interop hands eslint a namespace object without .matches and
      // linting throws at runtime. Point the bundler at the UMD build, which
      // exposes the API directly.
      esquery: 'esquery/dist/esquery.min.js',
    },
  },
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
          // eslint/universal and its parser stack (espree → acorn) are the
          // largest non-monaco dependency; keep them out of the app chunk.
          // Packages are matched with a trailing slash so the prefix cannot
          // swallow unrelated eslint-* packages (e.g. this plugin itself,
          // when it is resolved through node_modules rather than a symlink).
          if (
            id.includes('/node_modules/eslint/') ||
            id.includes('/node_modules/@eslint/') ||
            id.includes('/node_modules/eslint-scope/') ||
            id.includes('/node_modules/eslint-visitor-keys/') ||
            id.includes('/node_modules/espree/') ||
            id.includes('/node_modules/acorn') // acorn + acorn-jsx
          ) {
            return 'eslint';
          }
        },
      },
    },
  },
});
