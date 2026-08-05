import type { DetectedPattern } from '@/types/detection'
import { THRESHOLDS } from '@/utils/constants'
import { getCleanText, isElementVisible, isInteractiveElement } from '@/utils/domUtils'
import { makePattern } from './helpers'

function rectArea(el: Element): number {
  const r = el.getBoundingClientRect()
  return r.width * r.height
}

/**
 * Misleading button hierarchy: a binary choice (e.g. "Upgrade now" vs.
 * "Maybe later") where one option is rendered dramatically larger/bolder
 * than its sibling, steering the user toward the business-favorable option
 * purely through visual weight rather than substance.
 */
export function detectMisleadingHierarchy(root: ParentNode): DetectedPattern[] {
  const results: DetectedPattern[] = []
  const containers = root.querySelectorAll<HTMLElement>('div, section, form, footer, [role="dialog"], [role="alertdialog"]')

  for (const container of containers) {
    const containerText = getCleanText(container)
    if (containerText.length > 300) continue // too broad a container to be a focused decision point

    const buttons = Array.from(container.children).filter(
      (c): c is HTMLElement => c instanceof HTMLElement && isInteractiveElement(c) && isElementVisible(c),
    )
    if (buttons.length !== 2) continue

    const [a, b] = buttons as [HTMLElement, HTMLElement]
    const areaA = rectArea(a)
    const areaB = rectArea(b)
    if (areaA < 20 || areaB < 20) continue

    const big = areaA >= areaB ? a : b
    const small = areaA >= areaB ? b : a
    const ratio = Math.max(areaA, areaB) / Math.max(Math.min(areaA, areaB), 1)
    if (ratio < THRESHOLDS.BUTTON_SIZE_RATIO) continue

    const bigText = getCleanText(big)
    const smallText = getCleanText(small)
    if (!bigText || !smallText || bigText === smallText) continue

    const confidence = Math.min(0.9, 0.35 + ratio / 10)
    results.push(makePattern(big, 'misleading_hierarchy', confidence, `"${bigText}" vs. "${smallText}"`))
  }

  return results
}
