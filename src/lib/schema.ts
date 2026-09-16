import { z } from "zod";

/**
 * The contract for everything the LLM produces.
 *
 * One schema, three jobs: it is converted to a JSON schema and sent to the model as the
 * required output shape, it validates the model's response before anything reaches the UI,
 * and it types the response all the way to the React components.
 *
 * Nothing here is optional. Structured outputs are strict, and an always-present field with
 * an explicit null is easier to render than a maybe-missing one.
 */

export const EFFORT = ["S", "M", "L"] as const;
export const REUSE_LEVELS = ["reuse", "adapt", "new"] as const;

export const PainSchema = z.object({
  title: z.string().describe("Short name for the pain, as the client would say it."),
  detail: z
    .string()
    .describe("One or two sentences grounded in the notes. No invented facts."),
});

export const ReuseSchema = z.object({
  level: z
    .enum(REUSE_LEVELS)
    .describe(
      "reuse: a past project solves essentially the same problem and would be redeployed with configuration changes. adapt: a past project is a strong starting point and would be recognisable in what we deliver, with real new work on top. new: nothing in the portfolio is close. A shared generic pattern (a form, a dashboard, threshold alerts) is not a match: when the domain, the data and the integrations all differ, the level is new.",
    ),
  projectId: z
    .string()
    .nullable()
    .describe(
      "Id of the matched past project, copied exactly from the portfolio list. null when level is 'new'.",
    ),
  why: z
    .string()
    .describe("Why this past project matches, or why nothing in the portfolio does."),
});

export const ProposalSchema = z.object({
  title: z.string().describe("Name of the system AdoptAI would build."),
  whatItDoes: z
    .string()
    .describe("Two or three sentences: the input, what happens, who uses the output."),
  effort: z
    .enum(EFFORT)
    .describe("S: under two weeks. M: two to six weeks. L: more than six weeks."),
  reuse: ReuseSchema,
});

export const BriefSchema = z.object({
  clientSummary: z
    .string()
    .describe("Who the client is and what they do, from the notes only."),
  pains: z.array(PainSchema).min(1).max(6),
  proposals: z.array(ProposalSchema).min(2).max(3),
  openQuestions: z
    .array(z.string())
    .describe(
      "What to ask on the next call. Anything you would have had to guess belongs here.",
    ),
  riskFlags: z
    .array(z.string())
    .describe(
      "What could make this engagement fail: messy data, no internal owner, unrealistic expectations, integrations nobody controls, compliance.",
    ),
});

export type Pain = z.infer<typeof PainSchema>;
export type Reuse = z.infer<typeof ReuseSchema>;
export type Proposal = z.infer<typeof ProposalSchema>;
export type Brief = z.infer<typeof BriefSchema>;

/** Usage and cost reported alongside a successful brief. */
export interface AnalysisCost {
  model: string;
  inputTokens: number;
  outputTokens: number;
  estimatedUsd: number;
}

export interface AnalyzeSuccess {
  brief: Brief;
  cost: AnalysisCost;
  /** Non-fatal problems the user should see, e.g. the model cited an unknown project. */
  warnings: string[];
}

export type ErrorCategory = "configuration" | "transient" | "validation";

export interface AnalyzeFailure {
  error: {
    category: ErrorCategory;
    message: string;
    /** Whether the UI should offer a retry. */
    retryable: boolean;
  };
}

export type AnalyzeResponse = AnalyzeSuccess | AnalyzeFailure;

/** Request body for POST /api/analyze. Length limits live in config.ts. */
export const AnalyzeRequestSchema = z.object({
  notes: z.string(),
});
