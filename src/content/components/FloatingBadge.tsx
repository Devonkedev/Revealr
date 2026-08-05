import type { TransparencyScoreResult } from '@/types/detection'
import { scoreColorClass } from '@/components/patternVisuals'

interface FloatingBadgeProps {
  score: TransparencyScoreResult
  onClick: () => void
  visible: boolean
}

/** Persistent bottom-right badge showing the live Transparency Score for the current page. */
export function FloatingBadge({ score, onClick, visible }: FloatingBadgeProps) {
  if (!visible) return null
  const colors = scoreColorClass(score.score)

  return (
    <button
      type="button"
      onClick={onClick}
      className="animate-cg-pop fixed bottom-5 right-5 flex h-14 w-14 items-center justify-center rounded-full bg-cg-surface shadow-2xl ring-1 ring-cg-border transition-transform duration-150 hover:scale-105"
      style={{ zIndex: 2147483000 }}
      aria-label="Open ChoiceGuard"
      title={`ChoiceGuard Transparency Score: ${score.score}/100`}
    >
      <span className={`text-base font-semibold leading-none tabular-nums ${colors.text}`}>{score.score}</span>
      {score.totalPatterns > 0 && (
        <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-cg-danger px-1 text-[10px] font-bold text-white ring-2 ring-cg-bg">
          {score.totalPatterns}
        </span>
      )}
    </button>
  )
}
