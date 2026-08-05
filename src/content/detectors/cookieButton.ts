import type { AssistTarget, DetectedPattern } from '@/types/detection'
import { ACCEPT_COOKIE_PHRASES, REJECT_COOKIE_PHRASES, THRESHOLDS } from '@/utils/constants'
import { getCleanText, getEffectiveOpacity, isElementVisible, isInteractiveElement } from '@/utils/domUtils'
import { getEffectiveContrast, parseColor } from '@/utils/colorContrast'
import { makeAssist, makePattern } from './helpers'

export interface CookieDetectionResult {
  patterns: DetectedPattern[]
  assists: AssistTarget[]
}

/** Rough "how much does this look like a real, clickable primary button" score. */
function prominenceScore(el: Element): number {
  const style = getComputedStyle(el)
  const rect = el.getBoundingClientRect()
  const bg = parseColor(style.backgroundColor)
  const hasSolidBg = !!bg && bg.a > 0.2
  const area = rect.width * rect.height
  const fontWeight = parseInt(style.fontWeight, 10) || 400
  const opacity = getEffectiveOpacity(el)
  const contrast = getEffectiveContrast(el) ?? 21

  let score = 0
  score += hasSolidBg ? 3 : 0
  score += Math.min(area / 500, 4)
  score += fontWeight >= 600 ? 1.5 : 0
  score += opacity * 2
  score += Math.min(contrast / 4.5, 2)
  return score
}

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
 * Detects cookie-consent banners where the "reject" control is deliberately
 * suppressed (low contrast/opacity/size) relative to "accept". Also emits a
 * Choice Assist target pointing at the true reject button so the UI can
 * highlight it — ChoiceGuard never clicks it automatically.
 */
export function detectHiddenRejectCookies(root: ParentNode): CookieDetectionResult {
  const banner = findCookieBanner(root)
  if (!banner) return { patterns: [], assists: [] }

  const interactive = Array.from(banner.querySelectorAll<HTMLElement>('button, a, [role="button"], input[type="button"]')).filter(
    (el) => isInteractiveElement(el) && isElementVisible(el),
  )

  let acceptEl: HTMLElement | null = null
  let rejectEl: HTMLElement | null = null

  for (const el of interactive) {
    const text = getCleanText(el).toLowerCase()
    if (!acceptEl && ACCEPT_COOKIE_PHRASES.some((p) => text.includes(p))) acceptEl = el
    if (!rejectEl && REJECT_COOKIE_PHRASES.some((p) => text.includes(p))) rejectEl = el
  }

  if (!acceptEl || !rejectEl || acceptEl === rejectEl) return { patterns: [], assists: [] }

  const acceptScore = prominenceScore(acceptEl)
  const rejectScore = prominenceScore(rejectEl)
  const rejectOpacity = getEffectiveOpacity(rejectEl)
  const rejectContrast = getEffectiveContrast(rejectEl) ?? 21

  const ratio = acceptScore / Math.max(rejectScore, 0.1)
  const isSuppressed = ratio >= 1.6 || rejectOpacity < THRESHOLDS.LOW_OPACITY || rejectContrast < THRESHOLDS.LOW_CONTRAST_RATIO

  if (!isSuppressed) return { patterns: [], assists: [] }

  const confidence = Math.min(0.95, 0.4 + ratio / 8 + (rejectContrast < THRESHOLDS.LOW_CONTRAST_RATIO ? 0.2 : 0))

  const pattern = makePattern(rejectEl, 'hidden_reject_cookies', confidence, getCleanText(rejectEl))
  const assist = makeAssist(rejectEl, 'reject_cookies', 'True "reject" option — ChoiceGuard found it for you')

  return { patterns: [pattern], assists: [assist] }
}
