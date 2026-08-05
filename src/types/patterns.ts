/**
 * ChoiceGuard exposes hidden financial/consent commitments — it does not
 * grade a site as "good" or "bad" and does not explain UX psychology.
 * Every finding is one of exactly two kinds:
 */
export type DarkPatternType = 'subscription_commitment' | 'checkout_addon'

export type Severity = 'low' | 'medium' | 'high'

export interface PatternMeta {
  type: DarkPatternType
  label: string
  shortLabel: string
  defaultSeverity: Severity
  /** Plain-language, non-judgmental description shown before extraction finishes. */
  description: string
}

export const PATTERN_META: Record<DarkPatternType, PatternMeta> = {
  subscription_commitment: {
    type: 'subscription_commitment',
    label: 'Recurring Subscription',
    shortLabel: 'Subscription',
    defaultSeverity: 'high',
    description: "You're about to start a recurring subscription.",
  },
  checkout_addon: {
    type: 'checkout_addon',
    label: 'Add-on Already Selected',
    shortLabel: 'Add-on',
    defaultSeverity: 'medium',
    description: 'An extra item or service has already been added to your order.',
  },
}

export const ALL_PATTERN_TYPES = Object.keys(PATTERN_META) as DarkPatternType[]

export const SEVERITY_WEIGHT: Record<Severity, number> = {
  low: 1,
  medium: 2,
  high: 3,
}
