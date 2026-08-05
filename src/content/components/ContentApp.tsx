import { useCallback, useEffect, useRef, useState } from 'react'
import { DetectionStore } from '../DetectionStore'
import { useDetectionStore } from '@/hooks/useDetectionStore'
import { useSettings } from '@/hooks/useSettings'
import { Overlay } from './Overlay'
import { FloatingBadge } from './FloatingBadge'
import { Drawer } from './Drawer'
import { sendMessage } from '@/services/messaging'
import { prefetchCommitmentDetails } from '@/hooks/useCommitmentDetails'
import { getCurrentDomain } from '@/utils/domUtils'
import type { AssistKind } from '@/types/detection'
import type { ExtensionMessage } from '@/types/messages'
import type { DetectedPattern } from '@/types/detection'
import { serializePattern } from '@/types/detection'

/** Priority order for "Find My Exit" — the exit someone is most often looking for, first. */
const EXIT_PRIORITY: AssistKind[] = ['unsubscribe', 'reject_cookies', 'account_deletion', 'privacy_controls']

/** Root of the content-script UI: owns the detection loop and composes overlay + badge + drawer. */
export function ContentApp() {
  const storeRef = useRef<DetectionStore | null>(null)
  if (!storeRef.current) storeRef.current = new DetectionStore()
  const store = storeRef.current

  const { settings, loaded } = useSettings()
  const { patterns, assists, findings } = useDetectionStore(store)

  const [drawerOpen, setDrawerOpen] = useState(false)
  const [selectedPatternId, setSelectedPatternId] = useState<string | null>(null)
  const [focusedAssistId, setFocusedAssistId] = useState<string | null>(null)
  const exitCursorRef = useRef(0)

  const selectedPattern = patterns.find((p) => p.id === selectedPatternId) ?? null

  useEffect(() => {
    if (!loaded) return
    if (settings.enabled) store.start()
    else store.stop()
    return () => store.stop()
  }, [loaded, settings.enabled, store])

  // Push scan results to the background worker: powers the popup's commitment count and the (opt-in) registry upload.
  useEffect(() => {
    if (!settings.enabled) return
    sendMessage({
      type: 'CG_SCAN_RESULT',
      payload: {
        domain: getCurrentDomain(),
        url: window.location.href,
        patterns: patterns.map(serializePattern),
        findings,
        lastScanAt: Date.now(),
      },
    }).catch(() => {
      // Background may not be ready yet on first paint — next scan will retry.
    })
  }, [patterns, findings, settings.enabled])

  // Opt-in convenience: warm the AI-extraction cache for every commitment as
  // it's found, instead of waiting for the user to open it. Off by default —
  // see RevealrSettings.autoExtractDetails.
  useEffect(() => {
    if (!settings.autoExtractDetails) return
    for (const pattern of patterns) prefetchCommitmentDetails(pattern)
  }, [patterns, settings.autoExtractDetails])

  const findExit = useCallback(() => {
    const sorted = [...assists].sort((a, b) => EXIT_PRIORITY.indexOf(a.kind) - EXIT_PRIORITY.indexOf(b.kind))
    if (sorted.length === 0) return
    const index = exitCursorRef.current % sorted.length
    const target = sorted[index]!
    exitCursorRef.current = index + 1

    target.element.scrollIntoView({ behavior: 'smooth', block: 'center' })
    setFocusedAssistId(target.id)
    setTimeout(() => setFocusedAssistId((current) => (current === target.id ? null : current)), 2500)
  }, [assists])

  // The popup can ask us to open the drawer focused on a specific commitment, jump straight to Find My Exit, or force a rescan.
  useEffect(() => {
    const listener = (message: ExtensionMessage) => {
      if (message.type === 'CG_FOCUS_PATTERN') {
        setSelectedPatternId(message.payload.patternId)
        setDrawerOpen(true)
      } else if (message.type === 'CG_RESCAN') {
        store.rescan()
      } else if (message.type === 'CG_FIND_EXIT') {
        findExit()
      }
    }
    chrome.runtime.onMessage.addListener(listener)
    return () => chrome.runtime.onMessage.removeListener(listener)
  }, [store, findExit])

  const handleSelectPattern = useCallback((pattern: DetectedPattern) => {
    setSelectedPatternId(pattern.id)
    setDrawerOpen(true)
  }, [])

  const handleOpenDashboard = useCallback(() => {
    sendMessage({ type: 'CG_OPEN_DASHBOARD' }).catch(() => {})
  }, [])

  if (!loaded || !settings.enabled) return null

  return (
    <>
      <Overlay patterns={patterns} assists={assists} onSelectPattern={handleSelectPattern} focusedAssistId={focusedAssistId} visible />
      <FloatingBadge findings={findings} onClick={() => setDrawerOpen((v) => !v)} visible={settings.showFloatingBadge && !drawerOpen} />
      <Drawer
        open={drawerOpen}
        domain={getCurrentDomain()}
        patterns={patterns}
        findings={findings}
        selectedPattern={selectedPattern}
        onSelectPattern={(p) => setSelectedPatternId(p?.id ?? null)}
        onClose={() => setDrawerOpen(false)}
        onFindExit={findExit}
        onOpenDashboard={handleOpenDashboard}
      />
    </>
  )
}
