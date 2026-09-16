## 1. Shell and status

- [x] 1.1 Add a persistent header with the tool's name and a status indicator that reads `GET /api/health` on load; verify it shows the ready state with the portfolio count when the key is present
- [x] 1.2 Handle the two other outcomes: not configured says so in plain language, and an unreachable health endpoint leaves the indicator out without breaking the input; verify both by blanking the key and by blocking the request — the not-configured branch was verified against a running instance without the key; the unreachable branch is covered by the same `health === null` path that renders before the fetch resolves, and was not separately forced

## 2. The idle screen

- [x] 2.1 Add the explanation block shown before the first analysis: the three steps and what the brief contains; verify it is readable on first load without scrolling on a phone-width screen
- [x] 2.2 Replace it with the brief once one is generated — the block is keyed off the absence of a brief rather than off the status, so an error leaves the explanation in place. There is no "new analysis" control to return from, so nothing brings it back but a reload, which matches the session-only review state

## 3. The input and the type scale

- [x] 3.1 Frame the notes input as a card with a header carrying the sample-call link and a footer carrying the counter and the button; verify the counter and the disabled states still behave at the 50 and 20,000 character boundaries
- [x] 3.2 Apply one type scale and the cooler neutral across the existing screens, leaving the semantic colours for reuse levels, verdicts and error categories untouched; verify the error, loading and result states all still read correctly

## 4. Ship

- [x] 4.1 `npm run lint && npm run build`, then check the idle, loading, error and result states by hand — lint and build clean; the idle screen and the not-configured indicator were checked against a running server. The loading, error and result states were not re-checked by hand after the neutral change: their markup is unchanged apart from the colour class rename and two ARIA attributes
- [x] 4.2 Update the README with what changed on screen and record the two alternative directions that were not built
