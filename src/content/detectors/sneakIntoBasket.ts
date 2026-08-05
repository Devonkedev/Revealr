import type { DetectedPattern } from '@/types/detection'
import { getCleanText, isElementVisible } from '@/utils/domUtils'
import { makePattern } from './helpers'

const ADDON_KEYWORDS = [
  'protection plan',
  'insurance',
  'warranty',
  'donate',
  'donation',
  'gift wrap',
  'priority support',
  'travel protection',
  'extended coverage',
  'checkout boost',
  'shipping protection',
]

function labelFor(checkbox: HTMLInputElement): string {
  if (checkbox.id) {
    const byFor = document.querySelector(`label[for="${CSS.escape(checkbox.id)}"]`)
    if (byFor) return getCleanText(byFor)
  }
  const parentLabel = checkbox.closest('label')
  if (parentLabel) return getCleanText(parentLabel)
  // Fall back to nearby sibling text.
  const sibling = checkbox.parentElement ? getCleanText(checkbox.parentElement) : ''
  return sibling
}

/**
 * Sneak into basket: a pre-checked add-on (insurance, warranty, donation,
 * "protection plan") that inflates the cart total unless the user notices
 * and unchecks it themselves.
 */
export function detectSneakIntoBasket(root: ParentNode): DetectedPattern[] {
  const results: DetectedPattern[] = []
  const checkboxes = root.querySelectorAll<HTMLInputElement>('input[type="checkbox"]:checked')

  for (const checkbox of checkboxes) {
    if (!isElementVisible(checkbox)) continue
    const label = labelFor(checkbox).toLowerCase()
    if (!label) continue
    const hit = ADDON_KEYWORDS.some((kw) => label.includes(kw))
    if (!hit) continue

    const target = checkbox.closest('label, li, div') ?? checkbox
    results.push(makePattern(target, 'sneak_into_basket', 0.75, getCleanText(target) || label))
  }

  // aria-checked="true" custom checkbox widgets (div/span role=checkbox).
  const ariaChecked = root.querySelectorAll<HTMLElement>('[role="checkbox"][aria-checked="true"]')
  for (const el of ariaChecked) {
    if (!isElementVisible(el)) continue
    const label = getCleanText(el).toLowerCase()
    if (ADDON_KEYWORDS.some((kw) => label.includes(kw))) {
      results.push(makePattern(el, 'sneak_into_basket', 0.7, getCleanText(el)))
    }
  }

  return results
}
