<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Discovery Assistant — working rules

## What this is

Take-home challenge for AdoptAI (Option B: a tool for AdoptAI). A no-auth web app that turns
discovery-call notes into a structured brief with proposals matched against a synthetic
past-projects portfolio, for a human to review and export. Timebox: 5 hours total, hard stop
21:30 on 2026-09-15. Planning lives in `openspec/changes/`; read the active change's
`proposal.md`, `specs/`, `design.md` and `tasks.md` before touching code.

## Stack (fixed, do not add without a reason written in design.md)

- Next.js 16 App Router, TypeScript strict, Tailwind 4, `src/` directory.
- `zod` for every schema: LLM output contract, request validation, config.
- `@anthropic-ai/sdk` for the LLM call. Structured output via `client.messages.parse` with
  `zodOutputFormat`. Model id and prices live in `src/lib/config.ts`, overridable by env.
- No database, no auth, no second provider. Review state is client-side only.

## Hard rules

- Never commit secrets. `ANTHROPIC_API_KEY` goes in `.env.local` (gitignored); `.env.example`
  documents it with a placeholder.
- One commit per task from `tasks.md`, conventional commit messages, push after each.
- Nothing reaches the UI without passing the zod brief schema. Portfolio ids cited by the model
  are checked against the portfolio after parsing.
- Errors to the user are mapped to three categories (configuration / transient / validation)
  with plain-language messages. Never leak raw provider error bodies.
- README must be honest: anything mocked, stubbed or unfinished is listed there.
- Data is invented. Do not use real client names or confidential material.

## How to verify

```
npm run lint && npm run build
npm run dev
curl -s localhost:3000/api/health
curl -s -X POST localhost:3000/api/analyze -H 'content-type: application/json' -d '{"notes":"..."}'
```

## Language

Code, comments, commits and docs in English. The UI copy is in English too; the sample notes
in `samples/` are in Spanish because that is what a LatAm discovery call sounds like.
