/**
 * src/instrumentation-client.ts
 *
 * What: Sentry initialization for the browser.
 * Does: Initializes the Sentry SDK with the public DSN from the client-safe config module.
 *       No-ops when the DSN is unset. The browser never sees a server secret or the Aver
 *       endpoint — only the public Sentry DSN.
 * Use when: Framework entry — Next.js loads this on the client at startup.
 */

import * as Sentry from '@sentry/nextjs';

import { getPublicSentryDsn } from '@/lib/config/public-env';

const dsn = getPublicSentryDsn();

if (dsn) {
  Sentry.init({
    dsn,
    tracesSampleRate: 1.0,
  });
}
