import type { AssistTarget } from '@/types/detection'
import { UNSUBSCRIBE_PHRASES } from '@/utils/constants'
import { getCleanText, isElementVisible, isInteractiveElement } from '@/utils/domUtils'
import { findElementsMatching, makeAssist } from './helpers'

/**
 * Finds the cancel/unsubscribe link on the page, however buried, so Find My
 * Exit can scroll straight to it. Never clicks it.
 */
export function findUnsubscribeAssist(root: ParentNode): AssistTarget[] {
  const matches = findElementsMatching(root, (text, el) => UNSUBSCRIBE_PHRASES.some((p) => text.includes(p)) && isInteractiveElement(el))

  for (const el of matches) {
    if (!isElementVisible(el)) continue
    if (getCleanText(el).length > 60) continue
    return [makeAssist(el, 'unsubscribe', 'Cancel / unsubscribe')]
  }
  return []
}
