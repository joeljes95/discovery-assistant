/**
 * Input limits, in their own module because both the server route and the browser need them
 * and the browser must not import anything that reads process.env.
 */

/** Below this there is nothing to analyze. */
export const MIN_NOTES_CHARS = 50;

/**
 * Roughly 70 minutes of speech: verbatim talk runs about 825 characters a minute, and notes
 * for the same call are a fraction of that. The earlier 20,000 was sized for notes and only
 * held about 25 minutes of raw transcript, which is shorter than most discovery calls.
 *
 * Past this the right answer is chunking, which is a later change, not silently truncating
 * the user's transcript.
 */
export const MAX_NOTES_CHARS = 60_000;
