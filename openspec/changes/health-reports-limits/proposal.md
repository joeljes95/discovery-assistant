## Why

The spend guard is deployed, but there is no way to confirm from outside that it is actually running in production. Tripping it takes five real analyses, which costs money and three minutes, so in practice nobody checks. A guard nobody can verify is a guard you are trusting on faith.

`GET /api/health` already answers "is the service up and is it configured". The limits are configuration, and the count of analyses served is the evidence that the guard is doing something. Both belong in the same place, and both are free to read.

## What Changes

- `GET /api/health` reports the configured spend limits: the per-address maximum, the window length, and the daily cap.
- It also reports how many analyses the responding instance has admitted today. A configuration echo proves only that the new build is live; a count that moves proves the guard is being consulted.
- The response documents that the count is per instance, so a reader does not mistake it for a global total.

Out of scope: remaining per-address quota (would require identifying the caller on a health check), and any authentication on the endpoint.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `service-health`: the health endpoint additionally reports the spend limits and the responding instance's admitted-analyses count for the current UTC day.

## Impact

- `src/lib/rate-limit.ts` exposes a read-only snapshot of the guard's configuration and current daily count.
- `src/app/api/health/route.ts` includes that snapshot in its response.
- The guard instance is shared between the analyze route and the health route, so it moves to its own module-level owner rather than being constructed inside the analyze route.
- No new environment variables. No change to the analyze endpoint's behaviour.
