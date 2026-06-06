/**
 * src/__tests__/contract/ingestion-record.test.ts
 *
 * What: Smoke test for the scaffolding.
 * Does: Confirms the test runner is wired and that an ingestion record's `sources` is
 *       always an array (the one structural invariant of the core contract).
 * Use when: Baseline green test for the scaffold; grows into real contract coverage later.
 */

import { describe, expect, it } from 'vitest';

import type { IngestionRecord } from '@/contract';

describe('ingestion record contract', () => {
  it('models sources as an array on a minimal record', () => {
    const record: IngestionRecord = { output: 'demo output', sources: [] };

    expect(Array.isArray(record.sources)).toBe(true);
    expect(record.output).toBe('demo output');
  });
});
