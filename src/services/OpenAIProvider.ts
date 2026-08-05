import type { ExtractedCommitment } from '@/types/detection'
import { ALL_PATTERN_TYPES, type DarkPatternType } from '@/types/patterns'
import { clamp } from '@/utils/format'
import type { AIProvider, CommitmentExtractionRequest } from './AIService'

const OPENAI_CHAT_COMPLETIONS_URL = 'https://api.openai.com/v1/chat/completions'
const DEFAULT_MODEL = 'gpt-4o-mini'

const SYSTEM_PROMPT = `You are ChoiceGuard's commitment-extraction engine, embedded in a browser extension.
You are given a DOM snippet a deterministic detector flagged as a possible recurring-billing or checkout-addon commitment, plus the page it came from, and the detector's own best-effort local summary.

Your ONLY job is to extract the concrete facts of what the user is agreeing to. Do NOT comment on whether it is manipulative, do NOT explain psychology, and do NOT add an opinion about the page. If you can't improve on the local summary, just confirm it.

Respond with ONLY a single JSON object (no markdown fences, no commentary) with exactly these keys:
{
  "type": one of ${JSON.stringify(ALL_PATTERN_TYPES)},
  "confidence": number from 0 to 1 (confidence in the extracted facts, not a judgment of the page),
  "summary": "one plain-language sentence stating what happens, e.g. 'Then ₹799/month, renews monthly.' or '₹249 protection plan already added to your order.'",
  "amount": "the recurring or add-on price as shown, e.g. '₹799' (omit this key entirely if not stated)",
  "billingFrequency": "one of monthly / yearly / weekly / one-time (omit this key entirely if not applicable)",
  "trialEndDate": "when the free trial ends, in the page's own words e.g. '14 August' or 'in 7 days' (omit this key entirely if there is no trial)",
  "renewalDate": "when the next charge happens, in the page's own words (omit this key entirely if unknown)",
  "cancellationRequirement": "what the user must do to avoid the charge, one short sentence (omit this key entirely if not stated)"
}
Only include fields you can actually support from the given text — omit anything not present rather than guessing.`

function buildUserPrompt(request: CommitmentExtractionRequest): string {
  return [
    `Page: ${request.pageTitle} (${request.domain})`,
    `Detector type: ${request.type}`,
    request.quickSummary ? `Local best-effort summary: ${request.quickSummary}` : null,
    `Visible text: """${request.evidenceText}"""`,
    `HTML snippet: """${request.evidenceHtml}"""`,
  ]
    .filter(Boolean)
    .join('\n\n')
}

interface OpenAIChatResponse {
  choices?: Array<{ message?: { content?: string } }>
}

function isPatternType(value: unknown): value is DarkPatternType {
  return typeof value === 'string' && (ALL_PATTERN_TYPES as string[]).includes(value)
}

function optionalString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}

function parseCommitment(raw: string, fallbackType: DarkPatternType, fallbackSummary: string): ExtractedCommitment {
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

  return {
    type: isPatternType(obj.type) ? obj.type : fallbackType,
    confidence: clamp(typeof obj.confidence === 'number' ? obj.confidence : 0.5, 0, 1),
    summary: optionalString(obj.summary) ?? fallbackSummary,
    amount: optionalString(obj.amount),
    billingFrequency: optionalString(obj.billingFrequency),
    trialEndDate: optionalString(obj.trialEndDate),
    renewalDate: optionalString(obj.renewalDate),
    cancellationRequirement: optionalString(obj.cancellationRequirement),
  }
}

/** OpenAI Chat Completions provider. Swap in another `AIProvider` implementation to change backends. */
export class OpenAIProvider implements AIProvider {
  readonly id = 'openai'

  constructor(
    private readonly apiKey: string,
    private readonly model: string = DEFAULT_MODEL,
  ) {}

  async extract(request: CommitmentExtractionRequest, signal?: AbortSignal): Promise<ExtractedCommitment> {
    const response = await fetch(OPENAI_CHAT_COMPLETIONS_URL, {
      method: 'POST',
      signal,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        temperature: 0.1,
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

    return parseCommitment(content, request.type, request.quickSummary ?? 'Recurring charge mentioned.')
  }
}
