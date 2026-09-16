## 1. Expose the guard's state

- [ ] 1.1 Add a read-only `snapshot()` to the guard in `src/lib/rate-limit.ts` returning the configured limits and the current UTC day's admitted count, without allowing the count to be mutated from outside; verify with a test that the count tracks admitted calls and ignores rejected ones
- [ ] 1.2 Move the guard instance into a module both routes can import, so health and analyze observe the same counters; verify the analyze endpoint still rate limits after the move

## 2. Report it

- [ ] 2.1 Include the snapshot in `GET /api/health` under a key that names the count as per-instance; verify with curl that the limits and the count appear and no secret value is present
- [ ] 2.2 Verify the count moves: read health, admit one analysis against a blanked key so no provider call is made, read health again and confirm the count incremented

## 3. Ship

- [ ] 3.1 Update the README's health example and note what the count does and does not mean; verify the documented response matches the real one
- [ ] 3.2 Deploy and confirm against the live URL that the limits are reported in production
