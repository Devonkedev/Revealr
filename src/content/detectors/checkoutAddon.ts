import type { DetectedPattern } from '@/types/detection'
import { CURRENCY_AMOUNT_REGEX } from '@/utils/constants'
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
  return checkbox.parentElement ? getCleanText(checkbox.parentElement) : ''
}

function extractAmount(text: string): string | undefined {
  return text.match(CURRENCY_AMOUNT_REGEX)?.[0]?.trim()
}

function quickSummaryFor(amount: string | undefined): string {
  return amount ? `${amount} already selected.` : 'Already selected — added without your action.'
}

/**
 * Checkout Guardian: pre-checked add-ons (insurance, warranties, donations,
 * "protection plans") that inflate the total unless the user notices and
 * unchecks them. Binary checkbox state + a locally-extracted price makes
 * this the highest-confidence, lowest-ambiguity detector in the extension —
 * no AI call is needed to produce the headline number.
 */
export function detectCheckoutAddon(root: ParentNode): DetectedPattern[] {
  const results: DetectedPattern[] = []

  const checkboxes = root.querySelectorAll<HTMLInputElement>('input[type="checkbox"]:checked')
  for (const checkbox of checkboxes) {
    if (!isElementVisible(checkbox)) continue
    const label = labelFor(checkbox).toLowerCase()
    if (!label || !ADDON_KEYWORDS.some((kw) => label.includes(kw))) continue

    const target = checkbox.closest('label, li, div') ?? checkbox
    const targetText = getCleanText(target) || label
    const amount = extractAmount(targetText)

    const pattern = makePattern(target, 'checkout_addon', 0.8, targetText)
    pattern.quickAmount = amount
    pattern.quickSummary = quickSummaryFor(amount)
    results.push(pattern)
  }

  const ariaChecked = root.querySelectorAll<HTMLElement>('[role="checkbox"][aria-checked="true"]')
  for (const el of ariaChecked) {
    if (!isElementVisible(el)) continue
    const label = getCleanText(el).toLowerCase()
    if (!ADDON_KEYWORDS.some((kw) => label.includes(kw))) continue

    const text = getCleanText(el)
    const amount = extractAmount(text)
    const pattern = makePattern(el, 'checkout_addon', 0.75, text)
    pattern.quickAmount = amount
    pattern.quickSummary = quickSummaryFor(amount)
    results.push(pattern)
  }

  return results
}
