import { useCallback, useEffect, useState } from 'react'
import type { ExtensionMessage, TabState } from '@/types/messages'
import { sendMessage, sendMessageToTab } from '@/services/messaging'

/** Loads the current tab's cached scan result from the background worker, with a manual rescan action. */
export function useActiveTabState() {
  const [tabId, setTabId] = useState<number | null>(null)
  const [url, setUrl] = useState<string | null>(null)
  const [tabState, setTabState] = useState<TabState | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async (id: number) => {
    const response = await sendMessage<Extract<ExtensionMessage, { type: 'CG_TAB_STATE' }>>({
      type: 'CG_GET_TAB_STATE',
      payload: { tabId: id },
    })
    setTabState(response.payload)
  }, [])

  useEffect(() => {
    let cancelled = false
    chrome.tabs.query({ active: true, currentWindow: true }).then(async ([activeTab]) => {
      if (cancelled) return
      if (!activeTab?.id) {
        setLoading(false)
        return
      }
      setTabId(activeTab.id)
      setUrl(activeTab.url ?? null)
      await refresh(activeTab.id)
      if (!cancelled) setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [refresh])

  const rescan = useCallback(async () => {
    if (!tabId) return
    setLoading(true)
    try {
      await sendMessageToTab(tabId, { type: 'CG_RESCAN' })
      await new Promise((resolve) => setTimeout(resolve, 900))
      await refresh(tabId)
    } finally {
      setLoading(false)
    }
  }, [tabId, refresh])

  const focusPattern = useCallback(
    async (patternId: string) => {
      if (!tabId) return
      await sendMessageToTab(tabId, { type: 'CG_FOCUS_PATTERN', payload: { patternId } })
      window.close()
    },
    [tabId],
  )

  const findExit = useCallback(async () => {
    if (!tabId) return
    await sendMessageToTab(tabId, { type: 'CG_FIND_EXIT' })
    window.close()
  }, [tabId])

  return { tabId, url, tabState, loading, rescan, focusPattern, findExit }
}
