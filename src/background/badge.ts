import type { PageFindingsSummary } from '@/types/detection'

/** Neutral brand color — the badge is a count, not a risk signal, so it doesn't traffic-light. */
const BADGE_COLOR = '#7c6cf6'

/** Shows how many commitments were found on the current tab. No color-coded judgment. */
export async function updateActionBadge(tabId: number, findings: PageFindingsSummary): Promise<void> {
  const text = findings.totalCommitments > 0 ? String(findings.totalCommitments) : ''
  await chrome.action.setBadgeText({ tabId, text })
  await chrome.action.setBadgeBackgroundColor({ tabId, color: BADGE_COLOR })
}

export async function clearActionBadge(tabId: number): Promise<void> {
  await chrome.action.setBadgeText({ tabId, text: '' })
}
