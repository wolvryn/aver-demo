import 'server-only';

/**
 * src/pipeline/pipeline.ts
 *
 * What: The Aver-unaware two-lane pipeline (clean lane + fault-injected lane).
 * Does: Will collect sources, run live generation, and emit a normalized ingestion record
 *       per output. It knows nothing of Aver (CLAUDE.md invariant 1) — it may import only
 *       the public contract types and its own model/source seams. Stub for now.
 * Use when: The dual-pane UI drives a pipeline run. The pipeline never calls Aver itself.
 */

import type { IngestionRecord } from '@/contract';

// ─── Types ───────────────────────────────────────────────────
/** Which lane to run: the clean lane or the fault-injected lane. */
export type PipelineLane = 'clean' | 'fault-injected';

/** Fault-injection mode (ADR-001 invariant 5). */
export type InjectionMode = 'single' | 'all' | 'random';

// ─── Pipeline ────────────────────────────────────────────────
/**
 * Runs one lane of the pipeline and emits its ingestion record.
 *
 * @param _lane - The lane to run.
 * @param _injection - The fault-injection mode for the fault-injected lane.
 * @returns The emitted ingestion record.
 * @throws {Error} Always, until implemented — this is a scaffolding stub.
 */
export async function runLane(
  _lane: PipelineLane,
  _injection: InjectionMode
): Promise<IngestionRecord> {
  throw new Error('pipeline.runLane is not implemented yet (scaffolding stub).');
}
