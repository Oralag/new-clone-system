/**
 * Format a UTC date string to local time.
 * Shows time only if it's non-zero (not 00:00), otherwise shows date only.
 */
export function fmtDt(v: string | undefined | null): string {
  if (!v) return ''
  const s = String(v)
  // Parse as UTC: append Z if no timezone indicator
  const hasTimezone = s.endsWith('Z') || /[+-]\d{2}:\d{2}$/.test(s)
  const utcStr = hasTimezone ? s : s.replace(' ', 'T') + 'Z'
  const d = new Date(utcStr)
  if (isNaN(d.getTime())) {
    if (s.length >= 10) return s.slice(0, 10)
    return s
  }
  const pad = (n: number) => String(n).padStart(2, '0')
  const date = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
  const time = `${pad(d.getHours())}:${pad(d.getMinutes())}`
  if (time === '00:00') return date
  return `${date} ${time}`
}
