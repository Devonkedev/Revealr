import { useCallback, useEffect, useRef, useState } from 'react'
import { DetectionStore } from '../DetectionStore'
import { useDetectionStore } from '@/hooks/useDetectionStore'
import { useSettings } from '@/hooks/useSettings'
import { Overlay } from './Overlay'
import { FloatingBadge } from './FloatingBadge'
import { Drawer } from './Drawer'
import { sendMessage } from '@/services/messaging'
import { getCurrentDomain } from '@/utils/domUtils'
import type { ExtensionMessage } from '@/types/messages'
import type { DetectedPattern } from '@/types/detection'
import { serializePattern } from '@/types/detection'

/** Root of the content-script UI: owns the detection loop and composes overlay + badge + drawer. */
export function ContentApp() {
  const storeRef = useRef<DetectionStore | null>(null)
  if (!storeRef.current) storeRef.current = new DetectionStore()
  const store = storeRef.current

  const { settings, loaded } = useSettings()
  const { patterns, assists, score } = useDetectionStore(store)

  const [drawerOpen, setDrawerOpen] = useState(false)
  const [selectedPatternId, setSelectedPatternId] = useState<string | null>(null)
  const selectedPattern = patterns.find((p) => p.id === selectedPatternId) ?? null

  useEffect(() => {
    if (!loaded) return
    if (settings.enabled) store.start()
    else store.stop()
    return () => store.stop()
  }, [loaded, settings.enabled, store])

  // Push scan results to the background worker: powers the popup badge and the (opt-in) registry upload.
  useEffect(() => {
    if (!settings.enabled) return
    sendMessage({
      type: 'CG_SCAN_RESULT',
      payload: {
        domain: getCurrentDomain(),
        url: window.location.href,
        patterns: patterns.map(serializePattern),
        score,
        lastScanAt: Date.now(),
      },
    }).catch(() => {
      // Background may not be ready yet on first paint — next scan will retry.
    })
  }, [patterns, score, settings.enabled])

  // The popup can ask us to open the drawer focused on a specific pattern, or force a rescan.
  useEffect(() => {
    const listener = (message: ExtensionMessage) => {
      if (message.type === 'CG_FOCUS_PATTERN') {
        setSelectedPatternId(message.payload.patternId)
        setDrawerOpen(true)
      } else if (message.type === 'CG_RESCAN') {
        store.rescan()
      }
    }
    chrome.runtime.onMessage.addListener(listener)
    return () => chrome.runtime.onMessage.removeListener(listener)
  }, [store])

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
      <Overlay patterns={patterns} assists={assists} onSelectPattern={handleSelectPattern} visible />
      <FloatingBadge score={score} onClick={() => setDrawerOpen((v) => !v)} visible={settings.showFloatingBadge && !drawerOpen} />
      <Drawer
        open={drawerOpen}
        domain={getCurrentDomain()}
        patterns={patterns}
        score={score}
        selectedPattern={selectedPattern}
        onSelectPattern={(p) => setSelectedPatternId(p?.id ?? null)}
        onClose={() => setDrawerOpen(false)}
        onOpenDashboard={handleOpenDashboard}
      />
    </>
  )
}
