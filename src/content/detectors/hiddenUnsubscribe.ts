import type { AssistTarget, DetectedPattern } from '@/types/detection'
import { THRESHOLDS, UNSUBSCRIBE_PHRASES } from '@/utils/constants'
import { getCleanText, getEffectiveOpacity, getFontSizePx, isElementVisible, isInteractiveElement } from '@/utils/domUtils'
import { getEffectiveContrast } from '@/utils/colorContrast'
import { findElementsMatching, makeAssist, makePattern } from './helpers'

export interface UnsubscribeDetectionResult {
  patterns: DetectedPattern[]
  assists: AssistTarget[]
}

/**
 * Hard-to-find unsubscribe/cancel links: present in the DOM, but styled to
 * be easy to miss. When found, ChoiceGuard both flags the pattern and emits
 * a Choice Assist target so the link can be made legible — never clicked.
 */
export function detectHardToFindUnsubscribe(root: ParentNode): UnsubscribeDetectionResult {
  const patterns: DetectedPattern[] = []
  const assists: AssistTarget[] = []

  const matches = findElementsMatching(
    root,
    (text, el) => UNSUBSCRIBE_PHRASES.some((p) => text.includes(p)) && isInteractiveElement(el),
  )

  const seen = new Set<Element>()
  for (const el of matches) {
    if (seen.has(el) || !isElementVisible(el)) continue
    const text = getCleanText(el)
    if (text.length > 60) continue
    seen.add(el)

    const fontSize = getFontSizePx(el)
    const opacity = getEffectiveOpacity(el)
    const contrast = getEffectiveContrast(el) ?? 21

    const isTiny = fontSize < THRESHOLDS.TINY_FONT_PX
    const isFaint = opacity < THRESHOLDS.LOW_OPACITY
    const isLowContrast = contrast < THRESHOLDS.LOW_CONTRAST_RATIO
    const suppressionCount = [isTiny, isFaint, isLowContrast].filter(Boolean).length

    // Always surface it as an assist target (helpful regardless of styling)…
    assists.push(makeAssist(el, 'unsubscribe', 'Cancellation link — made visible by ChoiceGuard'))

    // …but only flag it as a dark pattern if it's actually suppressed.
    if (suppressionCount > 0) {
      const confidence = 0.4 + suppressionCount * 0.2
      patterns.push(makePattern(el, 'hard_to_find_unsubscribe', confidence, text))
    }
  }

  return { patterns, assists }
}
