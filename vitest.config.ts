import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['data/**/*.test.ts', 'back/**/*.test.ts'],
    environment: 'node',
    reporters: ['default'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['data/generators/**/*.ts', 'back/src/**/*.ts'],
      exclude: ['**/*.test.ts', '**/types.ts'],
    },
  },
});
