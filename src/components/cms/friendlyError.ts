/**
 * TANGENT CMS — Friendly error messaging.
 *
 * Maps known technical/server error strings to professional, human
 * messages. Anything that still looks technical (or is unknown) falls
 * back to a calm generic line so raw server internals never reach the
 * user. Already-friendly messages (validation text, auth hints) pass
 * through untouched.
 */

const FRIENDLY_ERRORS: Record<string, string> = {
  "Failed to fetch articles":
    "Something went wrong loading your articles. Please try again.",
  "Failed to create article":
    "Couldn't save your article. Check your connection and try again.",
  "Failed to update article":
    "Couldn't save your changes. Check your connection and try again.",
  "Failed to archive article":
    "Couldn't archive that article. Please try again.",
  "Failed to load article":
    "Couldn't load that article. Please try again.",
  "Failed to upload image":
    "Couldn't upload that image. Please try again.",
  "Save failed": "Couldn't save your article. Please try again.",
  "Upload failed": "Couldn't upload that image. Please try again.",
  "Article not found":
    "That article could not be found. It may have been moved or deleted.",
  "Invalid JSON body": "Something went wrong. Please try again.",
};

const GENERIC = "Something went wrong. Please try again.";

// Heuristic: strings that still smell like raw technical errors.
const TECHNICAL_PATTERN =
  /\b(failed|error|exception|supabase|fetch|network request|econn|timeout|abort|500|502|503)\b/i;

export function friendlyError(
  message: string | null | undefined,
  fallback: string = GENERIC,
): string {
  if (!message) return fallback;
  const known = FRIENDLY_ERRORS[message];
  if (known) return known;
  if (TECHNICAL_PATTERN.test(message)) return fallback;
  return message;
}
