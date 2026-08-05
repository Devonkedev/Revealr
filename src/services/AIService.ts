import type { AIExplanation } from '@/types/detection'
import type { DarkPatternType } from '@/types/patterns'
import { PATTERN_META } from '@/types/patterns'
import type { ChoiceGuardSettings } from '@/types/settings'
import { OpenAIProvider } from './OpenAIProvider'

export interface AIExplanationRequest {
  type: DarkPatternType
  evidenceText: string
  evidenceHtml: string
  pageTitle: string
  domain: string
}

/** Abstraction every AI backend must implement — swap providers without touching callers. */
export interface AIProvider {
  readonly id: string
  explain(request: AIExplanationRequest, signal?: AbortSignal): Promise<AIExplanation>
}

export class AIServiceError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message)
    this.name = 'AIServiceError'
  }
}

/**
 * Provider-agnostic facade used by the rest of the extension. Falls back to
 * a deterministic, template-based explanation (from PATTERN_META) whenever
 * no provider is configured or the live call fails, so the UI never shows
 * a dead end.
 */
export class AIService {
  constructor(private readonly provider: AIProvider | null) {}

  async explain(request: AIExplanationRequest): Promise<AIExplanation> {
    if (!this.provider) return fallbackExplanation(request)

    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 12_000)
      try {
        return await this.provider.explain(request, controller.signal)
      } finally {
        clearTimeout(timeout)
      }
    } catch (error) {
      throw new AIServiceError(error instanceof Error ? error.message : 'AI explanation failed', error)
    }
  }
}

export function fallbackExplanation(request: AIExplanationRequest): AIExplanation {
  const meta = PATTERN_META[request.type]
  return {
    type: request.type,
    confidence: 0.5,
    psychology: meta.psychology,
    whyManipulative: meta.description,
    suggestedAlternative: 'Present both options with equal visual weight and plain, neutral language.',
    potentialImpact: 'Likely increases conversions or reduces opt-outs at the cost of informed, freely-given consent.',
  }
}

/**
 * Builds the configured provider (or null, triggering the fallback) from
 * user settings. A key pasted into the popup's Settings tab always wins;
 * `VITE_OPENAI_API_KEY` (baked in at build time via `.env`) is used only
 * as a developer-convenience default for local demos.
 */
export function createAIService(settings: ChoiceGuardSettings): AIService {
  const buildTimeKey = import.meta.env.VITE_OPENAI_API_KEY as string | undefined
  const apiKey = settings.openaiApiKey.trim() || buildTimeKey?.trim() || ''

  if (settings.aiProvider === 'openai' && apiKey) {
    return new AIService(new OpenAIProvider(apiKey))
  }
  return new AIService(null)
}
