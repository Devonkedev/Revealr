import { Cookie, Lock, MailX, Repeat, ShoppingCart, UserX, type LucideIcon } from 'lucide-react'
import type { DarkPatternType, Severity } from '@/types/patterns'
import type { AssistKind } from '@/types/detection'

/** Icon shown for each commitment type across the overlay, drawer, and popup. */
export const PATTERN_ICONS: Record<DarkPatternType, LucideIcon> = {
  subscription_commitment: Repeat,
  checkout_addon: ShoppingCart,
}

/** Icon shown for each "Find My Exit" target kind. */
export const ASSIST_ICONS: Record<AssistKind, LucideIcon> = {
  unsubscribe: MailX,
  reject_cookies: Cookie,
  account_deletion: UserX,
  privacy_controls: Lock,
}

interface SeverityColorSet {
  text: string
  bg: string
  ring: string
  dot: string
}

/**
 * Severity tags a single finding (e.g. a $50/mo commitment reads higher
 * than a $2 add-on) — it is deliberately never aggregated into one
 * site-wide score. ChoiceGuard doesn't grade sites as good or bad.
 */
export const SEVERITY_COLORS: Record<Severity, SeverityColorSet> = {
  low: { text: 'text-cg-warn', bg: 'bg-cg-warn/15', ring: 'ring-cg-warn/30', dot: 'bg-cg-warn' },
  medium: { text: 'text-orange-400', bg: 'bg-orange-400/15', ring: 'ring-orange-400/30', dot: 'bg-orange-400' },
  high: { text: 'text-cg-danger', bg: 'bg-cg-danger/15', ring: 'ring-cg-danger/30', dot: 'bg-cg-danger' },
}
