/**
 * src/lib/logger/index.ts
 *
 * What: Public entry point for the centralized logger module.
 * Does: Re-exports the logger and its types so callers import from '@/lib/logger'.
 * Use when: Any module needs to log — import { logger } from '@/lib/logger'.
 */

export { logger } from './logger';
export type { Logger, LogLevel } from './logger';
