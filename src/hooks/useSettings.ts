import { useCallback, useEffect, useState } from 'react'
import { DEFAULT_SETTINGS, type ChoiceGuardSettings } from '@/types/settings'
import { getSettings, onSettingsChanged, updateSettings } from '@/services/StorageService'

/** Reactive view of ChoiceGuardSettings, kept in sync across popup/content/dashboard via chrome.storage. */
export function useSettings() {
  const [settings, setSettings] = useState<ChoiceGuardSettings>(DEFAULT_SETTINGS)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let cancelled = false
    getSettings().then((s) => {
      if (!cancelled) {
        setSettings(s)
        setLoaded(true)
      }
    })
    const unsubscribe = onSettingsChanged((s) => setSettings(s))
    return () => {
      cancelled = true
      unsubscribe()
    }
  }, [])

  const update = useCallback((patch: Partial<ChoiceGuardSettings>) => {
    setSettings((prev) => ({ ...prev, ...patch }))
    return updateSettings(patch)
  }, [])

  return { settings, loaded, update }
}
