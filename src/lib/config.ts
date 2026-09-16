/**
 * Every tunable in one place. Nothing here is a secret; the API key is read from the
 * environment at call time and never logged or returned.
 */

/**
 * Model used for the analysis. Overridable so switching models is an env change, not a
 * code change. Prices below must be updated alongside it.
 */
export const MODEL = process.env.ANTHROPIC_MODEL ?? "claude-opus-5";

/**
 * USD per million tokens, from the published price list for the default model
 * (https://www.anthropic.com/pricing). Used only for the estimate shown in the UI.
 */
export const PRICE_PER_MTOK = {
  input: Number(process.env.PRICE_INPUT_PER_MTOK ?? 5),
  output: Number(process.env.PRICE_OUTPUT_PER_MTOK ?? 25),
};

/** Hard ceiling on one analysis call. Bounds the request and the user's wait. */
export const LLM_TIMEOUT_MS = Number(process.env.LLM_TIMEOUT_MS ?? 60_000);

/**
 * Thinking depth. The task is extraction plus matching over a short context, which does not
 * need the top of the range; raising this costs latency more than it buys accuracy here.
 */
export const LLM_EFFORT = (process.env.LLM_EFFORT ?? "medium") as
  | "low"
  | "medium"
  | "high"
  | "xhigh"
  | "max";

/** Enough room for the brief plus the model's thinking. */
export const MAX_OUTPUT_TOKENS = 16_000;

/** Below this there is nothing to analyze. */
export const MIN_NOTES_CHARS = 50;

/**
 * Roughly a 30-40 minute call. Past this the right answer is chunking, which is a later
 * change, not silently truncating the user's transcript.
 */
export const MAX_NOTES_CHARS = 20_000;

export function estimateUsd(inputTokens: number, outputTokens: number): number {
  return (
    (inputTokens / 1_000_000) * PRICE_PER_MTOK.input +
    (outputTokens / 1_000_000) * PRICE_PER_MTOK.output
  );
}

export function hasApiKey(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}
