/**
 * Utility to fix common UTF-8 encoding issues in strings.
 * This is useful when strings are incorrectly interpreted as Latin1 (ISO-8859-1).
 */
export function fixEncoding(str: string | null | undefined): string {
  if (!str) return '';
  
  try {
    // If it's already a clean string with no suspicious chars, return it
    // We check for common broken patterns like Ã¡ (á), Ã© (é), etc.
    if (!str.includes('Ã')) return str;

    // This trick converts individual bytes back into a UTF-8 string
    // escape() converts non-ASCII chars to %XX
    // decodeURIComponent() then interprets those as UTF-8
    return decodeURIComponent(escape(str));
  } catch (e) {
    // If it fails (e.g. malformed URI), return the original string
    return str;
  }
}
