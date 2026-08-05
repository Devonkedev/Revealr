import { AlertTriangle, Clock, EyeOff, Heart, Layers, MailX, MousePointerClick, Repeat, ShoppingCart, type LucideIcon } from 'lucide-react'
import type { DarkPatternType, Severity } from '@/types/patterns'

/** Icon shown for each dark-pattern type across the overlay, drawer, popup, and dashboard. */
export const PATTERN_ICONS: Record<DarkPatternType, LucideIcon> = {
  fake_urgency: Clock,
  confirmshaming: Heart,
  hidden_reject_cookies: EyeOff,
  forced_continuity: Repeat,
  sneak_into_basket: ShoppingCart,
  misleading_hierarchy: MousePointerClick,
  hard_to_find_unsubscribe: MailX,
  hidden_recurring_billing: AlertTriangle,
  multiple_modal_layers: Layers,
}

interface SeverityColorSet {
  text: string
  bg: string
  ring: string
  dot: string
}

export const SEVERITY_COLORS: Record<Severity, SeverityColorSet> = {
  low: { text: 'text-cg-warn', bg: 'bg-cg-warn/15', ring: 'ring-cg-warn/30', dot: 'bg-cg-warn' },
  medium: { text: 'text-orange-400', bg: 'bg-orange-400/15', ring: 'ring-orange-400/30', dot: 'bg-orange-400' },
  high: { text: 'text-cg-danger', bg: 'bg-cg-danger/15', ring: 'ring-cg-danger/30', dot: 'bg-cg-danger' },
}

export function scoreColorClass(score: number): SeverityColorSet & { stroke: string } {
  if (score >= 75) return { ...SEVERITY_COLORS.low, text: 'text-cg-good', bg: 'bg-cg-good/15', ring: 'ring-cg-good/30', dot: 'bg-cg-good', stroke: '#5ee6a0' }
  if (score >= 45) return { ...SEVERITY_COLORS.medium, stroke: '#fb923c' }
  return { ...SEVERITY_COLORS.high, stroke: '#ff5d5d' }
}

export function riskLabel(level: 'low' | 'medium' | 'high'): string {
  return level === 'low' ? 'Low Risk' : level === 'medium' ? 'Medium Risk' : 'High Risk'
}
