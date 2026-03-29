/**
 * Format a date string for display: always show date + time (YYYY-MM-DD HH:mm).
 * Falls back to the original string if it's too short or empty.
 */
export function fmtDt(v: string | undefined | null): string {
  if (!v) return ''
  const s = String(v)
  if (s.length >= 16) return s.slice(0, 16).replace('T', ' ')
  if (s.length >= 10) return s.slice(0, 10)
  return s
}
