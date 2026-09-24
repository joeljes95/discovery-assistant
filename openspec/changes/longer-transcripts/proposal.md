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

- The input cap goes from 20,000 to 90,000 characters: a fast hour-long call with room to
  spare, or 80-90 minutes at a normal pace.
- The per-call timeout budget goes from 120 to 240 seconds, so a full-length transcript can
  finish. The deployment platform's function ceiling is 300 seconds, so this stays inside it.
- The cost of a full-length analysis rises to roughly $0.25-0.30 from roughly $0.10, which
  changes the worst-case day the spend guard admits. The guard's own limits are unchanged;
  what changes is the arithmetic documented next to them.

Out of scope: chunking, which is the real answer for transcripts past this cap and stays on
the next-steps list; streaming, which would make a long wait tolerable rather than shorter;
and any change to how the brief itself is produced.

## Amendment: 60,000 was not enough

The change first shipped with a 60,000-character cap, sized from 825 characters a minute. A
user then had a Whisper transcript of a one-hour call rejected as too long. Conversational
Spanish runs nearer 900-1,100 characters a minute (150-180 words at about six characters
each), so an hour is 55,000-65,000 characters and a busy call goes past 60,000. The cap is
now 90,000. The timeout stays at 240 seconds: the extra input adds prefill time, which is
small next to the model's reasoning, and the 300-second platform ceiling leaves no room to
raise it much further anyway.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `discovery-brief`: the input cap is 90,000 characters rather than 20,000.

## Impact

- `src/lib/limits.ts`: the cap, and the comment describing what it buys in minutes of speech.
- `src/lib/config.ts`: the default timeout, and the cost arithmetic documented beside the
  spend guard.
- `README.md`: the stated limit and the cost per analysis.
- No schema change, no endpoint change, no new environment variable — both values were
  already overridable from the environment.
