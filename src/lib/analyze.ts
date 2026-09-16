import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import {
  LLM_EFFORT,
  LLM_TIMEOUT_MS,
  MAX_OUTPUT_TOKENS,
  MODEL,
  estimateUsd,
  hasApiKey,
} from "./config";
import { PORTFOLIO_IDS, findProject, renderPortfolioForPrompt } from "./portfolio";
import {
  type AnalyzeSuccess,
  type Brief,
  BriefSchema,
  type ErrorCategory,
} from "./schema";

/**
 * A failure the user is allowed to see. Provider error bodies never reach this message.
 */
export class AnalyzeError extends Error {
  constructor(
    readonly category: ErrorCategory,
    message: string,
    readonly retryable: boolean,
  ) {
    super(message);
    this.name = "AnalyzeError";
  }
}

const SYSTEM_PROMPT = `You are a senior solutions engineer at AdoptAI, a company that builds and operates AI-powered internal systems for mid-size companies in Latin America.

You are given the raw notes or transcript of a discovery call with a prospective client. Produce a structured brief that a human consultant reviews before writing a real proposal. You are not writing the proposal; you are giving the consultant a first pass they can accept, borrow from, or throw away.

Rules:
- Ground every claim in the notes. Never invent facts about the client, their size, their tools or their budget. If something matters and the notes do not say it, put it in openQuestions instead of guessing.
- Propose 2 or 3 systems AdoptAI could build. Each proposal must address a pain you actually detected in the notes.
- Prefer the smallest system that fixes a real pain end to end over an ambitious platform.
- For each proposal, compare it against AdoptAI's past projects listed below and set the reuse level:
  - "reuse": a past project solves essentially the same problem; we would redeploy it with configuration changes.
  - "adapt": a past project is a strong starting point but needs real new work.
  - "new": nothing in the portfolio is close.
- Only cite a projectId that appears in the portfolio below, copied exactly. If nothing matches, use level "new" and set projectId to null. Never invent an id.
- Effort: S is under two weeks, M is two to six weeks, L is more than six weeks.
- riskFlags are what could make this engagement fail: messy or missing data, no internal owner, unrealistic expectations, integrations with systems nobody controls, compliance or privacy constraints.
- Write the brief in the same language as the notes.

AdoptAI's past projects:

${renderPortfolioForPrompt()}`;

function client(): Anthropic {
  if (!hasApiKey()) {
    throw new AnalyzeError(
      "configuration",
      "The analysis service is not configured: ANTHROPIC_API_KEY is missing. Add it to .env.local and restart the server.",
      false,
    );
  }
  return new Anthropic({
    timeout: LLM_TIMEOUT_MS,
    // One SDK-level retry on 429/5xx; our own retry is for schema failures only.
    maxRetries: 1,
  });
}

interface RawResult {
  text: string;
  inputTokens: number;
  outputTokens: number;
}

async function callModel(notes: string, correction?: string): Promise<RawResult> {
  const userContent = correction
    ? `${notes}\n\n---\nYour previous answer did not match the required schema. Fix exactly this and return the whole brief again:\n${correction}`
    : notes;

  const response = await client().messages.create({
    model: MODEL,
    max_tokens: MAX_OUTPUT_TOKENS,
    system: SYSTEM_PROMPT,
    output_config: {
      effort: LLM_EFFORT,
      format: zodOutputFormat(BriefSchema),
    },
    messages: [{ role: "user", content: userContent }],
  });

  if (response.stop_reason === "refusal") {
    throw new AnalyzeError(
      "validation",
      "The model declined to analyze these notes. Remove any sensitive content and try again.",
      false,
    );
  }

  const text = response.content
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("");

  return {
    text,
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
  };
}

/** Parse the model's text as a Brief, returning the validation message on failure. */
function parseBrief(text: string): { brief: Brief } | { problem: string } {
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    return { problem: "The response was not valid JSON." };
  }
  const result = BriefSchema.safeParse(json);
  if (!result.success) {
    const problem = result.error.issues
      .slice(0, 5)
      .map((issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`)
      .join("; ");
    return { problem };
  }
  return { brief: result.data };
}

/**
 * Deterministic pass after schema validation: the model occasionally cites a project id that
 * does not exist. Dropping the whole brief over one bad reference punishes the user for the
 * model's mistake, so the proposal is downgraded to "new" and the reviewer is told.
 */
export function guardPortfolioIds(brief: Brief): {
  brief: Brief;
  warnings: string[];
} {
  const warnings: string[] = [];
  const proposals = brief.proposals.map((proposal) => {
    const { level, projectId } = proposal.reuse;
    if (level === "new") {
      // A "new" proposal must not carry a reference, even a real one.
      return projectId === null
        ? proposal
        : { ...proposal, reuse: { ...proposal.reuse, projectId: null } };
    }
    if (projectId === null) {
      warnings.push(
        `"${proposal.title}" was marked "${level}" without naming a past project, so it is shown as new work.`,
      );
      return { ...proposal, reuse: { ...proposal.reuse, level: "new" as const } };
    }
    if (!PORTFOLIO_IDS.has(projectId)) {
      warnings.push(
        `"${proposal.title}" cited a past project that does not exist ("${projectId}"), so it is shown as new work.`,
      );
      return {
        ...proposal,
        reuse: { ...proposal.reuse, level: "new" as const, projectId: null },
      };
    }
    return proposal;
  });
  return { brief: { ...brief, proposals }, warnings };
}

/** Provider failures mapped to something a non-technical user can act on. */
function mapProviderError(error: unknown): AnalyzeError {
  if (error instanceof AnalyzeError) return error;

  if (error instanceof Anthropic.APIConnectionTimeoutError) {
    return new AnalyzeError(
      "transient",
      `The analysis timed out after ${Math.round(LLM_TIMEOUT_MS / 1000)} seconds. Try again, or shorten the notes.`,
      true,
    );
  }
  if (error instanceof Anthropic.AuthenticationError) {
    return new AnalyzeError(
      "configuration",
      "The API key was rejected. Check ANTHROPIC_API_KEY in .env.local.",
      false,
    );
  }
  if (error instanceof Anthropic.PermissionDeniedError) {
    return new AnalyzeError(
      "configuration",
      "This API key is not allowed to use the configured model.",
      false,
    );
  }
  if (error instanceof Anthropic.RateLimitError) {
    return new AnalyzeError(
      "transient",
      "The provider is rate limiting this key. Wait a moment and try again.",
      true,
    );
  }
  if (error instanceof Anthropic.BadRequestError) {
    return new AnalyzeError(
      "configuration",
      "The request was rejected by the provider. This is a bug in the app, not in your notes.",
      false,
    );
  }
  if (error instanceof Anthropic.APIConnectionError) {
    return new AnalyzeError(
      "transient",
      "Could not reach the analysis provider. Check the connection and try again.",
      true,
    );
  }
  if (error instanceof Anthropic.APIError) {
    return new AnalyzeError(
      "transient",
      "The analysis provider returned an error. Try again in a moment.",
      true,
    );
  }
  return new AnalyzeError(
    "transient",
    "The analysis failed for an unexpected reason. Try again.",
    true,
  );
}

/**
 * One analysis: call the model, validate, retry once on a schema failure with the error fed
 * back, then neutralize any invented portfolio ids. Throws AnalyzeError on failure.
 */
export async function analyzeNotes(notes: string): Promise<AnalyzeSuccess> {
  let inputTokens = 0;
  let outputTokens = 0;
  let firstProblem = "";

  try {
    // Two attempts maximum: a third rarely fixes what the second did not.
    for (let attempt = 0; attempt < 2; attempt++) {
      const raw = await callModel(notes, attempt === 0 ? undefined : firstProblem);
      // Both attempts are billed, so the cost shown covers the whole analysis.
      inputTokens += raw.inputTokens;
      outputTokens += raw.outputTokens;

      const parsed = parseBrief(raw.text);
      if ("brief" in parsed) {
        const { brief, warnings } = guardPortfolioIds(parsed.brief);
        if (attempt > 0) {
          warnings.push("The first attempt returned a malformed brief and was retried.");
        }
        return {
          brief,
          warnings,
          cost: {
            model: MODEL,
            inputTokens,
            outputTokens,
            estimatedUsd: estimateUsd(inputTokens, outputTokens),
          },
        };
      }
      firstProblem = parsed.problem;
    }
  } catch (error) {
    throw mapProviderError(error);
  }

  throw new AnalyzeError(
    "validation",
    "The analysis came back in a shape the app could not read, twice in a row. Try again, or rephrase the notes.",
    true,
  );
}

/** Re-exported so the route can label a matched project without importing the portfolio. */
export { findProject };
