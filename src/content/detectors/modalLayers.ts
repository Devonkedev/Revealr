import type { DetectedPattern } from '@/types/detection'
import { THRESHOLDS } from '@/utils/constants'
import { isElementVisible } from '@/utils/domUtils'
import { makePattern } from './helpers'

function isFullScreenOverlay(el: Element): boolean {
  const style = getComputedStyle(el)
  if (style.position !== 'fixed' && style.position !== 'absolute') return false
  const zIndex = parseInt(style.zIndex, 10)
  if (Number.isNaN(zIndex) || zIndex < 10) return false

  const rect = el.getBoundingClientRect()
  const viewportArea = window.innerWidth * window.innerHeight
  const coverage = (rect.width * rect.height) / Math.max(viewportArea, 1)
  const looksModal =
    coverage > 0.35 ||
    el.getAttribute('role') === 'dialog' ||
    el.getAttribute('aria-modal') === 'true' ||
    /modal|overlay|popup|dialog/i.test(el.className.toString())

  return looksModal
}

/**
 * Multiple stacked modals/overlays force the user through extra dismiss
 * steps before they can act (or leave), raising the odds they give up and
 * comply instead. Flags the topmost layer once >= threshold layers are
 * simultaneously visible.
 */
export function detectMultipleModalLayers(root: ParentNode): DetectedPattern[] {
  const candidates = Array.from(root.querySelectorAll<HTMLElement>('div, section, aside'))
    .filter((el) => isElementVisible(el) && isFullScreenOverlay(el))
    // Keep only outermost overlay ancestors — nested wrappers inside one modal shouldn't double-count.
    .filter((el, _i, all) => !all.some((other) => other !== el && other.contains(el)))

  if (candidates.length < THRESHOLDS.MODAL_LAYER_COUNT) return []

  const topmost = candidates.reduce((top, el) => {
    const z = parseInt(getComputedStyle(el).zIndex, 10) || 0
    const topZ = parseInt(getComputedStyle(top).zIndex, 10) || 0
    return z >= topZ ? el : top
  }, candidates[0]!)

  if (!topmost) return []

  return [makePattern(topmost, 'multiple_modal_layers', 0.6, `${candidates.length} stacked overlay layers detected`)]
}
