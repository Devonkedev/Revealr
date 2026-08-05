import type { DarkPatternType } from '@/types/patterns'
import { PATTERN_META } from '@/types/patterns'
import type { AssistTarget, AssistKind, DetectedPattern } from '@/types/detection'
import { generateId } from '@/utils/id'
import { getCleanText, getEvidenceHtml } from '@/utils/domUtils'

/** Builds a DetectedPattern from a live element. Confidence is clamped to [0,1]. */
export function makePattern(
  el: Element,
  type: DarkPatternType,
  confidence: number,
  evidenceTextOverride?: string,
): DetectedPattern {
  const meta = PATTERN_META[type]
  return {
    id: generateId('pat'),
    type,
    severity: meta.defaultSeverity,
    confidence: Math.max(0, Math.min(1, confidence)),
    element: el as HTMLElement,
    rect: el.getBoundingClientRect(),
    evidenceText: (evidenceTextOverride ?? getCleanText(el)).slice(0, 400),
    evidenceHtml: getEvidenceHtml(el),
    detectedAt: Date.now(),
  }
}

export function makeAssist(el: Element, kind: AssistKind, label: string): AssistTarget {
  return {
    id: generateId('assist'),
    kind,
    element: el as HTMLElement,
    rect: el.getBoundingClientRect(),
    label,
  }
}

/** Depth-first text-matching search: returns elements whose *direct* text content matches the predicate. */
export function findElementsMatching(root: ParentNode, predicate: (text: string, el: Element) => boolean): Element[] {
  const matches: Element[] = []
  const walker = document.createTreeWalker(root as Node, NodeFilter.SHOW_ELEMENT)
  let node = walker.nextNode() as Element | null
  while (node) {
    const text = getCleanText(node)
    if (text && predicate(text.toLowerCase(), node)) {
      matches.push(node)
    }
    node = walker.nextNode() as Element | null
  }
  return matches
}

/** Prefers the smallest (most specific) element containing the match, to avoid flagging huge ancestor containers. */
export function smallestMatchingDescendant(el: Element, predicate: (text: string) => boolean): Element {
  let current = el
  let child = Array.from(current.children).find((c) => predicate(getCleanText(c).toLowerCase()))
  while (child) {
    current = child
    child = Array.from(current.children).find((c) => predicate(getCleanText(c).toLowerCase()))
  }
  return current
}
