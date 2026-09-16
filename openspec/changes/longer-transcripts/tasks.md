## 1. Raise the cap and the budget

- [ ] 1.1 Raise `MAX_NOTES_CHARS` to 60,000 and correct the comment that describes it in minutes of speech; verify the counter, the disabled button and the route's rejection message all report the new limit
- [ ] 1.2 Raise the default `LLM_TIMEOUT_MS` to 240,000 and record why beside it, including the platform's 300-second function ceiling; verify the timeout message still names the right number of seconds

## 2. Tell the truth about what it costs

- [ ] 2.1 Update the spend-guard arithmetic in `src/lib/config.ts`: a full-length analysis is no longer ~$0.09, so the documented worst-case day changes with it
- [ ] 2.2 Update the README's stated limit, the cost per analysis and the transcript note; verify no other file still claims 20,000

## 3. Ship

- [ ] 3.1 `npm test && npm run lint && npm run build`
- [ ] 3.2 Exercise the new boundary: a request just over 60,000 characters is rejected without an LLM call, and one under it is accepted
