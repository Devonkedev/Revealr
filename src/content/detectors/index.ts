import type { AssistTarget, DetectedPattern } from '@/types/detection'
import { detectSubscriptionCommitment } from './subscriptionCommitment'
import { detectCheckoutAddon } from './checkoutAddon'
import { findRejectCookiesAssist } from './cookieButton'
import { findUnsubscribeAssist } from './hiddenUnsubscribe'
import { findAccountControlAssists } from './accountControls'

export interface ScanResult {
  patterns: DetectedPattern[]
  assists: AssistTarget[]
}

/**
 * Runs every detector against the current DOM snapshot. There's no
 * stateful/polling detector anymore — every commitment Revealr looks
 * for is decidable from a single scan, which keeps the detection loop
 * simple and avoids the false-positive risk of behavior-over-time
 * heuristics (like the old countdown-reset detector).
 */
export function runStatelessDetectors(root: ParentNode): ScanResult {
  const patterns: DetectedPattern[] = [...detectSubscriptionCommitment(root), ...detectCheckoutAddon(root)]

  const assists: AssistTarget[] = [
    ...findRejectCookiesAssist(root),
    ...findUnsubscribeAssist(root),
    ...findAccountControlAssists(root),
  ]

  return { patterns, assists }
}

export { summarizeFindings } from '@/types/detection'
