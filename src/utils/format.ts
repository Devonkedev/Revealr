export function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n))
}

export function formatRelativeTime(timestampMs: number): string {
  const diffSec = Math.round((Date.now() - timestampMs) / 1000)
  if (diffSec < 5) return 'just now'
  if (diffSec < 60) return `${diffSec}s ago`
  const diffMin = Math.round(diffSec / 60)
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHr = Math.round(diffMin / 60)
  if (diffHr < 24) return `${diffHr}h ago`
  const diffDay = Math.round(diffHr / 24)
  return `${diffDay}d ago`
}

export function domainFromUrl(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

export function toPercent(ratio: number): string {
  return `${Math.round(ratio * 100)}%`
}

export function isoDay(timestampMs: number): string {
  return new Date(timestampMs).toISOString().slice(0, 10)
}
