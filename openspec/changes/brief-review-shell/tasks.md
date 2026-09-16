## 1. Shell and status

- [ ] 1.1 Add a persistent header with the tool's name and a status indicator that reads `GET /api/health` on load; verify it shows the ready state with the portfolio count when the key is present
- [ ] 1.2 Handle the two other outcomes: not configured says so in plain language, and an unreachable health endpoint leaves the indicator out without breaking the input; verify both by blanking the key and by blocking the request

## 2. The idle screen

- [ ] 2.1 Add the explanation block shown before the first analysis: the three steps and what the brief contains; verify it is readable on first load without scrolling on a phone-width screen
- [ ] 2.2 Replace it with the brief once one is generated, and bring it back when the user starts a new analysis; verify by running an analysis and reloading

## 3. The input and the type scale

- [ ] 3.1 Frame the notes input as a card with a header carrying the sample-call link and a footer carrying the counter and the button; verify the counter and the disabled states still behave at the 50 and 20,000 character boundaries
- [ ] 3.2 Apply one type scale and the cooler neutral across the existing screens, leaving the semantic colours for reuse levels, verdicts and error categories untouched; verify the error, loading and result states all still read correctly

## 4. Ship

- [ ] 4.1 `npm run lint && npm run build`, then check the idle, loading, error and result states by hand
- [ ] 4.2 Update the README with what changed on screen and record the two alternative directions that were not built
