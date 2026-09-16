import { MODEL, hasApiKey } from "@/lib/config";
import { PORTFOLIO } from "@/lib/portfolio";

/**
 * Liveness plus the one configuration fact that decides whether analysis can work at all.
 * Reports whether the key is present, never any part of its value.
 */
export async function GET(): Promise<Response> {
  const llmConfigured = hasApiKey();
  return Response.json({
    status: llmConfigured ? "ok" : "degraded",
    model: MODEL,
    llmConfigured,
    portfolioProjects: PORTFOLIO.length,
  });
}
