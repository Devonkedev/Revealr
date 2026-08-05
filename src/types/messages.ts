import type { AIExplanation, SerializedPattern, TransparencyScoreResult } from './detection'
import type { DarkPatternType } from './patterns'
import type { ChoiceGuardSettings } from './settings'

/** Snapshot of detection state for one tab, shared between content script, background, and popup. */
export interface TabState {
  tabId: number
  domain: string
  url: string
  patterns: SerializedPattern[]
  score: TransparencyScoreResult
  lastScanAt: number
}

export interface ExplainRequestPayload {
  patternId: string
  type: DarkPatternType
  evidenceText: string
  evidenceHtml: string
  pageTitle: string
  domain: string
}

export interface ExplainResultPayload {
  patternId: string
  explanation?: AIExplanation
  error?: string
}

/**
 * Discriminated union of every message exchanged over chrome.runtime
 * messaging. Keeping this as one union (rather than stringly-typed
 * `chrome.runtime.sendMessage(type, payload)` calls) gives us exhaustive
 * switch checking in the background router.
 */
export type ExtensionMessage =
  | { type: 'CG_SCAN_RESULT'; payload: Omit<TabState, 'tabId'> }
  | { type: 'CG_GET_TAB_STATE'; payload: { tabId: number } }
  | { type: 'CG_TAB_STATE'; payload: TabState | null }
  | { type: 'CG_EXPLAIN_PATTERN'; payload: ExplainRequestPayload }
  | { type: 'CG_EXPLAIN_RESULT'; payload: ExplainResultPayload }
  | { type: 'CG_GET_SETTINGS' }
  | { type: 'CG_SETTINGS'; payload: ChoiceGuardSettings }
  | { type: 'CG_UPDATE_SETTINGS'; payload: Partial<ChoiceGuardSettings> }
  | { type: 'CG_OPEN_DASHBOARD' }
  | { type: 'CG_FOCUS_PATTERN'; payload: { patternId: string } }
  | { type: 'CG_RESCAN' }

export type MessageOfType<T extends ExtensionMessage['type']> = Extract<ExtensionMessage, { type: T }>
