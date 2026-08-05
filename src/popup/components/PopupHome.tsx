import { ExternalLink, RefreshCw } from 'lucide-react'
import type { TabState } from '@/types/messages'
import { PATTERN_META } from '@/types/patterns'
import { Button, CommitmentListItem, FindExitButton, Spinner } from '@/components'

interface PopupHomeProps {
  tabState: TabState | null
  loading: boolean
  onRescan: () => void
  onSelectPattern: (patternId: string) => void
  onFindExit: () => void
  onOpenDashboard: () => void
}

export function PopupHome({ tabState, loading, onRescan, onSelectPattern, onFindExit, onOpenDashboard }: PopupHomeProps) {
  const totalCommitments = tabState?.findings.totalCommitments ?? 0

  return (
    <div className="flex flex-col gap-4 px-4 py-4">
      {tabState ? (
        <div className="rounded-2xl bg-cg-surface p-4 ring-1 ring-cg-border">
          <div className="truncate text-sm font-semibold text-cg-text">{tabState.domain}</div>
          <div className="mt-1 text-xs text-cg-muted">
            {totalCommitments === 0
              ? 'No hidden commitments found on this page.'
              : `${totalCommitments} hidden commitment${totalCommitments === 1 ? '' : 's'} found on this page.`}
          </div>
        </div>
      ) : (
        <div className="rounded-2xl bg-cg-surface-2/50 p-6 text-center text-xs text-cg-muted">
          {loading ? 'Scanning page…' : 'No scan yet — click Rescan or reload the page.'}
        </div>
      )}

      <FindExitButton onClick={onFindExit} />

      <Button variant="ghost" icon={loading ? <Spinner size={13} /> : <RefreshCw size={13} />} onClick={onRescan} disabled={loading}>
        Rescan Page
      </Button>

      {tabState && tabState.patterns.length > 0 && (
        <div>
          <div className="mb-1 text-xs font-medium uppercase tracking-wide text-cg-muted">What happens if I continue</div>
          <div className="flex max-h-72 flex-col gap-1 overflow-y-auto">
            {tabState.patterns.map((p) => (
              <CommitmentListItem
                key={p.id}
                type={p.type}
                severity={p.severity}
                summary={p.quickSummary || PATTERN_META[p.type].description}
                amount={p.quickAmount}
                onClick={() => onSelectPattern(p.id)}
              />
            ))}
          </div>
        </div>
      )}

      <button
        onClick={onOpenDashboard}
        className="flex items-center justify-center gap-1.5 pt-1 text-xs font-medium text-cg-muted hover:text-cg-accent"
      >
        Open ChoiceGuard Dashboard <ExternalLink size={12} />
      </button>
    </div>
  )
}
