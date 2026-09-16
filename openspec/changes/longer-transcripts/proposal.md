## Why

The input cap is 20,000 characters. That was sized for notes, and for notes it is generous.
For the raw transcript the tool also claims to accept, it is not: verbatim speech runs around
825 characters a minute, so 20,000 characters is about 25 minutes of talk — less once speaker
labels and timestamps are in the file. A discovery call is rarely that short, so the honest
description of today's behaviour is that transcripts are accepted only if someone trims them
first.

Raising the cap is a one-line change. What makes it a real one is the timeout: a recent
analysis of 1,700 characters took 95 seconds against a 120-second budget, and a transcript
three times longer will not finish inside it. Raising the cap without raising the timeout
would trade a clear "too long" message for an opaque timeout two minutes in, which is worse
than the limit it replaced.

## What Changes

- The input cap goes from 20,000 to 60,000 characters, roughly 70 minutes of speech.
- The per-call timeout budget goes from 120 to 240 seconds, so a full-length transcript can
  finish. The deployment platform's function ceiling is 300 seconds, so this stays inside it.
- The cost of a full-length analysis rises to roughly $0.20-0.25 from roughly $0.10, which
  changes the worst-case day the spend guard admits. The guard's own limits are unchanged;
  what changes is the arithmetic documented next to them.

Out of scope: chunking, which is the real answer for transcripts past this cap and stays on
the next-steps list; streaming, which would make a long wait tolerable rather than shorter;
and any change to how the brief itself is produced.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `discovery-brief`: the input cap is 60,000 characters rather than 20,000.

## Impact

- `src/lib/limits.ts`: the cap, and the comment describing what it buys in minutes of speech.
- `src/lib/config.ts`: the default timeout, and the cost arithmetic documented beside the
  spend guard.
- `README.md`: the stated limit and the cost per analysis.
- No schema change, no endpoint change, no new environment variable — both values were
  already overridable from the environment.
