## Why

The app opens on a near-black page with one empty textarea. Everything it does — the pains,
the proposals, the reuse match against ten past projects — only becomes visible after someone
pastes a call and waits forty seconds. The first screen, which is the one a reviewer sees
first and the one a consultant sees every morning, says nothing about what the tool is for.

The same screen also hides the one failure that is cheap to surface early. When
`ANTHROPIC_API_KEY` is missing the app looks perfectly healthy until you paste a transcript,
press the button and wait for a request that was never going to work. `GET /api/health`
already knows this before anything is typed.

## What Changes

- The app gains a persistent shell: the tool's name, and a status indicator fed by
  `GET /api/health` reporting whether the analysis service is configured and how many past
  projects the portfolio holds.
- Before the first analysis, the screen explains the tool: the three steps of the workflow
  and what the brief comes back with. It is replaced by the brief once one is generated.
- The notes input is framed as a card with its own header and footer, so the sample-call
  link and the character counter belong to it rather than floating beside it.
- A single type scale and a cooler neutral across the existing screens. No new hue: emerald,
  sky, amber, rose and violet are already carrying reuse levels, verdicts and error
  categories, and a brand colour added on top of them would collide with meaning.

Out of scope: the light "document" treatment and the two-pane workspace layout explored as
alternatives (both are recorded in the README as next steps), streaming results, and any
change to the analyze or health endpoints. This change is confined to what the browser
renders.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `brief-review`: the reviewer's screen additionally explains the tool before the first
  analysis and reports whether the analysis service is configured.

`brief-review` owns what the reviewer sees in the browser, so both requirements land there. A
separate shell capability for two requirements would be more ceremony than it earns.

## Impact

- `src/app/page.tsx`: a shell header, an idle explanation block, the notes card, and the
  status fetch. No change to the analyze request, the response handling or the review state.
- `src/app/globals.css`: the background neutral.
- No new dependencies, no new environment variables, no endpoint changes. `GET /api/health`
  is consumed exactly as it is already published.
