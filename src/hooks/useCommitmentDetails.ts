import { useCallback, useRef, useState } from 'react'
import type { CommitmentDetailState, DetectedPattern, ExtractedCommitment } from '@/types/detection'
import type { ExtensionMessage } from '@/types/messages'
import { sendMessage } from '@/services/messaging'
import { getCurrentDomain } from '@/utils/domUtils'

/** Module-level cache: extractions survive drawer open/close within the same page load. */
const commitmentCache = new Map<string, ExtractedCommitment>()

async function requestExtraction(pattern: DetectedPattern): Promise<ExtractedCommitment | undefined> {
  const response = await sendMessage<Extract<ExtensionMessage, { type: 'CG_EXTRACT_RESULT' }>>({
    type: 'CG_EXTRACT_COMMITMENT',
    payload: {
      patternId: pattern.id,
      type: pattern.type,
      evidenceText: pattern.evidenceText,
      evidenceHtml: pattern.evidenceHtml,
      pageTitle: document.title,
      domain: getCurrentDomain(),
      quickSummary: pattern.quickSummary,
      quickAmount: pattern.quickAmount,
    },
  })
  if (response.payload.commitment) commitmentCache.set(pattern.id, response.payload.commitment)
  return response.payload.commitment
}

/**
 * Fires the extraction call ahead of time and drops the result in the
 * shared cache, without any component subscribing to loading/error state.
 * Used for the "auto-extract details" setting — silently warms the cache
 * for commitments the user hasn't opened yet, so the drawer feels instant
 * when they do.
 */
export function prefetchCommitmentDetails(pattern: DetectedPattern): void {
  if (commitmentCache.has(pattern.id)) return
  requestExtraction(pattern).catch(() => {
    // Best-effort — if this fails, the drawer's own on-demand fetch will retry.
  })
}

/**
 * Fetches (and caches) the richer, AI-extracted view of a commitment — trial-
 * end date, cancellation requirement — via the background service worker.
 * The local `quickSummary` a detector already computed is shown instantly;
 * this only enriches it, and never leaves the caller with nothing (the
 * background always resolves with at least the local fallback).
 */
export function useCommitmentDetails() {
  const [state, setState] = useState<CommitmentDetailState>({ status: 'idle' })
  const activePatternId = useRef<string | null>(null)

  const loadDetails = useCallback(async (pattern: DetectedPattern) => {
    activePatternId.current = pattern.id

    const cached = commitmentCache.get(pattern.id)
    if (cached) {
      setState({ status: 'ready', commitment: cached })
      return
    }

    setState({ status: 'loading' })
    try {
      const commitment = await requestExtraction(pattern)
      if (activePatternId.current !== pattern.id) return // a newer request superseded this one

      if (commitment) {
        setState({ status: 'ready', commitment })
      } else {
        setState({ status: 'error', error: 'Could not extract details for this commitment.' })
      }
    } catch (error) {
      if (activePatternId.current !== pattern.id) return
      setState({ status: 'error', error: error instanceof Error ? error.message : 'Failed to reach the extraction service.' })
    }
  }, [])

  const reset = useCallback(() => {
    activePatternId.current = null
    setState({ status: 'idle' })
  }, [])

  return { state, loadDetails, reset }
}
