import { useSyncExternalStore } from 'react'
import type { DetectionStore } from '@/content/DetectionStore'

/** Subscribes a React component to the content script's DetectionStore. */
export function useDetectionStore(store: DetectionStore) {
  const subscribe = (onChange: () => void) => store.subscribe(onChange)

  const patterns = useSyncExternalStore(subscribe, () => store.getPatterns())
  const assists = useSyncExternalStore(subscribe, () => store.getAssists())
  const findings = useSyncExternalStore(subscribe, () => store.getFindings())

  return { patterns, assists, findings }
}
