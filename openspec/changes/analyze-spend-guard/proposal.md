## Why

The app is deployed on a public URL with no authentication. `POST /api/analyze` calls an LLM that costs roughly nine cents and takes about forty seconds per call, so the deployed link is a way for anyone to spend the configured API key, and a stuck client retry loop would do the same without anyone intending harm. The existing input cap bounds the size of a single call; nothing bounds how many calls arrive.

Authentication is the other answer and the wrong one here: the point of the deployment is that a reviewer can open a link and use the tool. So the endpoint stays open and the spend gets bounded instead.

## What Changes

- A spend guard in front of the LLM call on `POST /api/analyze`, with two independent bounds: a per-IP sliding window, and a global cap across all callers per UTC day.
- Rejections return HTTP 429 with a `Retry-After` header and a plain-language message, reusing the existing error envelope. The per-IP rejection is retryable; the daily one is not, because a retry button against a cap that resets at midnight would be misleading.
- The caps are environment-overridable, so a private local run can raise them without a code change.
- The guard is consulted after input validation, so a caller's malformed or too-short input does not consume their quota.

Out of scope for this change: authentication, a shared cross-instance counter store, and any provider-side budget. All three are named in the README as what a production version needs.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `discovery-brief`: the analyze endpoint gains request-rate and daily-volume bounds, and a fourth rejection shape (429) alongside the existing configuration / transient / validation mapping.

## Impact

- New module `src/lib/rate-limit.ts` holding the guard, with the clock injected so its behaviour is testable without sleeping.
- `src/app/api/analyze/route.ts` consults the guard between input validation and the LLM call.
- New optional environment variables `RATE_LIMIT_PER_IP_MAX`, `RATE_LIMIT_WINDOW_MS`, `RATE_LIMIT_DAILY_MAX`, documented in `.env.example`.
- Counters live in process memory. On Vercel each serverless instance keeps its own, so the effective ceiling is the daily cap times the number of live instances. This is a deliberate limitation of this change, not an oversight; see `design.md`.
