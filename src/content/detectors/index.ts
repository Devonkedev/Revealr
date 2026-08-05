import type { AssistTarget, DetectedPattern } from '@/types/detection'
import { detectConfirmshaming } from './confirmshaming'
import { detectHiddenRejectCookies } from './cookieButton'
import { detectForcedContinuity } from './forcedContinuity'
import { detectSneakIntoBasket } from './sneakIntoBasket'
import { detectMisleadingHierarchy } from './buttonHierarchy'
import { detectHardToFindUnsubscribe } from './hiddenUnsubscribe'
import { detectHiddenRecurringBilling } from './hiddenBilling'
import { detectMultipleModalLayers } from './modalLayers'
import { CountdownTimerDetector } from './countdownTimer'

export interface ScanResult {
  patterns: DetectedPattern[]
  assists: AssistTarget[]
}

// Stateful detectors must be reused (not re-instantiated) across scans.
const countdownDetector = new CountdownTimerDetector()

/** Runs every detector that only needs the current DOM snapshot. Call on mutation (debounced). */
export function runStatelessDetectors(root: ParentNode): ScanResult {
  const patterns: DetectedPattern[] = []
  const assists: AssistTarget[] = []

  patterns.push(...detectConfirmshaming(root))
  patterns.push(...detectForcedContinuity(root))
  patterns.push(...detectSneakIntoBasket(root))
  patterns.push(...detectMisleadingHierarchy(root))
  patterns.push(...detectMultipleModalLayers(root))

  const cookie = detectHiddenRejectCookies(root)
  patterns.push(...cookie.patterns)
  assists.push(...cookie.assists)

  const billing = detectHiddenRecurringBilling(root)
  patterns.push(...billing.patterns)
  assists.push(...billing.assists)

  const unsub = detectHardToFindUnsubscribe(root)
  patterns.push(...unsub.patterns)
  assists.push(...unsub.assists)

  return { patterns, assists }
}

/** Runs the stateful countdown/urgency detector. Call on its own polling interval. */
export function runCountdownDetector(root: ParentNode): DetectedPattern[] {
  return countdownDetector.scan(root)
}

export { calculateTransparencyScore } from './scoring'
