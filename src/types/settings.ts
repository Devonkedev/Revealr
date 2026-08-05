export type AIProviderId = 'openai' | 'disabled'

export interface ChoiceGuardSettings {
  /** Master on/off switch for scanning + overlay. */
  enabled: boolean
  /**
   * Whether to automatically call the AI extraction step as soon as a
   * commitment is found. Defaults to OFF — the local, on-device summary is
   * shown immediately either way; this only controls whether the richer
   * (trial-end date, cancellation requirement) AI enrichment happens
   * automatically or only when the user asks for it. Off-by-default is a
   * deliberate privacy choice: nothing is sent anywhere until requested.
   */
  autoExtractDetails: boolean
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
  autoExtractDetails: false,
  registryOptIn: false,
  aiProvider: 'openai',
  openaiApiKey: '',
  showFloatingBadge: true,
}
