import { useCallback, useRef, useState } from 'react'
import type { AIExplanation, DetectedPattern, ExplanationState } from '@/types/detection'
import type { ExtensionMessage } from '@/types/messages'
import { sendMessage } from '@/services/messaging'
import { getCurrentDomain } from '@/utils/domUtils'

/** Module-level cache: explanations survive drawer open/close within the same page load. */
const explanationCache = new Map<string, AIExplanation>()

/** Fetches (and caches) an AI explanation for a detected pattern via the background service worker. */
export function useExplanation() {
  const [state, setState] = useState<ExplanationState>({ status: 'idle' })
  const activePatternId = useRef<string | null>(null)

  const explain = useCallback(async (pattern: DetectedPattern) => {
    activePatternId.current = pattern.id

    const cached = explanationCache.get(pattern.id)
    if (cached) {
      setState({ status: 'ready', explanation: cached })
      return
    }

    setState({ status: 'loading' })
    try {
      const response = await sendMessage<Extract<ExtensionMessage, { type: 'CG_EXPLAIN_RESULT' }>>({
        type: 'CG_EXPLAIN_PATTERN',
        payload: {
          patternId: pattern.id,
          type: pattern.type,
          evidenceText: pattern.evidenceText,
          evidenceHtml: pattern.evidenceHtml,
          pageTitle: document.title,
          domain: getCurrentDomain(),
        },
      })

      if (activePatternId.current !== pattern.id) return // a newer request superseded this one

      if (response.payload.explanation) {
        explanationCache.set(pattern.id, response.payload.explanation)
        setState({ status: 'ready', explanation: response.payload.explanation })
      } else {
        setState({ status: 'error', error: response.payload.error ?? 'The AI service returned no explanation.' })
      }
    } catch (error) {
      if (activePatternId.current !== pattern.id) return
      setState({ status: 'error', error: error instanceof Error ? error.message : 'Failed to reach the AI service.' })
    }
  }, [])

  const reset = useCallback(() => {
    activePatternId.current = null
    setState({ status: 'idle' })
  }, [])

  return { state, explain, reset }
}
