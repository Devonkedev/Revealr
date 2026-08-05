import type { AssistTarget, DetectedPattern } from '@/types/detection'
import { RECURRING_BILLING_PHRASES, THRESHOLDS } from '@/utils/constants'
import { getCleanText, getEffectiveOpacity, getFontSizePx, isElementVisible } from '@/utils/domUtils'
import { getEffectiveContrast } from '@/utils/colorContrast'
import { findElementsMatching, makeAssist, makePattern } from './helpers'

export interface BillingDetectionResult {
  patterns: DetectedPattern[]
  assists: AssistTarget[]
}

/**
 * Finds recurring-billing disclosures ("will auto-renew at $49.99/mo unless
 * cancelled") rendered in fine print — tiny font, low contrast, or reduced
 * opacity relative to the surrounding page. The disclosure text itself
 * becomes a Choice Assist target so ChoiceGuard can make it legible.
 */
export function detectHiddenRecurringBilling(root: ParentNode): BillingDetectionResult {
  const patterns: DetectedPattern[] = []
  const assists: AssistTarget[] = []
  const seen = new Set<Element>()

  const matches = findElementsMatching(root, (text) => RECURRING_BILLING_PHRASES.some((p) => text.includes(p)))

  for (const el of matches) {
    if (!isElementVisible(el) || seen.has(el)) continue
    const text = getCleanText(el)
    if (text.length > 500) continue // likely a container, not the fine-print element itself

    const fontSize = getFontSizePx(el)
    const opacity = getEffectiveOpacity(el)
    const contrast = getEffectiveContrast(el) ?? 21

    const isTiny = fontSize < THRESHOLDS.TINY_FONT_PX
    const isFaint = opacity < THRESHOLDS.LOW_OPACITY
    const isLowContrast = contrast < THRESHOLDS.LOW_CONTRAST_RATIO

    if (!isTiny && !isFaint && !isLowContrast) continue

    seen.add(el)
    const suppressionCount = [isTiny, isFaint, isLowContrast].filter(Boolean).length
    const confidence = 0.45 + suppressionCount * 0.18

    patterns.push(makePattern(el, 'hidden_recurring_billing', confidence, text))
    assists.push(makeAssist(el, 'recurring_billing', 'Recurring billing terms — made visible by ChoiceGuard'))
  }

  return { patterns, assists }
}
