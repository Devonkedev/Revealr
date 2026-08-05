import type { TabState } from '@/types/messages'

/** In-memory (service-worker lifetime) map of the latest scan result per tab. */
const tabStates = new Map<number, TabState>()

export function setTabState(tabId: number, state: Omit<TabState, 'tabId'>): TabState {
  const full: TabState = { tabId, ...state }
  tabStates.set(tabId, full)
  return full
}

export function getTabState(tabId: number): TabState | null {
  return tabStates.get(tabId) ?? null
}

export function clearTabState(tabId: number): void {
  tabStates.delete(tabId)
}
