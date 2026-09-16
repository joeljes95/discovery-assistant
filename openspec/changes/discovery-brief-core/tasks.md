## 1. Foundation

- [x] 1.1 Install `@anthropic-ai/sdk` and `zod`, add `.env.example` with `ANTHROPIC_API_KEY`, and verify `npm run build` still passes
- [x] 1.2 Write the project `CLAUDE.md` (stack, scope, non-goals, rules: no secrets, honest README, commit per task) and verify it is committed
- [x] 1.3 Create the synthetic portfolio file with 8-10 past projects (id, client, industry, problem, solution, stack, effort, year) and verify it type-checks and exports a typed array

## 2. Analysis endpoint

- [x] 2.1 Define the brief zod schema (summary, pains, 2-3 proposals with effort S/M/L and reuse level/id/reason, open questions, risk flags) and verify a sample object parses
- [ ] 2.2 Implement the LLM client module: model and prices config, system prompt with the portfolio rendered as cards, structured output bound to the schema, 60s timeout; verify a manual call returns a parsed brief
- [x] 2.3 Implement `POST /api/analyze`: reject inputs under 50 or over 20,000 characters before calling the LLM, call the client, and return brief plus usage and estimated cost; verify with curl for short, oversized and valid inputs
- [ ] 2.4 Add one retry on zod failure feeding the error back, and after two failures return a validation error; verify by forcing a bad schema once in dev
- [x] 2.5 Post-validate portfolio ids: unknown id downgrades that proposal to `new` and adds a warning; verify with a unit-style check that injects a fake id
- [x] 2.6 Map provider errors to configuration / transient / validation categories with plain-language messages; verify by running once without the API key and once with an invalid key

## 3. UI

- [x] 3.1 Build the input page: textarea with live character counter against the cap, submit button with loading state, and error banner per category; verify the three error states render
- [ ] 3.2 Render the brief: client summary, pains, proposals with effort and reuse badge showing the matched project's name, open questions, risk flags, warnings, and the cost line; verify with a real analysis of the sample notes
- [ ] 3.3 Add the per-proposal review controls (worth it / inspiration / discard, notes) in client state; verify selecting and changing verdicts affects only that proposal
- [ ] 3.4 Add "Copy as markdown" that builds the reviewed brief, writes it to the clipboard, confirms in the UI, and shows the markdown in a fallback textarea; verify pasted output includes verdicts and "not reviewed" for unmarked proposals

## 4. Health and wrap-up

- [x] 4.1 Implement `GET /api/health` returning status, model name and `llmConfigured` boolean; verify with curl with and without the key
- [ ] 4.2 Ship a sample discovery-call notes file in the repo for the demo and verify it produces a good brief end-to-end
- [ ] 4.3 Run `npm run lint` and `npm run build` clean, update the README time log, and commit; verify the working tree is clean and pushed
