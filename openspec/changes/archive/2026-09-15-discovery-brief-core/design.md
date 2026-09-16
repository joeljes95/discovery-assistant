## Context

Greenfield Next.js 16 app (App Router, TypeScript, Tailwind 4) scaffolded with `create-next-app`, nothing else exists yet. Hard constraints: everything in this change must be implemented and archived by 20:15 today, must run locally with a single environment variable, must never commit secrets, and the README must be honest about anything mocked. See proposal.md for motivation.

## Goals / Non-Goals

**Goals:**
- One end-to-end path that works reliably in a live demo: paste text, get a brief, review it, copy it.
- Every LLM failure mode listed in the specs is handled in code, not just documented.
- Zero infrastructure: no database, no auth, no second provider.

**Non-Goals:**
- Scaling the portfolio beyond a few dozen projects (embeddings are the next step, not this one).
- Streaming the response. A single request/response is simpler to validate and retry.
- Persisting briefs or review verdicts.

## Decisions

**Portfolio as a static TypeScript file, not a database.**
Ten invented projects fit in one file, need no migrations, and are versioned with the code. A database would add setup time and a second thing to configure with no user-visible benefit in v0. Alternative considered: Supabase. Rejected because nothing in this change persists.

**Matching by putting the whole portfolio in the prompt, not embeddings.**
Ten short project cards are well under a thousand tokens. The model can compare the client's problem to every project directly and explain why, which is what the reviewer wants to read. Embeddings plus a vector store only pay off past roughly a hundred projects, and would hide the reasoning. Alternative considered: cosine similarity on embeddings with top-k injection. Deferred until the portfolio grows.

**Structured output via the SDK's schema mechanism, then zod at runtime.**
The brief schema is defined once in zod. It is handed to the model as the required output shape, and the model's output is parsed with the same zod schema before anything reaches the UI. This gives one source of truth and a runtime guarantee regardless of what the model does. Alternative considered: ask for JSON in prose and regex it out. Rejected as the main source of brittle parsing bugs.

**Exactly one retry on validation failure, with the error fed back.**
A second attempt fixes most schema slips; a third rarely does and doubles cost and latency. The retry includes the zod error message so the model can correct the specific field. After two failures the user gets a clear error and no partial brief.

**Invented portfolio ids are downgraded, not rejected.**
The model will occasionally cite a project id that does not exist. Throwing away the whole brief for one bad reference punishes the user for the model's mistake. Instead the proposal is set to level `new`, the reference is dropped, and a warning names the unknown id so the reviewer knows. This is deterministic post-processing after zod parsing.

**Input cap of 20,000 characters, enforced server-side before the LLM call.**
Roughly a 30-40 minute call transcript. Keeps cost and latency bounded and avoids context overflow. Longer transcripts need chunking, which is a later change. The client mirrors the cap with a live counter so the user sees it before submitting.

**Errors mapped to three user-facing categories.**
Configuration (missing key, auth error), transient (timeout, rate limit, provider 5xx), and validation (schema failed twice). Each has its own message and only transient errors suggest retrying. The route never leaks raw provider error bodies.

**Cost estimate from returned usage and env-configured prices.**
The provider returns input and output token counts. Prices per million tokens for the chosen model live in one config module (overridable by env) so switching models does not require touching the route. Displayed with the model name so the reviewer knows what produced the brief.

**Model choice is env-configurable; the default landed on a frontier model, not the mid-tier one planned here.**
Planned: a mid-tier model, on the theory that extraction plus matching over a short context does not need the largest one. Implemented: `claude-opus-5` at medium effort, because the judgement the tool is actually selling is the reuse call, and a shallow match is worse than no match. Measured cost is about 9 cents and 42 seconds per analysis, which is cheap against the consultant hour it replaces but too slow and too expensive for a high-volume path. Both the model id and the effort level are single env vars, so stepping down is a config change once there is an eval to prove quality holds.

**Review state lives in React state only; export builds markdown from it.**
No persistence in this change. The markdown export is the "output" an operator actually takes to the CRM, so it includes verdicts and notes.

## Risks / Trade-offs

- [Model invents pains or proposals not grounded in the notes] → prompt instructs to cite only what the notes support and to put uncertainties under open questions; the reviewer is explicitly the last word in the UI.
- [Cheaper model gives shallow matches] → resolved by defaulting to a frontier model; portfolio cards carry problem and solution text so matching has substance either way. The open risk is now the inverse: cost and latency per analysis are high enough that a volume use case would need a step down plus an eval.
- [Timeout too tight for long inputs on a slow provider day] → originally 60 seconds. Measured during implementation: a 1,958-character sample takes ~42s at medium effort, so 60s left no headroom for a full-length transcript. Raised to 120 seconds; the input cap still bounds the worst case and the timeout error is handled and retryable.
- [Cost display drifts from real prices] → prices are in one config module with a comment pointing to the pricing page; acceptable for an estimate, labeled as such in the UI.
- [Timebox slips] → task order puts the end-to-end path first; failure handling and export come after the first working brief so a slip still leaves a demoable product.
- [Clipboard API unavailable in insecure contexts] → local dev is on localhost which is a secure context; export also renders the markdown in a textarea as fallback.

## Open Questions

None that change the specs or tasks. Chunking of long transcripts and portfolio scaling are deliberately deferred to later changes.
