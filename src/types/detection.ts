import type { DarkPatternType, Severity } from './patterns'

/**
 * A pattern detected in the *current* page, still holding a live DOM
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
  /** Short snippet of text/markup used as evidence and as AI context. */
  evidenceText: string
  evidenceHtml: string
  detectedAt: number
}

/** The wire-safe projection of a DetectedPattern, safe to postMessage/sendMessage. */
export interface SerializedPattern {
  id: string
  type: DarkPatternType
  severity: Severity
  confidence: number
  evidenceText: string
  detectedAt: number
}

export function serializePattern(pattern: DetectedPattern): SerializedPattern {
  return {
    id: pattern.id,
    type: pattern.type,
    severity: pattern.severity,
    confidence: pattern.confidence,
    evidenceText: pattern.evidenceText,
    detectedAt: pattern.detectedAt,
  }
}

/** Structured output the AI service returns for a given pattern. */
export interface AIExplanation {
  type: DarkPatternType
  /** AI's own confidence in the classification, 0–1. */
  confidence: number
  psychology: string
  whyManipulative: string
  suggestedAlternative: string
  potentialImpact: string
}

export type ExplanationStatus = 'idle' | 'loading' | 'ready' | 'error'

export interface ExplanationState {
  status: ExplanationStatus
  explanation?: AIExplanation
  error?: string
}

/** "Choice Assist" targets — controls ChoiceGuard highlights to help users find them. Never auto-clicked. */
export type AssistKind = 'reject_cookies' | 'unsubscribe' | 'recurring_billing' | 'cancellation_link'

export interface AssistTarget {
  id: string
  kind: AssistKind
  element: HTMLElement
  rect: DOMRect
  label: string
}

export interface RiskLevelInfo {
  level: 'low' | 'medium' | 'high'
  label: string
}

export interface TransparencyScoreResult {
  score: number
  riskLevel: RiskLevelInfo['level']
  patternCounts: Partial<Record<DarkPatternType, number>>
  totalPatterns: number
}
