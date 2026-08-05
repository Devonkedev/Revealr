import type { ExtractedCommitment } from '@/types/detection'
import type { DarkPatternType } from '@/types/patterns'
import type { RevealrSettings } from '@/types/settings'
import { OpenAIProvider } from './OpenAIProvider'

export interface CommitmentExtractionRequest {
  type: DarkPatternType
  evidenceText: string
  evidenceHtml: string
  pageTitle: string
  domain: string
  /** Best-effort summary the detector already computed locally via regex — used as the fallback, and as a hint to the AI. */
  quickSummary?: string
  quickAmount?: string
}

/** Abstraction every AI backend must implement — swap providers without touching callers. */
export interface AIProvider {
  readonly id: string
  extract(request: CommitmentExtractionRequest, signal?: AbortSignal): Promise<ExtractedCommitment>
}

/**
 * The AI's one job is extraction ("what exactly is the user agreeing to"),
 * never interpretation. Every detector already computes a best-effort,
 * fully local summary (`quickSummary`/`quickAmount`) via regex — the AI
 * call is optional enrichment (a trial-end date buried in prose, a
 * cancellation requirement) that the user opts into per-commitment. If
 * it's unavailable or fails, `extract` always resolves with the local
 * result instead of leaving the UI with nothing.
 */
export class AIService {
  constructor(private readonly provider: AIProvider | null) {}

  async extract(request: CommitmentExtractionRequest): Promise<ExtractedCommitment> {
    if (!this.provider) return localFallback(request)

    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 12_000)
      try {
        return await this.provider.extract(request, controller.signal)
      } finally {
        clearTimeout(timeout)
      }
    } catch (error) {
      console.warn('[Revealr] AI extraction failed, using local fallback', error)
      return localFallback(request)
    }
  }
}

function localFallback(request: CommitmentExtractionRequest): ExtractedCommitment {
  return {
    type: request.type,
    confidence: request.quickAmount ? 0.6 : 0.35,
    summary: request.quickSummary || 'Could not extract exact terms automatically — check the highlighted text on the page.',
    amount: request.quickAmount,
  }
}

/**
 * Builds the configured provider (or null, triggering the local-only
 * fallback) from user settings. A key pasted into the popup's Settings tab
 * always wins; `VITE_OPENAI_API_KEY` (baked in at build time via `.env`) is
 * used only as a developer-convenience default for local demos.
 */
export function createAIService(settings: RevealrSettings): AIService {
  const buildTimeKey = import.meta.env.VITE_OPENAI_API_KEY as string | undefined
  const apiKey = settings.openaiApiKey.trim() || buildTimeKey?.trim() || ''

  if (settings.aiProvider === 'openai' && apiKey) {
    return new AIService(new OpenAIProvider(apiKey))
  }
  return new AIService(null)
}
