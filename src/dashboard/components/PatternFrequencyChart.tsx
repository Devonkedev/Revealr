import type { DarkPatternType } from '@/types/patterns'
import { PATTERN_META } from '@/types/patterns'
import { PATTERN_ICONS } from '@/components/patternVisuals'

interface PatternFrequencyChartProps {
  frequency: Partial<Record<DarkPatternType, number>>
}

/** Ranked meter list — most common manipulation types across the registry. Single hue: this is a magnitude ranking, not multi-series identity. */
export function PatternFrequencyChart({ frequency }: PatternFrequencyChartProps) {
  const entries = (Object.entries(frequency) as [DarkPatternType, number][]).filter(([, count]) => count > 0).sort((a, b) => b[1] - a[1])

  if (entries.length === 0) {
    return <div className="flex h-40 items-center justify-center text-xs text-cg-muted">No patterns recorded yet.</div>
  }

  const max = entries[0]![1]

  return (
    <div className="flex flex-col gap-3">
      {entries.map(([type, count]) => {
        const meta = PATTERN_META[type]
        const Icon = PATTERN_ICONS[type]
        const widthPct = Math.max(4, (count / max) * 100)
        return (
          <div key={type} className="group flex items-center gap-3">
            <div className="flex w-40 shrink-0 items-center gap-2 text-xs text-cg-text">
              <Icon size={13} className="text-cg-muted" />
              <span className="truncate">{meta.shortLabel}</span>
            </div>
            <div className="relative h-5 flex-1 rounded-full bg-cg-surface-2">
              <div
                className="h-5 rounded-full bg-cg-accent transition-[width] duration-300 group-hover:brightness-110"
                style={{ width: `${widthPct}%` }}
              />
            </div>
            <span className="w-6 shrink-0 text-right text-xs tabular-nums text-cg-muted">{count}</span>
          </div>
        )
      })}
    </div>
  )
}
