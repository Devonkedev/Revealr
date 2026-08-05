import type { TransparencyScoreResult } from '@/types/detection'

const RISK_COLOR: Record<TransparencyScoreResult['riskLevel'], string> = {
  low: '#5ee6a0',
  medium: '#fb923c',
  high: '#ff5d5d',
}

/** Reflects the current tab's pattern count + risk level on the toolbar icon. */
export async function updateActionBadge(tabId: number, score: TransparencyScoreResult): Promise<void> {
  const text = score.totalPatterns > 0 ? String(score.totalPatterns) : ''
  await chrome.action.setBadgeText({ tabId, text })
  await chrome.action.setBadgeBackgroundColor({ tabId, color: RISK_COLOR[score.riskLevel] })
}

export async function clearActionBadge(tabId: number): Promise<void> {
  await chrome.action.setBadgeText({ tabId, text: '' })
}
