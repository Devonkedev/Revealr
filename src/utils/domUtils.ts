/** Shared DOM inspection helpers used across detectors. */

export function isElementVisible(el: Element): boolean {
  const style = getComputedStyle(el)
  if (style.display === 'none' || style.visibility === 'hidden') return false
  const rect = el.getBoundingClientRect()
  return rect.width > 0 && rect.height > 0
}

/** Font-size in px, resolved through getComputedStyle (handles rem/em/%). */
export function getFontSizePx(el: Element): number {
  return parseFloat(getComputedStyle(el).fontSize) || 16
}

export function getOpacity(el: Element): number {
  return parseFloat(getComputedStyle(el).opacity)
}

/** Multiplies opacity up the ancestor chain — a 0.5-opacity child inside a 0.5-opacity parent is effectively 0.25. */
export function getEffectiveOpacity(el: Element): number {
  let opacity = 1
  let current: Element | null = el
  while (current) {
    opacity *= getOpacity(current)
    if (opacity === 0) break
    current = current.parentElement
  }
  return opacity
}

export function getCleanText(el: Element): string {
  return (el.textContent ?? '').replace(/\s+/g, ' ').trim()
}

/** Truncated outerHTML snippet, safe to send to an LLM without blowing the token budget. */
export function getEvidenceHtml(el: Element, maxLen = 600): string {
  const html = el.outerHTML ?? ''
  return html.length > maxLen ? html.slice(0, maxLen) + '…' : html
}

export function debounce<Args extends unknown[]>(fn: (...args: Args) => void, waitMs: number) {
  let timeout: ReturnType<typeof setTimeout> | undefined
  return (...args: Args) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => fn(...args), waitMs)
  }
}

export function throttle<Args extends unknown[]>(fn: (...args: Args) => void, waitMs: number) {
  let last = 0
  let scheduled: ReturnType<typeof setTimeout> | undefined
  return (...args: Args) => {
    const now = Date.now()
    const remaining = waitMs - (now - last)
    if (remaining <= 0) {
      last = now
      fn(...args)
    } else if (!scheduled) {
      scheduled = setTimeout(() => {
        last = Date.now()
        scheduled = undefined
        fn(...args)
      }, remaining)
    }
  }
}

/** Text likely to be a clickable control: buttons, links, and elements with button-like roles. */
export function isInteractiveElement(el: Element): boolean {
  const tag = el.tagName.toLowerCase()
  if (tag === 'button' || tag === 'a' || tag === 'input') return true
  const role = el.getAttribute('role')
  if (role === 'button' || role === 'link') return true
  const style = getComputedStyle(el)
  return style.cursor === 'pointer'
}

export function isCurrentTopFrame(): boolean {
  try {
    return window.self === window.top
  } catch {
    return false
  }
}

let cachedDomain: string | null = null
export function getCurrentDomain(): string {
  if (!cachedDomain) {
    cachedDomain = window.location.hostname.replace(/^www\./, '')
  }
  return cachedDomain
}
