/**
 * Parse "https://example.com as myhandle" syntax.
 * Returns the raw URL and optional handle (lowercased, single word).
 * If no "as <handle>" suffix is present, handle is null.
 */
export function parseLinkWithHandle(input: string): {
  url: string
  handle: string | null
} {
  const trimmed = input.trim()
  // Match: <anything> as <single-word>  (case-insensitive)
  const match = trimmed.match(/^(.+?)\s+as\s+(\S+)$/i)
  if (match) {
    return { url: match[1].trim(), handle: match[2].toLowerCase() }
  }
  return { url: trimmed, handle: null }
}