/**
 * src/instrumentation.ts
 *
 * What: Next.js instrumentation hook for server/edge error tracking.
 * Does: Loads the matching Sentry config for the active runtime and exposes Sentry's
 *       request-error capture hook.
 * Use when: Framework entry — Next.js calls register() once per server runtime at startup.
 */

import * as Sentry from '@sentry/nextjs';

/**
 * Registers runtime instrumentation by loading the matching Sentry config.
 *
 * @returns Resolves once the runtime's Sentry config has loaded.
 * @throws {never}
 */
export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config');
  }
  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config');
  }
}

export const onRequestError = Sentry.captureRequestError;
