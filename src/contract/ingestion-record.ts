/**
 * src/contract/ingestion-record.ts
 *
 * What: The canonical ingestion-record TypeScript types — Aver's public front-door contract.
 * Does: Declares the normalized record the pipeline emits per output (the "minimum Aver
 *       needs"). Types only; no logic. Public-safe by design (ADR-002).
 * Use when: Producing or consuming an ingestion record. The shape is owned by ADR-001 and
 *           CLAUDE.md → "The ingestion record"; do not change it without an ADR.
 */

// ─── Core ────────────────────────────────────────────────────
/**
 * A single source the output is grounded in. `sources` is always a set (an array),
 * never a single value — cross-source contradiction needs at least two.
 */
export type SourceReference = {
  readonly id: string;
  readonly title?: string;
  readonly url?: string;
};

// ─── Enrichment (each slot enables exactly one fault check) ──
/**
 * Source as-of time and output produced-at time. Enables the stale-data
 * roll-forward check. Absence yields a `cannot-assess` finding, never a silent skip.
 */
export type IngestionTimestamps = {
  /** When the source material was current (ISO 8601). */
  readonly sourceAsOf: string;
  /** When the pipeline produced the output (ISO 8601). */
  readonly outputProducedAt: string;
};

/**
 * An entity referenced by the output. Enables the entity attribute-bleed check.
 */
export type EntityReference = {
  readonly id: string;
  readonly type?: string;
  readonly label?: string;
};

// ─── Record ──────────────────────────────────────────────────
/**
 * The normalized record emitted per output and sent to the Aver service.
 * Core fields are always present; enrichment fields are optional and, when absent,
 * resolve their dependent check to `cannot-assess` (CLAUDE.md invariant 7).
 */
export type IngestionRecord = {
  /** The agent-produced output under assessment. */
  readonly output: string;
  /** The sources the output is grounded in — always an array. */
  readonly sources: readonly SourceReference[];
  /** Source/output timing enrichment (stale-data roll-forward check). */
  readonly timestamps?: IngestionTimestamps;
  /** Entities referenced by the output (attribute-bleed check). */
  readonly entityRefs?: readonly EntityReference[];
  /** Correlates and groups records for one pipeline run. */
  readonly runId?: string;
};
