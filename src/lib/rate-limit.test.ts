import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createSpendGuard } from "./rate-limit";

/**
 * This guard is the only thing standing between a public URL and an unbounded bill. A silent
 * regression here does not break a screen — it costs money, which is exactly the kind of bug
 * nobody notices until the invoice. The clock is injected, so every case below is exact.
 */

const OPTIONS = { perIpMax: 3, windowMs: 60_000, dailyMax: 5 };

/** A fixed point inside a UTC day, far from midnight so tests do not straddle a reset. */
const T0 = Date.UTC(2026, 8, 15, 12, 0, 0);

describe("per-IP window", () => {
  it("allows exactly perIpMax calls and rejects the next one", () => {
    const guard = createSpendGuard(OPTIONS);
    for (let i = 0; i < 3; i += 1) {
      assert.equal(guard.check("1.1.1.1", T0 + i).allowed, true, `call ${i + 1} should pass`);
    }
    const blocked = guard.check("1.1.1.1", T0 + 3);
    assert.equal(blocked.allowed, false);
    assert.equal(blocked.allowed === false && blocked.reason, "ip");
  });

  it("counts each IP separately", () => {
    const guard = createSpendGuard(OPTIONS);
    for (let i = 0; i < 3; i += 1) guard.check("1.1.1.1", T0);
    assert.equal(guard.check("2.2.2.2", T0).allowed, true);
  });

  it("lets a caller back in once the window slides past its oldest call", () => {
    const guard = createSpendGuard(OPTIONS);
    for (let i = 0; i < 3; i += 1) guard.check("1.1.1.1", T0 + i * 1_000);
    assert.equal(guard.check("1.1.1.1", T0 + 59_000).allowed, false, "still inside the window");
    // The first call was at T0, so it leaves the window just past T0 + 60s.
    assert.equal(guard.check("1.1.1.1", T0 + 60_001).allowed, true);
  });

  it("reports a retry delay that is actually long enough to clear the window", () => {
    const guard = createSpendGuard(OPTIONS);
    for (let i = 0; i < 3; i += 1) guard.check("1.1.1.1", T0);
    const blocked = guard.check("1.1.1.1", T0 + 10_000);
    assert.equal(blocked.allowed, false);
    if (blocked.allowed === false) {
      assert.ok(blocked.retryAfterSeconds >= 1);
      const after = T0 + 10_000 + blocked.retryAfterSeconds * 1_000;
      assert.equal(guard.check("1.1.1.1", after).allowed, true, "waiting as told must work");
    }
  });
});

describe("global daily cap", () => {
  it("bounds the total across different IPs, which is the distributed case", () => {
    const guard = createSpendGuard(OPTIONS);
    for (let i = 0; i < 5; i += 1) {
      assert.equal(guard.check(`10.0.0.${i}`, T0).allowed, true, `caller ${i} should pass`);
    }
    const blocked = guard.check("10.0.0.99", T0);
    assert.equal(blocked.allowed, false);
    assert.equal(blocked.allowed === false && blocked.reason, "daily");
  });

  it("takes priority over the per-IP window, so the message names the real reason", () => {
    const guard = createSpendGuard(OPTIONS);
    for (let i = 0; i < 5; i += 1) guard.check(`10.0.0.${i}`, T0);
    const blocked = guard.check("10.0.0.0", T0);
    assert.equal(blocked.allowed === false && blocked.reason, "daily");
  });

  it("resets at UTC midnight and not on a rolling 24h basis", () => {
    const guard = createSpendGuard(OPTIONS);
    for (let i = 0; i < 5; i += 1) guard.check(`10.0.0.${i}`, T0);
    const nextMidnight = Date.UTC(2026, 8, 16, 0, 0, 0);
    assert.equal(guard.check("10.0.0.99", nextMidnight - 1).allowed, false);
    assert.equal(guard.check("10.0.0.99", nextMidnight).allowed, true);
  });

  it("points a capped caller at the next reset, not at some arbitrary delay", () => {
    const guard = createSpendGuard(OPTIONS);
    for (let i = 0; i < 5; i += 1) guard.check(`10.0.0.${i}`, T0);
    const blocked = guard.check("10.0.0.99", T0);
    assert.equal(blocked.allowed, false);
    if (blocked.allowed === false) {
      // T0 is noon UTC, so the reset is twelve hours out.
      assert.equal(blocked.retryAfterSeconds, 12 * 3_600);
    }
  });
});

describe("a rejection does not consume quota", () => {
  it("does not count blocked calls against the daily cap", () => {
    const guard = createSpendGuard(OPTIONS);
    for (let i = 0; i < 3; i += 1) guard.check("1.1.1.1", T0);
    // Three rejections for this IP; none of them may burn the shared daily budget.
    for (let i = 0; i < 3; i += 1) assert.equal(guard.check("1.1.1.1", T0).allowed, false);
    for (let i = 0; i < 2; i += 1) {
      assert.equal(guard.check(`10.0.0.${i}`, T0).allowed, true, "budget was spent by rejections");
    }
  });
});
