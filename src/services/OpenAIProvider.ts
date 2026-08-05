import type { AIExplanation } from '@/types/detection'
import { ALL_PATTERN_TYPES, type DarkPatternType } from '@/types/patterns'
import { clamp } from '@/utils/format'
import type { AIExplanationRequest, AIProvider } from './AIService'

const OPENAI_CHAT_COMPLETIONS_URL = 'https://api.openai.com/v1/chat/completions'
const DEFAULT_MODEL = 'gpt-4o-mini'

const SYSTEM_PROMPT = `You are ChoiceGuard, a UX-ethics analyst embedded in a browser extension.
You are given a DOM snippet flagged by a deterministic dark-pattern detector, plus the page it came from.
Classify it and explain it for a non-technical end user in plain, concrete language.

Respond with ONLY a single JSON object (no markdown fences, no commentary) with exactly these keys:
{
  "type": one of ${JSON.stringify(ALL_PATTERN_TYPES)},
  "confidence": number from 0 to 1,
  "psychology": "the specific cognitive bias or psychological mechanism being exploited, 1 short sentence",
  "whyManipulative": "1-2 sentences explaining concretely why this manipulates the user, referencing the snippet",
  "suggestedAlternative": "1 sentence describing a fair, non-manipulative version of this UI",
  "potentialImpact": "1 sentence on the likely business effect (e.g. higher conversions, fewer cancellations)"
}
If the snippet does not actually look manipulative on reflection, still classify it as the closest type but set a low confidence (below 0.35).`

function buildUserPrompt(request: AIExplanationRequest): string {
  return [
    `Page: ${request.pageTitle} (${request.domain})`,
    `Detector's initial guess: ${request.type}`,
    `Visible text: """${request.evidenceText}"""`,
    `HTML snippet: """${request.evidenceHtml}"""`,
  ].join('\n\n')
}

interface OpenAIChatResponse {
  choices?: Array<{ message?: { content?: string } }>
}

function isPatternType(value: unknown): value is DarkPatternType {
  return typeof value === 'string' && (ALL_PATTERN_TYPES as string[]).includes(value)
}

function parseExplanation(raw: string, fallbackType: DarkPatternType): AIExplanation {
  let json: unknown
  try {
    json = JSON.parse(raw)
  } catch {
    // Model occasionally wraps JSON in prose despite instructions — try to salvage the object.
    const match = raw.match(/\{[\s\S]*\}/)
    if (!match) throw new Error('Could not parse AI response as JSON')
    json = JSON.parse(match[0])
  }

  if (typeof json !== 'object' || json === null) throw new Error('AI response was not a JSON object')
  const obj = json as Record<string, unknown>

  const asString = (v: unknown, fallback: string) => (typeof v === 'string' && v.trim() ? v.trim() : fallback)

  return {
    type: isPatternType(obj.type) ? obj.type : fallbackType,
    confidence: clamp(typeof obj.confidence === 'number' ? obj.confidence : 0.5, 0, 1),
    psychology: asString(obj.psychology, 'Not specified by the model.'),
    whyManipulative: asString(obj.whyManipulative, 'Not specified by the model.'),
    suggestedAlternative: asString(obj.suggestedAlternative, 'Present the choice neutrally, with equal weight for both options.'),
    potentialImpact: asString(obj.potentialImpact, 'Not specified by the model.'),
  }
}

/** OpenAI Chat Completions provider. Swap in another `AIProvider` implementation to change backends. */
export class OpenAIProvider implements AIProvider {
  readonly id = 'openai'

  constructor(
    private readonly apiKey: string,
    private readonly model: string = DEFAULT_MODEL,
  ) {}

  async explain(request: AIExplanationRequest, signal?: AbortSignal): Promise<AIExplanation> {
    const response = await fetch(OPENAI_CHAT_COMPLETIONS_URL, {
      method: 'POST',
      signal,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        temperature: 0.3,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: buildUserPrompt(request) },
        ],
      }),
    })

    if (!response.ok) {
      const body = await response.text().catch(() => '')
      throw new Error(`OpenAI request failed (${response.status}): ${body.slice(0, 300)}`)
    }

    const data = (await response.json()) as OpenAIChatResponse
    const content = data.choices?.[0]?.message?.content
    if (!content) throw new Error('OpenAI response did not include content')

    return parseExplanation(content, request.type)
  }
}
