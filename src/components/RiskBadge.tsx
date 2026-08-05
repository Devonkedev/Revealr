import type { Severity } from '@/types/patterns'
import { riskLabel, scoreColorClass, SEVERITY_COLORS } from './patternVisuals'

interface RiskBadgeProps {
  level: 'low' | 'medium' | 'high'
}

export function RiskBadge({ level }: RiskBadgeProps) {
  const colors = level === 'low' ? scoreColorClass(80) : level === 'medium' ? scoreColorClass(60) : scoreColorClass(20)
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${colors.bg} ${colors.text} ${colors.ring}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${colors.dot}`} />
      {riskLabel(level)}
    </span>
  )
}

interface SeverityDotProps {
  severity: Severity
}

export function SeverityDot({ severity }: SeverityDotProps) {
  return <span className={`inline-block h-1.5 w-1.5 rounded-full ${SEVERITY_COLORS[severity].dot}`} />
}
