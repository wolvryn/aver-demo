/**
 * src/__tests__/setup.ts
 *
 * What: Shared Vitest setup, loaded before every test file.
 * Does: Restores all mocks after each test so state never leaks between tests.
 * Use when: Always — registered via setupFiles in vitest.config.ts.
 */

import { afterEach, vi } from 'vitest';

afterEach(() => {
  vi.restoreAllMocks();
});
