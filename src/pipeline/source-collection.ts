import 'server-only';

/**
 * src/pipeline/source-collection.ts
 *
 * What: The single owning module for the source-collection API (the source seam).
 * Does: Will collect the source material the pipeline grounds its output in, behind one
 *       interface so the source API can be swapped with a blast radius of one module. Stub.
 * Use when: The pipeline needs source material. Call sites use this module, never the
 *           source-API SDK directly.
 */

// ─── Types ───────────────────────────────────────────────────
export type CollectedSource = {
  readonly id: string;
  readonly content: string;
  /** ISO 8601 time the source was current. */
  readonly asOf: string;
};

// ─── Seam ────────────────────────────────────────────────────
/**
 * Collects source material for a given query.
 *
 * @param _query - The query describing what to collect.
 * @returns The collected sources (always an array, possibly empty).
 * @throws {Error} Always, until implemented — this is a scaffolding stub.
 */
export async function collectSources(_query: string): Promise<readonly CollectedSource[]> {
  throw new Error('source-collection.collectSources is not implemented yet (scaffolding stub).');
}
