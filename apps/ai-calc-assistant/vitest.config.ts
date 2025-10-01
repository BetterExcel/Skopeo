import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['tests/**/*.{test,spec}.ts'],
    deps: { moduleDirectories: ['node_modules'] },
    setupFiles: [],
    typecheck: {
      tsconfig: './tsconfig.vitest.json'
    },
    coverage: {
      reporter: ['text', 'html'],
    },
  },
});
