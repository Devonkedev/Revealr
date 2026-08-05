/** Tunable thresholds shared by detectors. Centralized so the demo is easy to tune live. */
export const THRESHOLDS = {
  /** Elements below this opacity read as visually suppressed — bumps severity, not a gate. */
  LOW_OPACITY: 0.55,
  /** Contrast ratio below this (WCAG AA body-text minimum is 4.5) reads as "hidden in plain sight". */
  LOW_CONTRAST_RATIO: 3.0,
  /** Font size (px) below this is treated as "fine print". */
  TINY_FONT_PX: 11,
  /** Milliseconds between full-page re-scans triggered by mutation observer. */
  SCAN_DEBOUNCE_MS: 800,
} as const

export const FREE_TRIAL_PHRASES = ['free trial', 'trial period', 'start your trial', 'try free for', 'free for 7 days', 'free for 30 days']

export const RECURRING_BILLING_PHRASES = [
  'auto-renew',
  'automatically renew',
  'will be charged',
  'recurring',
  'subscription will continue',
  'unless you cancel',
  'billed automatically',
  'renews monthly',
  'renews annually',
  'renews yearly',
  'then billed',
  'per month after',
  'per year after',
]

export const UNSUBSCRIBE_PHRASES = ['unsubscribe', 'cancel subscription', 'cancel your subscription', 'cancel membership', 'cancel plan']

export const ACCOUNT_DELETION_PHRASES = ['delete account', 'delete my account', 'close account', 'close my account', 'deactivate account', 'delete your account']

export const PRIVACY_CONTROL_PHRASES = [
  'privacy settings',
  'privacy controls',
  'manage privacy',
  'data preferences',
  'do not sell',
  'manage cookies',
  'cookie settings',
  'ad preferences',
  'manage my data',
]

export const REJECT_COOKIE_PHRASES = ['reject all', 'reject', 'decline', 'necessary only', 'only necessary', 'do not accept']

/** Matches "$49.99", "₹799", "€19,99/mo", "£9.99 per month" — used for local (no-AI) price extraction. */
export const CURRENCY_AMOUNT_REGEX = /(₹|\$|€|£|USD|INR|EUR|GBP)\s?[\d][\d,.]*(\s?\/\s?(mo|month|yr|year|wk|week))?/i

export const BILLING_FREQUENCY_REGEX = /\b(month|monthly|year|yearly|annual|annually|week|weekly)\b/i

export const CG_ATTR_ID = 'data-cg-id'
export const CG_ATTR_SCANNED = 'data-cg-scanned'
