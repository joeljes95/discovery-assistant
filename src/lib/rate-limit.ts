/**
 * Spend guard for the public deployment.
 *
 * The analyze endpoint has no auth: anyone with the URL can spend the configured API key at
 * roughly nine cents a call. This bounds the damage in two directions — a per-IP window that
 * stops one caller from looping, and a global daily cap that bounds the worst case across all
 * callers, including a distributed one.
 *
 * Deliberately in memory. On Vercel each serverless instance keeps its own counters, so the
 * real ceiling is the cap times the number of live instances — this stops a casual scraper,
 * not a determined attacker. The airtight version is a shared store (Vercel KV, Upstash),
 * which is a second service and a second key. Documented in the README rather than hidden.
 *
 * The clock is injected so the behaviour is testable without sleeping.
 */

export type GuardDecision =
  | { allowed: true }
  | { allowed: false; reason: "ip" | "daily"; retryAfterSeconds: number };

/**
 * What the guard will admit, and what it has admitted. Read-only on purpose: reporting this
 * must not be able to move the counters it reports.
 */
export type GuardSnapshot = {
  perIpMax: number;
  windowMs: number;
  dailyMax: number;
  /** Admitted analyses on THIS instance today. See the note above about instances. */
  dailyCountThisInstance: number;
};

export type SpendGuard = {
  check(ip: string, now?: number): GuardDecision;
  snapshot(now?: number): GuardSnapshot;
};

export type SpendGuardOptions = {
  /** Calls one IP may make inside the window. */
  perIpMax: number;
  /** Width of the sliding per-IP window, in milliseconds. */
  windowMs: number;
  /** Calls all IPs together may make in one UTC day. */
  dailyMax: number;
};

const MS_PER_DAY = 86_400_000;

/** UTC so the reset point does not move with the server's timezone. */
function dayKey(now: number): number {
  return Math.floor(now / MS_PER_DAY);
}

function secondsUntilNextDay(now: number): number {
  return Math.ceil(((dayKey(now) + 1) * MS_PER_DAY - now) / 1000);
}

export function createSpendGuard(options: SpendGuardOptions): SpendGuard {
  const { perIpMax, windowMs, dailyMax } = options;

  /** IP to the timestamps of its calls inside the current window. */
  const hits = new Map<string, number[]>();
  let day = -1;
  let dailyCount = 0;

  return {
    check(ip: string, now: number = Date.now()): GuardDecision {
      const today = dayKey(now);
      if (today !== day) {
        day = today;
        dailyCount = 0;
        // The window is far shorter than a day, so nothing here is still live.
        hits.clear();
      }

      if (dailyCount >= dailyMax) {
        return { allowed: false, reason: "daily", retryAfterSeconds: secondsUntilNextDay(now) };
      }

      const cutoff = now - windowMs;
      const recent = (hits.get(ip) ?? []).filter((at) => at > cutoff);

      if (recent.length >= perIpMax) {
        // The oldest call still in the window is what has to age out.
        const retryAfterSeconds = Math.max(1, Math.ceil((recent[0] - cutoff) / 1000));
        // Store the pruned list even on rejection, so the map cannot grow without bound.
        hits.set(ip, recent);
        return { allowed: false, reason: "ip", retryAfterSeconds };
      }

      recent.push(now);
      hits.set(ip, recent);
      dailyCount += 1;
      return { allowed: true };
    },

    snapshot(now: number = Date.now()): GuardSnapshot {
      // A stale count from yesterday would read as budget already spent, so report what a
      // call right now would see. Deliberately does not reset the counters: reading is not
      // an event, and a monitor polling health must not be able to clear the day's total.
      const sameDay = dayKey(now) === day;
      return {
        perIpMax,
        windowMs,
        dailyMax,
        dailyCountThisInstance: sameDay ? dailyCount : 0,
      };
    },
  };
}
