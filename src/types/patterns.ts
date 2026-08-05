/**
 * Canonical catalog of dark pattern types ChoiceGuard can detect.
 * Every detector in `src/content/detectors` emits one of these.
 */
export type DarkPatternType =
  | 'fake_urgency'
  | 'confirmshaming'
  | 'hidden_reject_cookies'
  | 'forced_continuity'
  | 'sneak_into_basket'
  | 'misleading_hierarchy'
  | 'hard_to_find_unsubscribe'
  | 'hidden_recurring_billing'
  | 'multiple_modal_layers'

export type Severity = 'low' | 'medium' | 'high'

export interface PatternMeta {
  type: DarkPatternType
  label: string
  shortLabel: string
  defaultSeverity: Severity
  /** One-line fallback description used when the AI explanation hasn't loaded yet. */
  description: string
  /** Default psychological bias, used as a fallback if the AI call fails or is disabled. */
  psychology: string
}

export const PATTERN_META: Record<DarkPatternType, PatternMeta> = {
  fake_urgency: {
    type: 'fake_urgency',
    label: 'Fake Urgency',
    shortLabel: 'Urgency',
    defaultSeverity: 'medium',
    description: 'A countdown or "limited time" claim that resets or never actually expires.',
    psychology: 'Scarcity bias — perceived scarcity drives impulsive decisions.',
  },
  confirmshaming: {
    type: 'confirmshaming',
    label: 'Confirmshaming',
    shortLabel: 'Confirmshaming',
    defaultSeverity: 'low',
    description: 'Opt-out copy is written to guilt or shame you into opting in instead.',
    psychology: 'Guilt framing / social-emotional pressure.',
  },
  hidden_reject_cookies: {
    type: 'hidden_reject_cookies',
    label: 'Hidden Reject Cookies',
    shortLabel: 'Hidden Reject',
    defaultSeverity: 'medium',
    description: 'The "reject" option is visually suppressed relative to "accept".',
    psychology: 'Visual salience bias — low-contrast controls are more likely to be skipped.',
  },
  forced_continuity: {
    type: 'forced_continuity',
    label: 'Forced Continuity',
    shortLabel: 'Forced Continuity',
    defaultSeverity: 'high',
    description: 'A free trial silently converts to a paid subscription without clear notice.',
    psychology: 'Default-option bias — people rarely change a pre-set default.',
  },
  sneak_into_basket: {
    type: 'sneak_into_basket',
    label: 'Sneak into Basket',
    shortLabel: 'Sneak into Basket',
    defaultSeverity: 'high',
    description: 'An extra item or pre-checked add-on was added to your cart without explicit action.',
    psychology: 'Default-option bias exploited at the point of purchase.',
  },
  misleading_hierarchy: {
    type: 'misleading_hierarchy',
    label: 'Misleading Button Hierarchy',
    shortLabel: 'Misleading Hierarchy',
    defaultSeverity: 'medium',
    description: 'The visually dominant button steers you toward the option that benefits the business.',
    psychology: 'Visual hierarchy bias — bigger/brighter reads as "recommended" or "correct".',
  },
  hard_to_find_unsubscribe: {
    type: 'hard_to_find_unsubscribe',
    label: 'Hard-to-Find Unsubscribe',
    shortLabel: 'Hidden Unsubscribe',
    defaultSeverity: 'medium',
    description: 'Cancellation is buried, tiny, or requires far more effort than signing up did.',
    psychology: 'Effort asymmetry — friction on exit that was absent on entry.',
  },
  hidden_recurring_billing: {
    type: 'hidden_recurring_billing',
    label: 'Hidden Recurring Billing',
    shortLabel: 'Hidden Billing',
    defaultSeverity: 'high',
    description: 'Recurring-charge terms are disclosed in tiny, low-contrast, or easy-to-miss text.',
    psychology: 'Information asymmetry — disclosure that technically exists but is not noticeable.',
  },
  multiple_modal_layers: {
    type: 'multiple_modal_layers',
    label: 'Multiple Modal Layers',
    shortLabel: 'Modal Stacking',
    defaultSeverity: 'low',
    description: 'Stacked pop-ups/modals increase the effort required to leave or decline.',
    psychology: 'Fatigue exploitation — each extra step raises the chance of giving up and complying.',
  },
}

export const ALL_PATTERN_TYPES = Object.keys(PATTERN_META) as DarkPatternType[]

export const SEVERITY_WEIGHT: Record<Severity, number> = {
  low: 6,
  medium: 12,
  high: 20,
}
