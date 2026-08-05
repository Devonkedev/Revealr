import type { ExtensionMessage } from '@/types/messages'
import { getSettings, updateSettings } from '@/services/StorageService'
import { createAIService } from '@/services/AIService'
import { clearTabState, getTabState, setTabState } from './tabState'
import { updateActionBadge } from './badge'
import { maybeUploadToRegistry } from './registryUploader'

chrome.tabs.onRemoved.addListener((tabId) => clearTabState(tabId))

/**
 * Central message router. Runs in the background service worker so it can
 * hold cross-tab state and make network calls (OpenAI, Firestore) without
 * being subject to a page's CSP/CORS — both content scripts and the popup
 * funnel every request through here via `sendMessage`.
 */
async function handleMessage(message: ExtensionMessage, sender: chrome.runtime.MessageSender): Promise<unknown> {
  switch (message.type) {
    case 'CG_SCAN_RESULT': {
      const tabId = sender.tab?.id
      if (tabId === undefined) return { ok: false }
      const state = setTabState(tabId, message.payload)
      await updateActionBadge(tabId, state.findings)
      const settings = await getSettings()
      void maybeUploadToRegistry(message.payload, settings)
      return { ok: true }
    }

    case 'CG_GET_TAB_STATE': {
      return { type: 'CG_TAB_STATE', payload: getTabState(message.payload.tabId) }
    }

    case 'CG_EXTRACT_COMMITMENT': {
      // AIService.extract() never rejects — it always resolves with at least
      // the detector's own local (regex-derived) summary, so there's no
      // error branch to route to the UI here.
      const settings = await getSettings()
      const aiService = createAIService(settings)
      const commitment = await aiService.extract({
        type: message.payload.type,
        evidenceText: message.payload.evidenceText,
        evidenceHtml: message.payload.evidenceHtml,
        pageTitle: message.payload.pageTitle,
        domain: message.payload.domain,
        quickSummary: message.payload.quickSummary,
        quickAmount: message.payload.quickAmount,
      })
      return { type: 'CG_EXTRACT_RESULT', payload: { patternId: message.payload.patternId, commitment } }
    }

    case 'CG_GET_SETTINGS': {
      return { type: 'CG_SETTINGS', payload: await getSettings() }
    }

    case 'CG_UPDATE_SETTINGS': {
      return { type: 'CG_SETTINGS', payload: await updateSettings(message.payload) }
    }

    case 'CG_OPEN_DASHBOARD': {
      await chrome.tabs.create({ url: chrome.runtime.getURL('dashboard.html') })
      return { ok: true }
    }

    // CG_FOCUS_PATTERN, CG_FIND_EXIT, and CG_RESCAN are sent tab-targeted
    // (chrome.tabs.sendMessage) straight to the content script;
    // CG_TAB_STATE/CG_SETTINGS/CG_EXTRACT_RESULT are response shapes, never
    // sent as requests. Nothing to do here for any of them.
    default:
      return undefined
  }
}

chrome.runtime.onMessage.addListener((message: ExtensionMessage, sender, sendResponse) => {
  handleMessage(message, sender).then(sendResponse)
  return true // keep the message channel open for the async response above
})
