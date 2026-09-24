/**
 * Input limits, in their own module because both the server route and the browser need them
 * and the browser must not import anything that reads process.env.
 */

/** Below this there is nothing to analyze. */
export const MIN_NOTES_CHARS = 50;

/**
 * A fast hour-long call with room to spare. Conversational Spanish runs about 900-1,100
 * characters a minute, so an hour is 55,000-65,000 characters and this holds 80-90 minutes at
 * a normal pace. Notes for the same call are a fraction of that.
 *
 * History: 20,000 was sized for notes and held about 25 minutes of transcript. 60,000 assumed
 * 825 characters a minute, and a real one-hour Whisper transcript went past it.
 *
 * Past this the right answer is chunking, which is a later change, not silently truncating
 * the user's transcript.
 */
export const MAX_NOTES_CHARS = 90_000;
