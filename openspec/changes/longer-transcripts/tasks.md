## 1. Raise the cap and the budget

- [x] 1.1 Raise `MAX_NOTES_CHARS` to 60,000 and correct the comment that describes it in minutes of speech; verify the counter, the disabled button and the route's rejection message all report the new limit
- [x] 1.2 Raise the default `LLM_TIMEOUT_MS` to 240,000 and record why beside it, including the platform's 300-second function ceiling; verify the timeout message still names the right number of seconds

## 2. Tell the truth about what it costs

- [x] 2.1 Update the spend-guard arithmetic in `src/lib/config.ts`: a full-length analysis is no longer ~$0.09, so the documented worst-case day changes with it
- [x] 2.2 Update the README's stated limit, the cost per analysis and the transcript note; verify no other file still claims 20,000

## 3. Ship

- [x] 3.1 `npm test && npm run lint && npm run build` — 26 tests pass, lint and build clean
- [x] 3.2 Exercise the new boundary: 60,001 characters is rejected in 0.16s with HTTP 400 and no provider call, naming the 60,000 limit and the length sent. The accepting side was **not** exercised end to end: the largest input actually analysed is a few thousand characters, so the claim that a 60,000-character transcript completes inside the 240-second budget is reasoned from measured latency, not observed. Recorded in the README as untested

## 4. Amend: raise the cap to 90,000

- [ ] 4.1 Raise `MAX_NOTES_CHARS` to 90,000 and correct the speech-rate comment beside it; update the timeout and spend-guard comments in `src/lib/config.ts` and the README's limit and cost figures; verify no file still claims 60,000 as the cap
- [ ] 4.2 `npm test && npm run lint && npm run build`, then check the 90,000/90,001 boundary against a running server
