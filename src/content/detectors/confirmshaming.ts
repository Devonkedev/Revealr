import type { DetectedPattern } from '@/types/detection'
import { CONFIRMSHAME_PHRASES } from '@/utils/constants'
import { getCleanText, isInteractiveElement, isElementVisible } from '@/utils/domUtils'
import { makePattern } from './helpers'

const EMOTIONAL_WORDS = [
  'hate',
  'miss out',
  "don't want",
  'uninformed',
  "i'll pass",
  'risk',
  'regret',
  'lose',
  'never',
  'stay poor',
  'stay unprotected',
  'no thanks',
]

/**
 * Confirmshaming: an opt-out control phrased to guilt the user into opting
 * in instead ("No thanks, I don't want to save money").
 *
 * Heuristic: scan interactive elements (button/a/[role=button]) for text
 * that either matches a known confirmshame phrase, or looks like a decline
 * action (starts with a negation) *and* carries emotionally loaded language
 * — a plain "No thanks" or "Cancel" is not flagged.
 */
export function detectConfirmshaming(root: ParentNode): DetectedPattern[] {
  const results: DetectedPattern[] = []
  const candidates = root.querySelectorAll<HTMLElement>('button, a, [role="button"], span, label')

  for (const el of candidates) {
    if (!isInteractiveElement(el) || !isElementVisible(el)) continue
    const text = getCleanText(el)
    if (!text || text.length < 8 || text.length > 160) continue
    const lower = text.toLowerCase()

    const exactPhraseHit = CONFIRMSHAME_PHRASES.some((phrase) => lower.includes(phrase))
    const looksLikeDecline = /^(no[,.\s]|skip|i'll pass|maybe later|not now)/i.test(text)
    const emotionalHit = EMOTIONAL_WORDS.filter((w) => lower.includes(w)).length

    if (exactPhraseHit) {
      results.push(makePattern(el, 'confirmshaming', 0.9, text))
    } else if (looksLikeDecline && emotionalHit > 0 && text.length > 20) {
      results.push(makePattern(el, 'confirmshaming', 0.55 + Math.min(emotionalHit, 3) * 0.1, text))
    }
  }

  return dedupeByElement(results)
}

function dedupeByElement(patterns: DetectedPattern[]): DetectedPattern[] {
  const seen = new Set<Element>()
  const out: DetectedPattern[] = []
  for (const p of patterns) {
    if (seen.has(p.element)) continue
    // Skip if an ancestor of this element is already flagged — avoid nested duplicate hits.
    let isNested = false
    for (const s of seen) {
      if (s.contains(p.element) || p.element.contains(s)) {
        isNested = true
        break
      }
    }
    if (isNested) continue
    seen.add(p.element)
    out.push(p)
  }
  return out
}
