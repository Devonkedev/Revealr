import type { DarkPatternType, Severity } from './patterns'

/**
 * A commitment detected in the *current* page, still holding a live DOM
 * reference. Lives only inside the content script — never sent through
 * `chrome.runtime.sendMessage` (DOM nodes aren't structured-cloneable).
 */
export interface DetectedPattern {
  id: string
  type: DarkPatternType
  severity: Severity
  /** Heuristic confidence from the deterministic detector, 0–1. */
  confidence: number
  element: HTMLElement
  rect: DOMRect
  /** Short snippet of text/markup used as evidence and as extraction context. */
  evidenceText: string
  evidenceHtml: string
  detectedAt: number
  /**
   * Best-effort summary computed locally via regex — no AI call needed.
   * Shown immediately in the banner; `CG_EXTRACT_COMMITMENT` can enrich it.
   */
  quickSummary?: string
  quickAmount?: string
}

/** The wire-safe projection of a DetectedPattern, safe to postMessage/sendMessage. */
export interface SerializedPattern {
  id: string
  type: DarkPatternType
  severity: Severity
  confidence: number
  evidenceText: string
  detectedAt: number
  quickSummary?: string
  quickAmount?: string
}

export function serializePattern(pattern: DetectedPattern): SerializedPattern {
  return {
    id: pattern.id,
    type: pattern.type,
    severity: pattern.severity,
    confidence: pattern.confidence,
    evidenceText: pattern.evidenceText,
    detectedAt: pattern.detectedAt,
    quickSummary: pattern.quickSummary,
    quickAmount: pattern.quickAmount,
  }
}

/**
 * What the AI is asked for: a structured extraction of the commitment, not
 * an opinion about it. Every field answers "what exactly is the user
 * agreeing to" — nothing here is a judgment call.
 */
export interface ExtractedCommitment {
  type: DarkPatternType
  /** Extraction confidence, 0–1 — not a manipulation score. */
  confidence: number
  /** One-line plain-language summary, e.g. "Then ₹799/month, renews monthly." */
  summary: string
  amount?: string
  billingFrequency?: string
  trialEndDate?: string
  renewalDate?: string
  cancellationRequirement?: string
}

export type CommitmentDetailStatus = 'idle' | 'loading' | 'ready' | 'error'

export interface CommitmentDetailState {
  status: CommitmentDetailStatus
  commitment?: ExtractedCommitment
  error?: string
}

/** "Find My Exit" targets — controls Revealr locates and highlights. Never auto-clicked. */
export type AssistKind = 'reject_cookies' | 'unsubscribe' | 'account_deletion' | 'privacy_controls'

export interface AssistTarget {
  id: string
  kind: AssistKind
  element: HTMLElement
  rect: DOMRect
  label: string
}

/** Non-judgmental page summary: what was found, not how "risky" the page is. */
export interface PageFindingsSummary {
  subscriptionCommitments: number
  checkoutAddons: number
  totalCommitments: number
}

export function summarizeFindings(patterns: Array<{ type: DarkPatternType }>): PageFindingsSummary {
  const subscriptionCommitments = patterns.filter((p) => p.type === 'subscription_commitment').length
  const checkoutAddons = patterns.filter((p) => p.type === 'checkout_addon').length
  return {
    subscriptionCommitments,
    checkoutAddons,
    totalCommitments: subscriptionCommitments + checkoutAddons,
  }
}
