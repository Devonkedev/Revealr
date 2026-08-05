import { useState } from 'react'
import type { DetectedPattern } from '@/types/detection'
import { PATTERN_META } from '@/types/patterns'
import { PATTERN_ICONS, SEVERITY_COLORS } from '@/components/patternVisuals'

interface PatternOutlineProps {
  pattern: DetectedPattern
  onSelect: (pattern: DetectedPattern) => void
}

const OUTLINE_COLOR: Record<DetectedPattern['severity'], string> = {
  low: '#ffb84d',
  medium: '#fb923c',
  high: '#ff5d5d',
}

/** A hoverable, clickable red-outline box drawn over a manipulative element. */
export function PatternOutline({ pattern, onSelect }: PatternOutlineProps) {
  const [hovered, setHovered] = useState(false)
  const rect = pattern.element.getBoundingClientRect()
  if (rect.width === 0 || rect.height === 0) return null

  const meta = PATTERN_META[pattern.type]
  const Icon = PATTERN_ICONS[pattern.type]
  const color = OUTLINE_COLOR[pattern.severity]
  const colors = SEVERITY_COLORS[pattern.severity]

  const tooltipAbove = rect.top > 64

  return (
    <div
      className="pointer-events-auto absolute cursor-pointer rounded-md transition-shadow duration-150"
      style={{
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
        outline: `2px solid ${color}`,
        outlineOffset: 2,
        boxShadow: hovered ? `0 0 0 4px ${color}33` : 'none',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={(e) => {
        e.stopPropagation()
        onSelect(pattern)
      }}
      role="button"
      tabIndex={0}
      aria-label={`ChoiceGuard flagged: ${meta.label}`}
    >
      <span
        className={`absolute -left-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full ring-2 ring-cg-bg ${colors.bg} ${colors.text}`}
        style={{ backgroundColor: color, color: '#1a1a22' }}
      >
        <Icon size={11} strokeWidth={2.5} />
      </span>

      {hovered && (
        <div
          className="animate-cg-pop pointer-events-none absolute z-10 w-56 rounded-lg border border-cg-border bg-cg-surface px-3 py-2 text-xs shadow-xl"
          style={{
            left: 0,
            ...(tooltipAbove ? { bottom: '100%', marginBottom: 8 } : { top: '100%', marginTop: 8 }),
          }}
        >
          <div className="mb-0.5 font-semibold text-cg-text">{meta.label}</div>
          <div className="text-cg-muted">{meta.description}</div>
          <div className="mt-1.5 font-medium text-cg-accent">Click for AI explanation →</div>
        </div>
      )}
    </div>
  )
}
