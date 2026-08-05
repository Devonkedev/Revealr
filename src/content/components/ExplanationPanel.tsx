import { useEffect, type ReactNode } from 'react'
import { Brain, CheckCircle2, RefreshCw, TrendingUp, TriangleAlert } from 'lucide-react'
import type { DetectedPattern } from '@/types/detection'
import { PATTERN_META } from '@/types/patterns'
import { Spinner, Button } from '@/components'
import { useExplanation } from '@/hooks/useExplanation'

interface ExplanationPanelProps {
  pattern: DetectedPattern
}

interface RowProps {
  icon: ReactNode
  title: string
  children: ReactNode
}

function Row({ icon, title, children }: RowProps) {
  return (
    <div className="flex gap-3">
      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-cg-surface-2 text-cg-accent">{icon}</div>
      <div className="min-w-0">
        <div className="text-xs font-medium uppercase tracking-wide text-cg-muted">{title}</div>
        <div className="mt-0.5 text-sm leading-relaxed text-cg-text">{children}</div>
      </div>
    </div>
  )
}

/** AI-generated (or fallback) explanation of why a specific detected pattern is manipulative. */
export function ExplanationPanel({ pattern }: ExplanationPanelProps) {
  const { state, explain } = useExplanation()
  const meta = PATTERN_META[pattern.type]

  useEffect(() => {
    explain(pattern)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pattern.id])

  if (state.status === 'loading' || state.status === 'idle') {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-12 text-cg-muted">
        <Spinner size={20} />
        <span className="text-xs">Asking the AI what's going on here…</span>
      </div>
    )
  }

  if (state.status === 'error') {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl bg-cg-surface-2 p-4 text-center">
        <TriangleAlert size={20} className="text-cg-warn" />
        <p className="text-xs text-cg-muted">{state.error}</p>
        <Button variant="secondary" icon={<RefreshCw size={13} />} onClick={() => explain(pattern)}>
          Retry
        </Button>
      </div>
    )
  }

  const explanation = state.explanation!

  return (
    <div className="flex flex-col gap-4 animate-cg-fade-in">
      <div className="flex items-center gap-2 text-xs text-cg-muted">
        <span>AI confidence</span>
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-cg-surface-2">
          <div className="h-full rounded-full bg-cg-accent" style={{ width: `${Math.round(explanation.confidence * 100)}%` }} />
        </div>
        <span className="tabular-nums">{Math.round(explanation.confidence * 100)}%</span>
      </div>

      <Row icon={<Brain size={15} />} title="Psychology">
        {explanation.psychology}
      </Row>
      <Row icon={<TriangleAlert size={15} />} title="Why you're being manipulated">
        {explanation.whyManipulative}
      </Row>
      <Row icon={<CheckCircle2 size={15} />} title="Fair alternative">
        {explanation.suggestedAlternative}
      </Row>
      <Row icon={<TrendingUp size={15} />} title="Potential impact">
        {explanation.potentialImpact}
      </Row>

      <p className="text-[11px] text-cg-muted">{meta.label} · detector confidence {Math.round(pattern.confidence * 100)}%</p>
    </div>
  )
}
