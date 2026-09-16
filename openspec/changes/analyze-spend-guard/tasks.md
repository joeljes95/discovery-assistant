## 1. Guard

- [x] 1.1 Implement `src/lib/rate-limit.ts`: a factory taking the per-IP limit, the window length and the daily cap, returning a `check(ip, now)` that admits or rejects with a reason and a retry delay; verify it type-checks
- [x] 1.2 Add the caps to `src/lib/config.ts` as environment-overridable values with documented defaults, and document them in `.env.example`; verify the defaults are read when no override is set

## 2. Endpoint

- [x] 2.1 Consult the guard in `POST /api/analyze` after the length checks and before the LLM call, deriving the client address from the leftmost `x-forwarded-for` entry; verify a valid request still reaches the analysis
- [x] 2.2 Return 429 with a `Retry-After` header and the existing error envelope, marking only the per-IP case retryable; verify with curl that the status, the header and the message are correct for both bounds

## 3. Verification

- [x] 3.1 Cover the guard with tests using an injected clock: both bounds, the window sliding, the daily precedence, the UTC reset, and that a rejection does not consume quota; verify the suite passes
- [x] 3.2 Verify the ordering end to end against a running server with the API key blanked, so no call reaches the provider: short input rejected as validation, first valid call admitted, second rejected as 429, and the daily cap tripped from distinct spoofed addresses
- [x] 3.3 Verify `npm run build` passes and both API routes are still server-rendered on demand, since a statically rendered route would never run the guard

## 4. Documentation

- [x] 4.1 Record the decision and the honest limitation in the README, replacing the earlier note that the endpoint had no rate limit; verify the README no longer claims the deployment is kept behind access protection
