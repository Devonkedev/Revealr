import { useEffect, type ReactNode } from 'react'
import { CalendarClock, RefreshCw, Repeat2, ShieldAlert, TriangleAlert, Wallet } from 'lucide-react'
import type { DetectedPattern } from '@/types/detection'
import { PATTERN_META } from '@/types/patterns'
import { Button, Spinner } from '@/components'
import { useCommitmentDetails } from '@/hooks/useCommitmentDetails'

interface CommitmentDetailProps {
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

/**
 * What exactly is the user agreeing to — extracted, not interpreted. Shows
 * the local (regex) summary immediately, then the richer AI-extracted
 * fields once they arrive (amount, billing frequency, trial end date,
 * renewal date, cancellation requirement). No psychology, no opinion.
 */
export function CommitmentDetail({ pattern }: CommitmentDetailProps) {
  const { state, loadDetails } = useCommitmentDetails()
  const meta = PATTERN_META[pattern.type]

  useEffect(() => {
    loadDetails(pattern)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pattern.id])

  if (state.status === 'loading' || state.status === 'idle') {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-12 text-cg-muted">
        <Spinner size={20} />
        <span className="text-xs">Reading the fine print…</span>
      </div>
    )
  }

  if (state.status === 'error') {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl bg-cg-surface-2 p-4 text-center">
        <TriangleAlert size={20} className="text-cg-warn" />
        <p className="text-xs text-cg-muted">{state.error}</p>
        <Button variant="secondary" icon={<RefreshCw size={13} />} onClick={() => loadDetails(pattern)}>
          Retry
        </Button>
      </div>
    )
  }

  const commitment = state.commitment!

  return (
    <div className="animate-cg-fade-in flex flex-col gap-4">
      <div className="rounded-xl bg-cg-surface-2 p-3 text-sm text-cg-text">{commitment.summary}</div>

      {commitment.amount && (
        <Row icon={<Wallet size={15} />} title="Amount">
          {commitment.amount}
        </Row>
      )}
      {commitment.billingFrequency && (
        <Row icon={<Repeat2 size={15} />} title="Billing frequency">
          {commitment.billingFrequency}
        </Row>
      )}
      {commitment.trialEndDate && (
        <Row icon={<CalendarClock size={15} />} title="Trial ends">
          {commitment.trialEndDate}
        </Row>
      )}
      {commitment.renewalDate && (
        <Row icon={<CalendarClock size={15} />} title="Renews on">
          {commitment.renewalDate}
        </Row>
      )}
      {commitment.cancellationRequirement && (
        <Row icon={<ShieldAlert size={15} />} title="To cancel">
          {commitment.cancellationRequirement}
        </Row>
      )}

      <p className="text-[11px] text-cg-muted">
        {meta.label} · extraction confidence {Math.round(commitment.confidence * 100)}%
      </p>
    </div>
  )
}
