import 'server-only';

/**
 * src/pipeline/model-api.ts
 *
 * What: The single owning module for the model-provider dependency (the model-API seam).
 * Does: Will perform live generation behind one interface so the provider can be swapped
 *       with a blast radius of one module (dependency-isolation rule). Stub for now.
 * Use when: The pipeline needs to generate text. Call sites use this module, never the
 *           provider SDK directly.
 */

// ─── Types ───────────────────────────────────────────────────
export type ModelGenerationRequest = {
  readonly systemPrompt: string;
  readonly input: string;
};

// ─── Seam ────────────────────────────────────────────────────
/**
 * Generates text from the model provider for a given request.
 *
 * @param _request - The system prompt and input to generate from.
 * @returns The generated text.
 * @throws {Error} Always, until implemented — this is a scaffolding stub.
 */
export async function generateText(_request: ModelGenerationRequest): Promise<string> {
  throw new Error('model-api.generateText is not implemented yet (scaffolding stub).');
}
