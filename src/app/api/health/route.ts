import { MODEL, hasApiKey } from "@/lib/config";
import { spendGuard } from "@/lib/guard";
import { PORTFOLIO } from "@/lib/portfolio";

/**
 * Liveness plus the two things you cannot otherwise check from outside: whether the key is
 * present (never any part of its value), and whether the spend guard is in force.
 *
 * The guard is reported here because the alternative way to verify it is to spend five real
 * analyses tripping it. The limits alone would only prove the build is current; the count is
 * what shows the guard is actually being consulted, because it moves when analyses run.
 */
export async function GET(): Promise<Response> {
  const llmConfigured = hasApiKey();
  const { dailyCountThisInstance, ...limits } = spendGuard.snapshot();
  return Response.json({
    status: llmConfigured ? "ok" : "degraded",
    model: MODEL,
    llmConfigured,
    portfolioProjects: PORTFOLIO.length,
    limits,
    // Named for what it is: this instance's tally, not the deployment's.
    analysesAdmittedTodayThisInstance: dailyCountThisInstance,
  });
}
