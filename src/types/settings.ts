export type AIProviderId = 'openai' | 'disabled'

export interface ChoiceGuardSettings {
  /** Master on/off switch for scanning + overlay. */
  enabled: boolean
  /** Whether AI explanations are fetched automatically on detection vs. on click. */
  explainAutomatically: boolean
  /** Whether the user has opted in to anonymous registry uploads (Firebase demo backend). */
  registryOptIn: boolean
  aiProvider: AIProviderId
  /** User-supplied OpenAI key, stored in chrome.storage.local (never synced). */
  openaiApiKey: string
  /** Show the floating badge on every page. */
  showFloatingBadge: boolean
}

export const DEFAULT_SETTINGS: ChoiceGuardSettings = {
  enabled: true,
  explainAutomatically: false,
  registryOptIn: false,
  aiProvider: 'openai',
  openaiApiKey: '',
  showFloatingBadge: true,
}
