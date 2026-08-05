import type { AssistTarget } from '@/types/detection'
import { ACCOUNT_DELETION_PHRASES, PRIVACY_CONTROL_PHRASES } from '@/utils/constants'
import { getCleanText, isElementVisible, isInteractiveElement } from '@/utils/domUtils'
import { findElementsMatching, makeAssist } from './helpers'

function findFirstMatch(root: ParentNode, phrases: string[]): Element | null {
  const matches = findElementsMatching(root, (text, el) => phrases.some((p) => text.includes(p)) && isInteractiveElement(el))
  for (const el of matches) {
    if (!isElementVisible(el) || getCleanText(el).length > 60) continue
    return el
  }
  return null
}

/**
 * Finds account-deletion and privacy-control links, wherever they're
 * buried in settings pages or footers, so Find My Exit can point at them.
 * Never clicks anything.
 */
export function findAccountControlAssists(root: ParentNode): AssistTarget[] {
  const assists: AssistTarget[] = []

  const deletion = findFirstMatch(root, ACCOUNT_DELETION_PHRASES)
  if (deletion) assists.push(makeAssist(deletion, 'account_deletion', 'Delete account'))

  const privacy = findFirstMatch(root, PRIVACY_CONTROL_PHRASES)
  if (privacy) assists.push(makeAssist(privacy, 'privacy_controls', 'Privacy controls'))

  return assists
}
