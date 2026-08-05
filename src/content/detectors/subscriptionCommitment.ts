import type { DetectedPattern } from '@/types/detection'
import { BILLING_FREQUENCY_REGEX, CURRENCY_AMOUNT_REGEX, FREE_TRIAL_PHRASES, RECURRING_BILLING_PHRASES, THRESHOLDS } from '@/utils/constants'
import { getCleanText, getEffectiveOpacity, getFontSizePx, isElementVisible } from '@/utils/domUtils'
import { getEffectiveContrast } from '@/utils/colorContrast'
import { findElementsMatching, makePattern } from './helpers'

const TRIAL_DURATION_REGEX = /(\d+)[\s-]?(day|days|week|weeks|month|months)\b/i

/** How many "fine print" signals this element shows — used to bump confidence, never to gate detection. */
function suppressionCount(el: Element): number {
  const fontSize = getFontSizePx(el)
  const opacity = getEffectiveOpacity(el)
  const contrast = getEffectiveContrast(el) ?? 21
  return [fontSize < THRESHOLDS.TINY_FONT_PX, opacity < THRESHOLDS.LOW_OPACITY, contrast < THRESHOLDS.LOW_CONTRAST_RATIO].filter(Boolean).length
}

function extractAmount(text: string): string | undefined {
  return text.match(CURRENCY_AMOUNT_REGEX)?.[0]?.trim()
}

function extractFrequency(text: string): string | undefined {
  const word = text.match(BILLING_FREQUENCY_REGEX)?.[1]?.toLowerCase()
  if (!word) return undefined
  if (word.startsWith('month')) return 'monthly'
  if (word.startsWith('year') || word.startsWith('annual')) return 'yearly'
  if (word.startsWith('week')) return 'weekly'
  return word
}

function extractTrialDuration(text: string): string | undefined {
  const match = text.match(TRIAL_DURATION_REGEX)
  return match ? `${match[1]} ${match[2]!.toLowerCase()}` : undefined
}

/** Plain-language summary shown in the banner immediately — computed locally, no AI call needed. */
function buildQuickSummary(hasTrial: boolean, trialDuration: string | undefined, amount: string | undefined, frequency: string | undefined): string {
  const parts: string[] = []
  if (hasTrial) {
    parts.push(trialDuration ? `Free trial ends in ${trialDuration}.` : 'Free trial converts to a paid plan.')
  }
  if (amount) {
    parts.push(frequency ? `Then ${amount}, renews ${frequency}.` : `Then ${amount}.`)
  } else if (!hasTrial) {
    parts.push('Recurring charge mentioned — open for details.')
  }
  return parts.join(' ')
}

/**
 * Subscription Trap Shield: surfaces recurring-billing commitments —
 * whether they arrive as a "free trial" that quietly converts to paid, or
 * as a plain subscription checkout — regardless of how the terms are
 * styled. Fires on the presence of a real commitment, not on how well it's
 * hidden; suppressed styling (tiny/faint/low-contrast) only raises
 * confidence, it's never required.
 */
export function detectSubscriptionCommitment(root: ParentNode): DetectedPattern[] {
  const results: DetectedPattern[] = []
  const claimed = new Set<Element>()

  // Pass 1: a free-trial CTA with billing/price terms disclosed nearby — the highest-value case.
  const trialCtas = findElementsMatching(root, (text) => FREE_TRIAL_PHRASES.some((p) => text.includes(p)) && text.length < 120)

  for (const cta of trialCtas) {
    if (!isElementVisible(cta)) continue
    let container: Element | null = cta
    for (let i = 0; i < 4 && container; i++) container = container.parentElement
    if (!container) continue

    const disclosures = findElementsMatching(
      container,
      (text) => RECURRING_BILLING_PHRASES.some((p) => text.includes(p)) || CURRENCY_AMOUNT_REGEX.test(text),
    )

    for (const disclosure of disclosures) {
      if (disclosure === cta || disclosure.contains(cta) || cta.contains(disclosure)) continue
      if (!isElementVisible(disclosure) || claimed.has(disclosure)) continue
      const text = getCleanText(disclosure)
      if (text.length > 400) continue

      claimed.add(disclosure)
      const ctaText = getCleanText(cta)
      const combined = `${ctaText} ${text}`
      const amount = extractAmount(combined)
      const frequency = extractFrequency(combined)
      const trialDuration = extractTrialDuration(combined)

      const confidence = Math.min(0.95, 0.6 + suppressionCount(disclosure) * 0.1 + (amount ? 0.1 : 0))
      const pattern = makePattern(disclosure, 'subscription_commitment', confidence, `${ctaText} — ${text}`)
      pattern.quickSummary = buildQuickSummary(true, trialDuration, amount, frequency)
      pattern.quickAmount = amount
      results.push(pattern)
      break
    }
  }

  // Pass 2: standalone recurring-billing disclosures not already captured above (e.g. a plain subscription checkout).
  const billingMatches = findElementsMatching(root, (text) => RECURRING_BILLING_PHRASES.some((p) => text.includes(p)))
  for (const el of billingMatches) {
    if (claimed.has(el) || !isElementVisible(el)) continue
    const text = getCleanText(el)
    if (text.length > 400) continue
    claimed.add(el)

    const amount = extractAmount(text)
    const frequency = extractFrequency(text)
    const confidence = Math.min(0.9, 0.55 + suppressionCount(el) * 0.1 + (amount ? 0.1 : 0))
    const pattern = makePattern(el, 'subscription_commitment', confidence, text)
    pattern.quickSummary = buildQuickSummary(false, undefined, amount, frequency)
    pattern.quickAmount = amount
    results.push(pattern)
  }

  return results
}
