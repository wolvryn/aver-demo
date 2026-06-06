/**
 * vitest.config.ts
 *
 * What: Vitest test-runner configuration for aver-demo.
 * Does: Resolves the `@/*` path alias, registers the React plugin, and loads the
 *       shared setup file so every test gets mock cleanup via afterEach.
 * Use when: Running `npm test`; tests live under src/__tests__/ mirroring source paths.
 */

import { fileURLToPath } from 'node:url';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    setupFiles: ['./src/__tests__/setup.ts'],
    include: ['src/__tests__/**/*.test.{ts,tsx}'],
  },
});
