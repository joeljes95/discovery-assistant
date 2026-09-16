## Context

The deployment is public and unauthenticated by design, and each analysis costs about nine cents. The threat model worth defending against here is not a determined attacker — it is a reviewer's browser stuck in a retry loop, a crawler that finds the URL, and the ordinary case of the link being shared further than expected. The budget for this change was under half an hour, inside a five-hour challenge timebox.

## Goals / Non-Goals

Goals:
- Bound the worst-case daily spend to a number that is survivable if the URL leaks.
- Keep the demo usable: a reviewer must be able to run several analyses back to back without being told to come back tomorrow.
- Fail in a way the existing UI already understands, rather than adding an error shape the frontend must learn.

Non-Goals:
- Authentication. It would protect the key completely and defeat the purpose of a link a stranger can try.
- Exact global correctness across serverless instances.
- Protecting against a determined attacker who controls many addresses and is willing to work at it.

## Decisions

### Two bounds, not one

A per-IP window alone fails against a spoofed `x-forwarded-for`, which on Vercel is caller-supplied and therefore not trustworthy. A global daily cap alone lets one caller consume everyone's budget in a loop. Each bound covers the other's failure: the window handles the ordinary runaway client, the daily cap is what actually holds when the address is unreliable.

The daily cap is checked first, so when both would reject, the message names the bound that really applies.

### Counters in memory, with the limitation stated

The correct implementation is a shared store — Vercel KV or Upstash — keyed by address and by day. That is a second service, a second credential, and a network call on the hot path. Within the timebox and for a demo deployment, an in-memory counter per serverless instance buys most of the protection at none of the cost. The consequence, stated plainly rather than buried: the effective ceiling is the daily cap multiplied by the number of live instances.

This is acceptable because the guard is a damage bound, not a correctness mechanism. The thing that would actually make the spend safe is a hard budget configured at the provider, which no application code can substitute for.

### The clock is injected

The guard takes `now` as an argument rather than reading the clock internally. Rate limits are otherwise tested by sleeping, which makes the suite slow and flaky and tends to mean the interesting cases — the window sliding, the day rolling over — go untested. With an injected clock every boundary is an exact assertion.

### Rejections reuse the existing error envelope

The route already returns `{ error: { category, message, retryable } }` and the UI keys its retry button off `retryable`. A rate-limit rejection is a `transient` error with an explicit 429 status, which required no schema change and no frontend change. The per-IP case sets `retryable: true`; the daily cap sets it to `false`, because offering a retry button against a bound that clears at midnight tells the user something untrue.

### The guard sits after input validation

Length and shape checks are free and produce better messages, so they run first. Quota is spent by analyses that would actually reach the provider, which means a user fixing a typo is not punished for it.

An admitted request that later fails inside the provider call still consumes quota. Refunding those would mean tracking outcomes and reasoning about which failures deserve a refund; failing closed is the safer default for a spend bound.

## Risks / Trade-offs

- **The limiter under-counts across instances.** Mitigated by choosing a daily cap low enough that several times it is still an acceptable bill, and by naming a provider-side budget as the real control.
- **Shared-NAT callers share a bucket.** Two reviewers behind one office address could collide. Accepted: the window is short and the message says what to do.
- **The caps are guesses.** Five per ten minutes and fifty per day were chosen for a demo, not measured against real usage. They are environment-overridable precisely because the right values are not known yet.

## Migration Plan

None. New behaviour on an existing endpoint, additive, with defaults that apply as soon as the deployment restarts.

## Open Questions

- Whether the daily cap should notify anyone when it trips. Today it is invisible unless the logs are read, which means the first sign of a leaked URL is a user complaining that the demo is capped.
