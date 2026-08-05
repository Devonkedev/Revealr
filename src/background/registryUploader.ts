import type { TabState } from '@/types/messages'
import { isFirebaseConfigured, uploadRegistryEntry } from '@/services/FirebaseService'
import type { ChoiceGuardSettings } from '@/types/settings'

/** Don't spam Firestore with a write on every debounced re-scan of the same domain. */
const UPLOAD_COOLDOWN_MS = 5 * 60 * 1000

const lastUploadByDomain = new Map<string, number>()

/**
 * Opt-in-only, anonymous upload to the demo registry backend. No-ops
 * silently if the user hasn't opted in, Firebase isn't configured, or this
 * domain was already uploaded recently.
 */
export async function maybeUploadToRegistry(state: Omit<TabState, 'tabId'>, settings: ChoiceGuardSettings): Promise<void> {
  if (!settings.registryOptIn || !isFirebaseConfigured()) return

  const last = lastUploadByDomain.get(state.domain) ?? 0
  if (Date.now() - last < UPLOAD_COOLDOWN_MS) return
  lastUploadByDomain.set(state.domain, Date.now())

  try {
    await uploadRegistryEntry({
      domain: state.domain,
      patternTypes: [...new Set(state.patterns.map((p) => p.type))],
      score: state.score.score,
      timestamp: Date.now(),
    })
  } catch (error) {
    console.warn('[ChoiceGuard] registry upload failed', error)
  }
}
