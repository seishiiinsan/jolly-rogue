import { defineConfig } from 'vitest/config';

// `source` en tête, puis les conditions serveur par défaut de Vite.
const conditions = ['source', 'module', 'node', 'development|production'];

export default defineConfig({
  // `source` : les packages du workspace sont importés depuis leurs sources TS, sans build.
  resolve: { conditions },
  ssr: { resolve: { conditions } },
  test: {
    include: ['test/**/*.test.ts'],
    testTimeout: 60_000,
    hookTimeout: 60_000,
  },
});
