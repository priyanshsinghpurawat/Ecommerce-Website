import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.js'],
    testTimeout: 30000,
    hookTimeout: 30000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['utils/**', 'services/**', 'repositories/**', 'middleware/**', 'validators/**'],
      thresholds: {
        lines: 50,
        functions: 40,
        branches: 40,
        statements: 50
      }
    }
  }
});
