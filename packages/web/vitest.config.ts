import { defineConfig } from 'vitest/config';

const conditions = ['source', 'module', 'node', 'development|production'];

export default defineConfig({
  resolve: { conditions },
  ssr: { resolve: { conditions } },
  test: { include: ['test/**/*.test.ts'] },
});
