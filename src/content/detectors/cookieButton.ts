import type { AssistTarget } from '@/types/detection'
import { REJECT_COOKIE_PHRASES } from '@/utils/constants'
import { getCleanText, isElementVisible, isInteractiveElement } from '@/utils/domUtils'
import { makeAssist } from './helpers'

function findCookieBanner(root: ParentNode): Element | null {
  const candidates = root.querySelectorAll<HTMLElement>(
    '[class*="cookie" i], [id*="cookie" i], [class*="consent" i], [id*="consent" i], [aria-label*="cookie" i]',
  )
  for (const el of candidates) {
    if (!isElementVisible(el)) continue
    const text = getCleanText(el).toLowerCase()
    if (text.includes('cookie') && text.length < 3000) return el
  }
  return null
}

/**
 * Finds the real "reject" control in a cookie-consent banner, however it's
 * styled, so Find My Exit can point straight at it. This makes no claim
 * about whether the banner is manipulative — it just finds the option and
 * makes it visible. Never clicks it.
 */
export function findRejectCookiesAssist(root: ParentNode): AssistTarget[] {
  const banner = findCookieBanner(root)
  if (!banner) return []

  const interactive = Array.from(banner.querySelectorAll<HTMLElement>('button, a, [role="button"], input[type="button"]')).filter(
    (el) => isInteractiveElement(el) && isElementVisible(el),
  )

  for (const el of interactive) {
    const text = getCleanText(el).toLowerCase()
    if (REJECT_COOKIE_PHRASES.some((p) => text.includes(p))) {
      return [makeAssist(el, 'reject_cookies', 'Reject cookies')]
    }
  }
  return []
}
