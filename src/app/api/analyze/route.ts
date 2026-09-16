import { AnalyzeError, analyzeNotes } from "@/lib/analyze";
import { MAX_NOTES_CHARS, MIN_NOTES_CHARS } from "@/lib/config";
import { spendGuard } from "@/lib/guard";
import {
  AnalyzeRequestSchema,
  type AnalyzeFailure,
  type ErrorCategory,
} from "@/lib/schema";

/** Configuration problems are not the caller's fault; transient ones are worth retrying. */
const STATUS_BY_CATEGORY: Record<ErrorCategory, number> = {
  configuration: 503,
  transient: 502,
  validation: 422,
};

function failure(
  category: ErrorCategory,
  message: string,
  retryable: boolean,
  status?: number,
  headers?: HeadersInit,
): Response {
  const body: AnalyzeFailure = { error: { category, message, retryable } };
  return Response.json(body, { status: status ?? STATUS_BY_CATEGORY[category], headers });
}

/**
 * Vercel sets x-forwarded-for and the leftmost entry is the client. The header is spoofable,
 * which is why the global daily cap exists: it holds even when every request claims a
 * different origin.
 */
function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || "unknown";
}

export async function POST(request: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return failure("validation", "The request body was not valid JSON.", false, 400);
  }

  const parsed = AnalyzeRequestSchema.safeParse(body);
  if (!parsed.success) {
    return failure("validation", "The request must include a 'notes' string.", false, 400);
  }

  // Length is checked before the provider is touched: no cost, no latency, clearer message.
  const notes = parsed.data.notes.trim();
  if (notes.length < MIN_NOTES_CHARS) {
    return failure(
      "validation",
      `These notes are too short to analyze. Paste at least ${MIN_NOTES_CHARS} characters; you sent ${notes.length}.`,
      false,
      400,
    );
  }
  if (notes.length > MAX_NOTES_CHARS) {
    return failure(
      "validation",
      `These notes are too long. The limit is ${MAX_NOTES_CHARS.toLocaleString("en-US")} characters and you sent ${notes.length.toLocaleString("en-US")}. Paste the relevant part of the call.`,
      false,
      400,
    );
  }

  // Checked last of all the cheap checks: quota is spent by real analyses, not by typos.
  const decision = spendGuard.check(clientIp(request));
  if (!decision.allowed) {
    const message =
      decision.reason === "ip"
        ? `Too many analyses from this address. Wait about ${Math.ceil(decision.retryAfterSeconds / 60)} minute(s) and try again.`
        : "This demo has reached its daily analysis limit. It resets at midnight UTC.";
    return failure("transient", message, decision.reason === "ip", 429, {
      "retry-after": String(decision.retryAfterSeconds),
    });
  }

  try {
    const result = await analyzeNotes(notes);
    return Response.json(result);
  } catch (error) {
    if (error instanceof AnalyzeError) {
      return failure(error.category, error.message, error.retryable);
    }
    // analyzeNotes maps everything it throws; anything here is a genuine bug.
    console.error("[analyze] unmapped error", error);
    return failure("transient", "The analysis failed unexpectedly. Try again.", true);
  }
}
