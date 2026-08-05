/** Tunable thresholds shared by detectors and scoring. Centralized so the demo is easy to tune live. */
export const THRESHOLDS = {
  /** Elements below this opacity are considered visually suppressed. */
  LOW_OPACITY: 0.55,
  /** Contrast ratio below this (WCAG AA body-text minimum is 4.5) reads as "hidden in plain sight". */
  LOW_CONTRAST_RATIO: 3.0,
  /** Font size (px) below this is treated as "fine print". */
  TINY_FONT_PX: 11,
  /** Countdown re-detected with a higher remaining time than last check = reset. */
  COUNTDOWN_RESET_TOLERANCE_MS: 2000,
  /** Minimum ratio of a "primary" CTA's area to a "secondary" CTA's area to flag hierarchy manipulation. */
  BUTTON_SIZE_RATIO: 1.8,
  /** How many nested fixed/absolute-positioned overlay containers count as "modal stacking". */
  MODAL_LAYER_COUNT: 2,
  /** Milliseconds between full-page re-scans triggered by mutation observer. */
  SCAN_DEBOUNCE_MS: 800,
  /** Milliseconds between countdown-timer re-checks. */
  COUNTDOWN_POLL_MS: 3000,
} as const

export const CONFIRMSHAME_PHRASES = [
  "no thanks, i don't want",
  "no, i'd rather",
  "no, i don't want",
  "no thanks, i'll pass on",
  "no, i hate",
  "i don't want to save",
  "i don't care about",
  "no, i prefer to pay full price",
  "skip this amazing",
  "i'll stay uninformed",
  "no, i don't like",
  "i'm not interested in saving",
  "maybe later, i don't need",
]

export const URGENCY_PHRASES = [
  'only',
  'left in stock',
  'hurry',
  'ending soon',
  'offer ends',
  'sale ends',
  'time is running out',
  "don't miss out",
  'last chance',
  'almost gone',
  'selling fast',
]

export const RECURRING_BILLING_PHRASES = [
  'auto-renew',
  'automatically renew',
  'will be charged',
  'recurring',
  'subscription will continue',
  'unless you cancel',
  'billed automatically',
]

export const UNSUBSCRIBE_PHRASES = ['unsubscribe', 'cancel subscription', 'cancel your subscription', 'cancel account', 'close account']

export const REJECT_COOKIE_PHRASES = ['reject all', 'reject', 'decline', 'necessary only', 'only necessary', 'do not accept']
export const ACCEPT_COOKIE_PHRASES = ['accept all', 'accept', 'agree', 'allow all', 'i agree', 'got it']

export const CG_ATTR_ID = 'data-cg-id'
export const CG_ATTR_SCANNED = 'data-cg-scanned'
