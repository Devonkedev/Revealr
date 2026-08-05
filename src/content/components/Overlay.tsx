import type { AssistTarget, DetectedPattern } from '@/types/detection'
import { CommitmentOutline } from './CommitmentOutline'
import { AssistOutline } from './AssistOutline'

interface OverlayProps {
  patterns: DetectedPattern[]
  assists: AssistTarget[]
  onSelectPattern: (pattern: DetectedPattern) => void
  focusedAssistId: string | null
  visible: boolean
}

/** Full-viewport, pointer-events-transparent layer holding every outline box. */
export function Overlay({ patterns, assists, onSelectPattern, focusedAssistId, visible }: OverlayProps) {
  if (!visible) return null

  return (
    <div className="pointer-events-none fixed inset-0" style={{ zIndex: 2147483000 }}>
      {assists.map((assist) => (
        <AssistOutline key={assist.id} assist={assist} focused={assist.id === focusedAssistId} />
      ))}
      {patterns.map((pattern) => (
        <CommitmentOutline key={pattern.id} pattern={pattern} onSelect={onSelectPattern} />
      ))}
    </div>
  )
}
