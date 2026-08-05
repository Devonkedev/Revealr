import type { AssistTarget, DetectedPattern } from '@/types/detection'
import { PatternOutline } from './PatternOutline'
import { AssistOutline } from './AssistOutline'

interface OverlayProps {
  patterns: DetectedPattern[]
  assists: AssistTarget[]
  onSelectPattern: (pattern: DetectedPattern) => void
  visible: boolean
}

/** Full-viewport, pointer-events-transparent layer holding every outline box. */
export function Overlay({ patterns, assists, onSelectPattern, visible }: OverlayProps) {
  if (!visible) return null

  return (
    <div className="pointer-events-none fixed inset-0" style={{ zIndex: 2147483000 }}>
      {assists.map((assist) => (
        <AssistOutline key={assist.id} assist={assist} />
      ))}
      {patterns.map((pattern) => (
        <PatternOutline key={pattern.id} pattern={pattern} onSelect={onSelectPattern} />
      ))}
    </div>
  )
}
