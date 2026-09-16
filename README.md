# Discovery Assistant

Turns the notes of a discovery call into a structured brief: the client's pains, two or
three things AdoptAI could build, and — the part that matters — whether each one is close to
something AdoptAI has already delivered. A human reviews every proposal and exports the
result as markdown.

Built for the AdoptAI technical challenge, **Option B: a tool for AdoptAI**.

## Why this

AdoptAI runs discovery calls every week. Two things happen after each one, and both are slow:
somebody has to turn messy notes into a first proposal, and somebody has to remember whether
we have built this before. The second one is the expensive part, because it lives in the
CTO's head. A new engineer does not have that memory at all, and a consultant who just got
off a call is the worst-positioned person to recall a project from two years ago.

So the slice is: **notes in, reviewable brief out, with the portfolio comparison made
explicit**. Not a CRM, not a proposal generator. The output is a first pass a human accepts,
borrows from, or throws away — and the "reuse / adapt / new" call per proposal is the thing
that would actually change what gets quoted.

## Running it locally

Requires Node 20 or newer and an Anthropic API key.

```bash
npm install
cp .env.example .env.local        # then put a real key in ANTHROPIC_API_KEY
npm run dev
```

Open <http://localhost:3000>, click **Load sample call**, then **Analyze call**. The sample is
invented notes from a hardware distributor, written in Spanish, deliberately messy.

Check it is configured correctly:

```bash
curl -s localhost:3000/api/health
# {"status":"ok","model":"claude-opus-5","llmConfigured":true,"portfolioProjects":10}
```

`status` is `degraded` and `llmConfigured` is `false` when the key is missing. The endpoint
never returns any part of the key.

Analyzing the sample takes about 40 seconds and costs roughly 9 US cents with the default
model. The exact token counts and cost are shown in the UI after every run.

## How it works

```
 textarea ──► POST /api/analyze ──► length check ──► Claude (structured output)
                                                          │
                                        zod validation ◄───┘
                                          │        │
                                    ok ───┘        └─── fail → retry once with the error
                                          │
                              portfolio id guard (invented ids → "new")
                                          │
                              brief + warnings + token cost ──► review UI ──► markdown
```

| Path | What lives there |
|---|---|
| `src/lib/portfolio.ts` | The 10 invented past projects, and the id set the guard checks against |
| `src/lib/schema.ts` | The zod schema. One contract, used in both directions |
| `src/lib/analyze.ts` | Prompt, LLM call, retry, id guard, error mapping |
| `src/lib/config.ts` | Model, prices, timeout, effort. Everything tunable |
| `src/app/api/analyze/route.ts` | Input validation and HTTP status mapping |
| `src/app/page.tsx` | The whole UI: input, brief, review, export |

## Key decisions

**The portfolio is a TypeScript file, not a database.** Nothing in v0 persists — not the
brief, not the review — so a database would have been setup cost with no user-visible
benefit. Ten projects also fit comfortably in the prompt.

**Matching is done by putting the whole portfolio in the prompt, not by embeddings.** Ten
short project cards are under a thousand tokens. The model compares the client's problem to
every project and explains why, which is exactly what the reviewer wants to read. Embeddings
plus a vector store start paying off somewhere past a hundred projects, and they would hide
the reasoning. That is a deliberate deferral, not an oversight.

**One zod schema is the contract in both directions.** It is converted to a JSON schema and
sent to the model as the required output shape, and the same schema validates the response
before anything reaches the UI. The model being constrained server-side is not a reason to
skip validation: the guarantee I rely on is the one in my own process.

**Invented portfolio ids are downgraded, not rejected.** The model will occasionally cite a
project that does not exist. Throwing away the whole brief over one bad reference punishes
the user for the model's mistake, so that proposal is set to "new", the reference is dropped,
and a warning names the id. This is deterministic post-processing, not another LLM call.

**Exactly one retry on a schema failure, with the zod error fed back.** A second attempt
fixes most slips. A third rarely does and doubles cost and latency. After two failures the
user gets a clear message and no partial brief.

**Errors are mapped to three categories.** Configuration (missing or rejected key), transient
(timeout, rate limit, provider 5xx), validation (bad input, or the schema failed twice). Only
transient errors offer a retry button, and raw provider error bodies never reach the user.

**Review state is client-side only.** The export is the artifact you keep. Making verdicts
survive a reload means a database, and that was not worth the timebox.

## What is mocked, stubbed or unfinished

Being explicit, because some of this is load-bearing:

- **The portfolio is invented.** All ten projects, clients and numbers are made up. No real
  AdoptAI project is represented.
- **The sample call is invented too**, including the company and the people in it.
- **Nothing persists.** Reload the page and the brief and your verdicts are gone. There is no
  database, no auth, no user accounts.
- **No audio.** Voice recording and transcription were explicitly cut from v0. The input is
  pasted text.
- **Long transcripts are rejected, not chunked.** Anything over 20,000 characters (roughly a
  30-40 minute call) is refused with a clear message. Silently truncating a user's transcript
  would be worse than refusing it.
- **The cost figure is an estimate**, computed from the returned token counts and a price
  constant in `src/lib/config.ts`. If prices change, that constant is wrong until updated.
- **No committed test suite.** Everything was verified by hand and the evidence is real: the
  id guard against four hand-built cases, every error path with curl, and the retry by
  temporarily injecting a schema failure (first-attempt-fails and both-attempts-fail, then
  reverted). None of that is locked down in CI, so it protects nothing against a future
  change. That is the first thing I would fix.
- **No deploy.** It runs locally only.

## What I would do next, with one more week

1. **Tests where they protect something.** The portfolio id guard and the markdown export are
   pure functions with real edge cases; they should be locked down before anything else.
2. **Voice in.** Record or upload the call audio and transcribe it, so the consultant does
   not have to type notes at all. This was the original idea and was cut on purpose — it is a
   second provider and a second failure mode, and the analysis is where the value is.
3. **Persistence and a history view.** Briefs and verdicts in a database, so the reuse
   decision is auditable later and so you can ask "what did we propose to clients like this".
4. **Portfolio at scale.** Past a hundred projects the whole-portfolio prompt stops working.
   That is when embeddings plus top-k retrieval earn their complexity — and the retrieved
   candidates should still be shown to the reviewer with the reason.
5. **An eval for the matching.** Fifteen or twenty hand-labelled calls with the expected reuse
   level per proposal, so prompt changes can be measured instead of eyeballed.
6. **Chunking for long transcripts**, replacing the hard character cap.

## Planning artifacts

This was built spec-first with [OpenSpec](https://github.com/Fission-AI/OpenSpec). The
proposal, the behaviour specs, the design decisions and the task breakdown are committed
under `openspec/changes/discovery-brief-core/` and were written before any application code.
`AGENTS.md` (which `CLAUDE.md` points at) carries the working rules the AI coding agent
followed. See `AI.md` for how the AI tooling was actually used, including what it got wrong.

## Time log

All times are Lima time, Monday 15 September 2026.

| Block | Time | What it produced |
|---|---|---|
| 1 | 18:15 – 18:30 | Read the assignment, chose Option B, scoped the slice down (cut audio, cut the database), created the private repo and the initial commit |
| 2 | 18:30 – 18:47 | Next.js scaffold; OpenSpec proposal, three capability specs, design decisions and a 16-task plan, validated and committed before any application code |
| 3 | 18:47 – 18:55 | `AGENTS.md` working rules, dependencies, `.env.example` |
| 4 | 18:55 – 19:09 | Portfolio, zod schema, LLM client, analyze endpoint, retry, id guard, error mapping. Every error path verified with curl |
| 5 | 19:09 – 19:15 | UI: input with counter, brief view, per-proposal review, markdown export. Browser-verified the input and error states. First README |
| 6 | 19:15 – 19:30 | Blocked on an API key. Wrote the README while waiting |
| 7 | 19:30 – 19:55 | First real analysis. Found the 60s timeout was too tight against a measured 42s, raised it to 120s and recorded the finding in `design.md`. Browser-verified the brief, the review controls and the markdown export. Exercised the retry by injecting a schema failure, both branches, then reverted |
| 8 | 19:55 – 20:10 | Reconciled the commit skill with what this repo needs, wrote `AI.md` |
