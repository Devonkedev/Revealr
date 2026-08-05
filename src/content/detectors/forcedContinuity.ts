import type { DetectedPattern } from '@/types/detection'
import { RECURRING_BILLING_PHRASES, THRESHOLDS } from '@/utils/constants'
import { getCleanText, getEffectiveOpacity, getFontSizePx, isElementVisible } from '@/utils/domUtils'
import { getEffectiveContrast } from '@/utils/colorContrast'
import { findElementsMatching, makePattern } from './helpers'

const PRICE_AFTER_TRIAL_RE = /\$\s?\d+(\.\d{2})?\s*\/?\s*(mo|month|yr|year)/i

/**
 * Forced continuity: a "free trial" CTA whose auto-converts-to-paid terms
 * are disclosed nearby, but suppressed (tiny/low-contrast/faint) relative
 * to the CTA itself — the disclosure technically exists but is designed
 * not to be read before signup.
 */
export function detectForcedContinuity(root: ParentNode): DetectedPattern[] {
  const results: DetectedPattern[] = []
  const trialCtas = findElementsMatching(
    root,
    (text) => /free trial/i.test(text) && text.length < 120,
  )

  for (const cta of trialCtas) {
    if (!isElementVisible(cta)) continue

    // Search up to 4 ancestor levels for a nearby billing disclosure.
    let container: Element | null = cta
    for (let i = 0; i < 4 && container; i++) container = container.parentElement
    if (!container) continue

    const disclosureMatches = findElementsMatching(
      container,
      (text) => RECURRING_BILLING_PHRASES.some((p) => text.includes(p)) || PRICE_AFTER_TRIAL_RE.test(text),
    )

    for (const disclosure of disclosureMatches) {
      if (disclosure === cta || disclosure.contains(cta) || cta.contains(disclosure)) continue
      if (!isElementVisible(disclosure)) continue
      const text = getCleanText(disclosure)
      if (text.length > 400) continue

      const fontSize = getFontSizePx(disclosure)
      const opacity = getEffectiveOpacity(disclosure)
      const contrast = getEffectiveContrast(disclosure) ?? 21
      const suppressed = fontSize < THRESHOLDS.TINY_FONT_PX || opacity < THRESHOLDS.LOW_OPACITY || contrast < THRESHOLDS.LOW_CONTRAST_RATIO

      if (!suppressed) continue

      results.push(makePattern(cta, 'forced_continuity', 0.7, `${getCleanText(cta)} — ${text}`))
      break
    }
  }

  return results
}
