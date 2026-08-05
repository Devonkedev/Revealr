import type { AssistTarget, DetectedPattern, TransparencyScoreResult } from '@/types/detection'
import { calculateTransparencyScore, runCountdownDetector, runStatelessDetectors } from './detectors'
import { debounce, throttle } from '@/utils/domUtils'
import { THRESHOLDS } from '@/utils/constants'

type StoreListener = () => void

/** Assigns a stable string id to each element for the lifetime of the page, without leaking memory. */
class ElementIdRegistry {
  private ids = new WeakMap<Element, string>()
  private counter = 0

  idFor(el: Element): string {
    let id = this.ids.get(el)
    if (!id) {
      id = `el_${this.counter++}`
      this.ids.set(el, id)
    }
    return id
  }
}

/**
 * Owns the live detection loop for the current page: a debounced
 * MutationObserver-driven scan for stateless detectors, plus a separate
 * polling loop for the stateful countdown/urgency detector. Exposes a
 * simple pub/sub API so React components can subscribe without knowing
 * anything about MutationObservers or timers.
 */
export class DetectionStore {
  private patterns = new Map<string, DetectedPattern>()
  private assists = new Map<string, AssistTarget>()
  private elementIds = new ElementIdRegistry()
  private listeners = new Set<StoreListener>()
  private mutationObserver: MutationObserver | null = null
  private countdownInterval: ReturnType<typeof setInterval> | null = null
  private debouncedScan = debounce(() => this.runStatelessScan(), THRESHOLDS.SCAN_DEBOUNCE_MS)
  private throttledNotify = throttle(() => this.notify(), 100)
  private started = false

  // Cached snapshots so React's useSyncExternalStore gets a stable reference
  // between real changes instead of a new array on every read.
  private patternsSnapshot: DetectedPattern[] = []
  private assistsSnapshot: AssistTarget[] = []
  private scoreSnapshot: TransparencyScoreResult = calculateTransparencyScore([])

  start(): void {
    if (this.started) return
    this.started = true

    this.runStatelessScan()
    this.runCountdownScan()

    this.mutationObserver = new MutationObserver(() => this.debouncedScan())
    this.mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'class', 'aria-checked', 'aria-hidden', 'hidden'],
    })

    this.countdownInterval = setInterval(() => this.runCountdownScan(), THRESHOLDS.COUNTDOWN_POLL_MS)

    window.addEventListener('resize', this.throttledNotify)
    window.addEventListener('scroll', this.throttledNotify, { passive: true, capture: true })
  }

  stop(): void {
    this.mutationObserver?.disconnect()
    if (this.countdownInterval) clearInterval(this.countdownInterval)
    window.removeEventListener('resize', this.throttledNotify)
    window.removeEventListener('scroll', this.throttledNotify, true)
    this.started = false
  }

  subscribe(listener: StoreListener): () => void {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  /** Stable references — safe to use directly as a useSyncExternalStore snapshot. */
  getPatterns(): DetectedPattern[] {
    return this.patternsSnapshot
  }

  getAssists(): AssistTarget[] {
    return this.assistsSnapshot
  }

  getScore(): TransparencyScoreResult {
    return this.scoreSnapshot
  }

  /** Forces an immediate re-scan (used by the popup's "Rescan page" action). */
  rescan(): void {
    this.runStatelessScan()
    this.runCountdownScan()
  }

  private notify(): void {
    this.patternsSnapshot = Array.from(this.patterns.values()).filter((p) => document.contains(p.element))
    this.assistsSnapshot = Array.from(this.assists.values()).filter((a) => document.contains(a.element))
    this.scoreSnapshot = calculateTransparencyScore(this.patternsSnapshot)
    for (const listener of this.listeners) listener()
  }

  private runStatelessScan(): void {
    const { patterns, assists } = runStatelessDetectors(document.body)
    this.mergePatterns(patterns, (p) => p.type !== 'fake_urgency')
    this.mergeAssists(assists)
    this.notify()
  }

  private runCountdownScan(): void {
    const patterns = runCountdownDetector(document.body)
    this.mergePatterns(patterns, (p) => p.type === 'fake_urgency')
    this.notify()
  }

  /**
   * Replaces all patterns owned by `owns` with the freshly-scanned set;
   * leaves other detectors' entries untouched. Preserves the *existing*
   * pattern's `id` (and original `detectedAt`) across rescans of the same
   * (type, element) pair — otherwise every debounced rescan would mint a
   * new id for the same on-page pattern, and the drawer (which tracks the
   * open explanation by id, and caches the AI response by id) would snap
   * back to the pattern list the moment the page mutated.
   */
  private mergePatterns(fresh: DetectedPattern[], owns: (p: DetectedPattern) => boolean): void {
    const freshKeys = new Set<string>()
    for (const p of fresh) {
      const key = `${p.type}:${this.elementIds.idFor(p.element)}`
      freshKeys.add(key)
      const existing = this.patterns.get(key)
      this.patterns.set(key, existing ? { ...p, id: existing.id, detectedAt: existing.detectedAt } : p)
    }
    for (const [key, existing] of this.patterns) {
      if (!owns(existing)) continue
      if (!freshKeys.has(key) || !document.contains(existing.element)) this.patterns.delete(key)
    }
  }

  private mergeAssists(fresh: AssistTarget[]): void {
    const freshKeys = new Set<string>()
    for (const a of fresh) {
      const key = `${a.kind}:${this.elementIds.idFor(a.element)}`
      freshKeys.add(key)
      const existing = this.assists.get(key)
      this.assists.set(key, existing ? { ...a, id: existing.id } : a)
    }
    for (const [key, existing] of this.assists) {
      if (!freshKeys.has(key) || !document.contains(existing.element)) this.assists.delete(key)
    }
  }
}
