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

/**
 * Hard ceiling on one analysis call. Bounds the request and the user's wait.
 *
 * Measured: a 1,958-character sample took ~42s at medium effort, and ~95s after the reuse
 * rules were tightened, because the model reasons per proposal. A 90,000-character transcript
 * is the case this has to hold, so the budget is 240s. Most of the time goes to reasoning, not
 * reading the input, so the larger cap did not move it. Vercel's function ceiling is 300s,
 * which this stays inside.
 *
 * The failure is handled either way, but timing out a valid call is a bad default: the user
 * waits the full budget and learns nothing, where the length cap would have told them at once.
 */
export const LLM_TIMEOUT_MS = Number(process.env.LLM_TIMEOUT_MS ?? 240_000);

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

/**
 * Spend guard for the public deployment. Defaults are sized for a demo: a reviewer can run
 * several analyses back to back, and the worst case for the day is bounded at
 * DAILY_MAX * the cost of one analysis.
 *
 * That unit cost is no longer ~$0.09. With the input cap at 90,000 characters a full-length
 * transcript is roughly 27,000 input tokens, so one analysis runs $0.25-0.30 and the
 * worst-case day at the default cap is around $15, not $4.50. Lower RATE_LIMIT_DAILY_MAX if
 * that ceiling is too high for the deployment; raise these with env vars, never by editing
 * this file in a hurry.
 */
export const RATE_LIMIT = {
  perIpMax: Number(process.env.RATE_LIMIT_PER_IP_MAX ?? 5),
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS ?? 600_000),
  dailyMax: Number(process.env.RATE_LIMIT_DAILY_MAX ?? 50),
};

export { MAX_NOTES_CHARS, MIN_NOTES_CHARS } from "./limits";

export function estimateUsd(inputTokens: number, outputTokens: number): number {
  return (
    (inputTokens / 1_000_000) * PRICE_PER_MTOK.input +
    (outputTokens / 1_000_000) * PRICE_PER_MTOK.output
  );
}

export function hasApiKey(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}
