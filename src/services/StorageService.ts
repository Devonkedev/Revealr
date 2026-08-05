import { DEFAULT_SETTINGS, type ChoiceGuardSettings } from '@/types/settings'

const SETTINGS_KEY = 'cg_settings'

/**
 * Thin wrapper around chrome.storage.local for extension settings.
 * Everything (including the OpenAI key) lives in `local`, not `sync` —
 * API keys should never leave the machine via Chrome Sync.
 */
export async function getSettings(): Promise<ChoiceGuardSettings> {
  const result = await chrome.storage.local.get(SETTINGS_KEY)
  const stored = result[SETTINGS_KEY] as Partial<ChoiceGuardSettings> | undefined
  return { ...DEFAULT_SETTINGS, ...stored }
}

export async function updateSettings(patch: Partial<ChoiceGuardSettings>): Promise<ChoiceGuardSettings> {
  const current = await getSettings()
  const next: ChoiceGuardSettings = { ...current, ...patch }
  await chrome.storage.local.set({ [SETTINGS_KEY]: next })
  return next
}

export function onSettingsChanged(callback: (settings: ChoiceGuardSettings) => void): () => void {
  const listener = (changes: Record<string, chrome.storage.StorageChange>, areaName: chrome.storage.AreaName) => {
    if (areaName !== 'local' || !changes[SETTINGS_KEY]) return
    callback({ ...DEFAULT_SETTINGS, ...(changes[SETTINGS_KEY].newValue as Partial<ChoiceGuardSettings>) })
  }
  chrome.storage.onChanged.addListener(listener)
  return () => chrome.storage.onChanged.removeListener(listener)
}
