/**
 * src/contract/index.ts
 *
 * What: Barrel for the public ingestion-record contract types.
 * Does: Re-exports the contract types so call sites import from `@/contract`.
 * Use when: Importing the ingestion-record types anywhere in the app.
 */

export type {
  IngestionRecord,
  SourceReference,
  IngestionTimestamps,
  EntityReference,
} from './ingestion-record';
