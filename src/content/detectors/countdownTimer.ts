import type { DetectedPattern } from '@/types/detection'
import { THRESHOLDS, URGENCY_PHRASES } from '@/utils/constants'
import { getCleanText, isElementVisible } from '@/utils/domUtils'
import { findElementsMatching, makePattern } from './helpers'

const COUNTDOWN_REGEX_HMS = /(\d{1,3}):([0-5]\d):([0-5]\d)/
const COUNTDOWN_REGEX_MS = /(?:^|\s)([0-5]?\d):([0-5]\d)(?:\s|$)/

function parseCountdownMs(text: string): number | null {
  const hms = text.match(COUNTDOWN_REGEX_HMS)
  if (hms) {
    const h = Number(hms[1])
    const m = Number(hms[2])
    const s = Number(hms[3])
    return ((h * 60 + m) * 60 + s) * 1000
  }
  const ms = text.match(COUNTDOWN_REGEX_MS)
  if (ms) {
    const m = Number(ms[1])
    const s = Number(ms[2])
    return (m * 60 + s) * 1000
  }
  return null
}

interface CountdownState {
  lastValueMs: number
  lastCheckedAt: number
  resetCount: number
}

/**
 * Stateful detector — must be reused across scans (not recreated per call)
 * so it can compare a timer's value between polls and catch two urgency
 * sub-patterns: (1) a countdown paired with pressure language, and (2) a
 * countdown that silently resets instead of reaching zero, proving the
 * "deadline" was never real.
 */
export class CountdownTimerDetector {
  private state = new Map<Element, CountdownState>()

  scan(root: ParentNode): DetectedPattern[] {
    const results: DetectedPattern[] = []
    const now = Date.now()
    const candidates = this.findCandidates(root)
    const stillPresent = new Set<Element>()

    for (const el of candidates) {
      if (!isElementVisible(el)) continue
      const text = getCleanText(el)
      const valueMs = parseCountdownMs(text)
      if (valueMs === null) continue
      stillPresent.add(el)

      const existing = this.state.get(el)
      if (!existing) {
        this.state.set(el, { lastValueMs: valueMs, lastCheckedAt: now, resetCount: 0 })
        continue // need a second sample before we can judge direction
      }

      const elapsed = now - existing.lastCheckedAt
      const expected = existing.lastValueMs - elapsed
      const jumpUp = valueMs - expected
      if (jumpUp > THRESHOLDS.COUNTDOWN_RESET_TOLERANCE_MS + elapsed * 0.5) {
        existing.resetCount += 1
      }
      existing.lastValueMs = valueMs
      existing.lastCheckedAt = now

      if (existing.resetCount >= 1) {
        results.push(
          makePattern(
            el,
            'fake_urgency',
            Math.min(0.95, 0.7 + existing.resetCount * 0.1),
            `${text} — timer reset ${existing.resetCount}x instead of reaching zero`,
          ),
        )
        continue
      }

      const container = (el.closest('[class],[id]') as Element | null) ?? el
      const nearbyText = getCleanText(container).toLowerCase()
      if (URGENCY_PHRASES.some((p) => nearbyText.includes(p))) {
        results.push(makePattern(el, 'fake_urgency', 0.4, text))
      }
    }

    for (const el of this.state.keys()) {
      if (!stillPresent.has(el) && !document.contains(el)) this.state.delete(el)
    }

    return results
  }

  private findCandidates(root: ParentNode): Element[] {
    const bySelector = Array.from(
      root.querySelectorAll<HTMLElement>('[class*="countdown" i], [class*="timer" i], [id*="countdown" i], [id*="timer" i]'),
    )
    const byText = findElementsMatching(root, (text) => text.length <= 40 && (COUNTDOWN_REGEX_HMS.test(text) || COUNTDOWN_REGEX_MS.test(text)))
    return Array.from(new Set([...bySelector, ...byText]))
  }
}
