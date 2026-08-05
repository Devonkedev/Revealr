import type { DarkPatternType, Severity } from '@/types/patterns'
import { PATTERN_META } from '@/types/patterns'
import { PATTERN_ICONS, SEVERITY_COLORS } from './patternVisuals'

interface CommitmentListItemProps {
  type: DarkPatternType
  severity: Severity
  /** Plain-language summary — "Then ₹799/month, renews monthly.", not a psychology explanation. */
  summary: string
  amount?: string
  onClick?: () => void
  active?: boolean
}

/** One row in a commitment list — shared between the popup and the in-page drawer. */
export function CommitmentListItem({ type, severity, summary, amount, onClick, active }: CommitmentListItemProps) {
  const meta = PATTERN_META[type]
  const Icon = PATTERN_ICONS[type]
  const colors = SEVERITY_COLORS[severity]

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-start gap-3 rounded-xl p-3 text-left transition-colors duration-150 ${
        active ? 'bg-cg-surface-2 ring-1 ring-cg-border' : 'hover:bg-cg-surface-2/60'
      }`}
    >
      <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${colors.bg} ${colors.text}`}>
        <Icon size={16} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center justify-between gap-2">
          <span className="truncate text-sm font-medium text-cg-text">{meta.label}</span>
          {amount && <span className="shrink-0 text-sm font-semibold tabular-nums text-cg-text">{amount}</span>}
        </span>
        <span className="mt-0.5 line-clamp-2 block text-xs text-cg-muted">{summary}</span>
      </span>
    </button>
  )
}
