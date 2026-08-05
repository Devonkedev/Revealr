import type { ExtractedCommitment, PageFindingsSummary, SerializedPattern } from './detection'
import type { DarkPatternType } from './patterns'
import type { RevealrSettings } from './settings'

/** Snapshot of findings for one tab, shared between content script, background, and popup. */
export interface TabState {
  tabId: number
  domain: string
  url: string
  patterns: SerializedPattern[]
  findings: PageFindingsSummary
  lastScanAt: number
}

export interface ExtractRequestPayload {
  patternId: string
  type: DarkPatternType
  evidenceText: string
  evidenceHtml: string
  pageTitle: string
  domain: string
  quickSummary?: string
  quickAmount?: string
}

export interface ExtractResultPayload {
  patternId: string
  commitment?: ExtractedCommitment
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
  | { type: 'CG_EXTRACT_COMMITMENT'; payload: ExtractRequestPayload }
  | { type: 'CG_EXTRACT_RESULT'; payload: ExtractResultPayload }
  | { type: 'CG_GET_SETTINGS' }
  | { type: 'CG_SETTINGS'; payload: RevealrSettings }
  | { type: 'CG_UPDATE_SETTINGS'; payload: Partial<RevealrSettings> }
  | { type: 'CG_OPEN_DASHBOARD' }
  | { type: 'CG_FOCUS_PATTERN'; payload: { patternId: string } }
  | { type: 'CG_FIND_EXIT' }
  | { type: 'CG_RESCAN' }

export type MessageOfType<T extends ExtensionMessage['type']> = Extract<ExtensionMessage, { type: T }>
