/**
 * src/sentry.edge.config.ts
 *
 * What: Sentry initialization for the edge runtime.
 * Does: Initializes the Sentry SDK with the DSN from the server-only config module.
 *       No-ops when the DSN is unset (error tracking degrades gracefully).
 * Use when: Loaded by src/instrumentation.ts when the runtime is edge.
 */

import * as Sentry from '@sentry/nextjs';

import { getSentryDsn } from '@/lib/config/env';

const dsn = getSentryDsn();

if (dsn) {
  Sentry.init({
    dsn,
    tracesSampleRate: 1.0,
  });
}
