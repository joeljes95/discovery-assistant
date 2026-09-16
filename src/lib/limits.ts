/**
 * Input limits, in their own module because both the server route and the browser need them
 * and the browser must not import anything that reads process.env.
 */

/** Below this there is nothing to analyze. */
export const MIN_NOTES_CHARS = 50;

/**
 * Roughly a 30-40 minute call. Past this the right answer is chunking, which is a later
 * change, not silently truncating the user's transcript.
 */
export const MAX_NOTES_CHARS = 20_000;
