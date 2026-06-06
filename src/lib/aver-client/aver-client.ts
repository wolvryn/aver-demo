import 'server-only';

/**
 * src/lib/aver-client/aver-client.ts
 *
 * What: The single server-side client to the Aver service — the only module permitted to
 *       talk to Aver (CLAUDE.md → module boundaries; ADR-002).
 * Does: Will POST an ingestion record to the deployed Aver service over HTTP and return the
 *       verdicts. Owns the HTTP dependency seam. Contains no detection logic. Stub for now.
 * Use when: The dual-pane UI needs an Aver verdict for a record. Never call Aver elsewhere,
 *           and never from the browser — the endpoint and token are server-only.
 */

import type { IngestionRecord } from '@/contract';

// ─── Types ───────────────────────────────────────────────────
/** Three-state per-fault result (CLAUDE.md invariant 7). */
export type FaultCheckState = 'clean' | 'fault-found' | 'cannot-assess';

export type FaultCheckResult = {
  /** The fault class checked (e.g. 'ungrounded-fabrication'). */
  readonly check: string;
  readonly state: FaultCheckState;
  /** Present only when state is 'cannot-assess': the missing enrichment signal. */
  readonly missingSignal?: string;
};

export type AverVerdict = {
  readonly runId: string;
  readonly results: readonly FaultCheckResult[];
};

// ─── Client ──────────────────────────────────────────────────
/**
 * Assesses an ingestion record by calling the Aver service.
 *
 * @param _record - The ingestion record to assess. The answer key is never included.
 * @returns Aver's verdict — a three-state result per fault check.
 * @throws {Error} Always, until implemented — this is a scaffolding stub.
 */
export async function assess(_record: IngestionRecord): Promise<AverVerdict> {
  throw new Error('aver-client.assess is not implemented yet (scaffolding stub).');
}
