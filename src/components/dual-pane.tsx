/**
 * src/components/dual-pane.tsx
 *
 * What: The dual-pane UI shell — pipeline output on one side, Aver's verdict on the other.
 * Does: Renders the split view and is the only orchestrator permitted to drive both the
 *       pipeline and the Aver client (CLAUDE.md invariant 3). Placeholder shell for now;
 *       it does not yet wire either side.
 * Use when: Rendering the demo's hero view. Orchestration runs server-side (the pipeline and
 *       Aver client are server-only); this stays a server component until that wiring lands.
 */

import type { ReactNode } from 'react';

// ─── Component ───────────────────────────────────────────────
/**
 * Renders the two-pane demo shell.
 *
 * @returns The split-view layout placeholder.
 * @throws {never}
 */
export function DualPane(): ReactNode {
  return (
    <section aria-label="Aver demo" className="dual-pane">
      <article aria-label="Pipeline output" className="dual-pane__lane">
        <h2>Pipeline output</h2>
        <p>The live agent pipeline output will render here.</p>
      </article>
      <article aria-label="Aver verdict" className="dual-pane__lane">
        <h2>Aver verdict</h2>
        <p>Aver&rsquo;s per-fault verdict will render here.</p>
      </article>
    </section>
  );
}
