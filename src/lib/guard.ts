/**
 * The one guard instance the app uses.
 *
 * It lives here rather than inside a route because two routes need the same counters: the
 * analyze route consults them, and the health route reports them. Two instances would mean
 * health cheerfully reporting a count that belongs to nobody.
 *
 * Module scope is what makes the counters survive between requests on a warm serverless
 * instance, and what limits them to that instance. See rate-limit.ts.
 */
import { RATE_LIMIT } from "./config";
import { createSpendGuard } from "./rate-limit";

export const spendGuard = createSpendGuard(RATE_LIMIT);
