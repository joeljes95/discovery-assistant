## Why

AdoptAI runs discovery calls with prospective clients every week, but what to propose next and whether a past project can be reused lives in the CTO's head and in scattered notes. Turning a call into a first structured proposal is slow and reuse opportunities get missed. A small assistant that produces a reviewable brief from the call notes shortens that loop and makes the portfolio knowledge available to whoever ran the call.

## What Changes

- New web app (no auth) where a user pastes discovery-call notes or a transcript.
- A server-side analysis step sends the notes plus AdoptAI's past-projects portfolio to an LLM and returns a structured brief: client summary, detected pains, 2-3 proposals with effort and a reuse match against the portfolio, open questions for the next call, and risk flags.
- A synthetic portfolio of 8-10 past projects shipped as a static file (invented data, no database).
- Failure handling for the LLM step: schema validation with one retry, neutralization of portfolio ids the model invented, input length cap, timeouts and API errors surfaced clearly, and an estimated cost per analysis shown to the user.
- A review UI where the human marks each proposal as worth it / inspiration / discard with notes, and exports the reviewed brief as markdown.
- A health endpoint.

Out of scope for this change: audio or voice input, file upload, persistence of briefs, authentication, embeddings or vector search.

## Capabilities

### New Capabilities
- `discovery-brief`: turn pasted call notes into a validated, structured brief matched against the portfolio, including all LLM failure handling.
- `brief-review`: human review of each proposal (verdict + notes) and export of the reviewed brief as markdown.
- `service-health`: health endpoint reporting the service is up and whether the LLM credentials are configured.

### Modified Capabilities

None. Greenfield project.

## Impact

- New Next.js app in this repo (App Router, TypeScript, Tailwind).
- New dependencies: Anthropic SDK, zod.
- New environment variable `ANTHROPIC_API_KEY` (never committed; `.env.example` documents it).
- New static portfolio data file and a project `CLAUDE.md` with working rules.
- Timebox: this change must be implemented and archived by 20:15 on 2026-09-15.
