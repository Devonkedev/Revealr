import { ExternalLink, RefreshCw } from 'lucide-react'
import type { TabState } from '@/types/messages'
import { Button, PatternListItem, RiskBadge, ScoreGauge, Spinner } from '@/components'

interface PopupHomeProps {
  tabState: TabState | null
  loading: boolean
  onRescan: () => void
  onSelectPattern: (patternId: string) => void
  onOpenDashboard: () => void
}

export function PopupHome({ tabState, loading, onRescan, onSelectPattern, onOpenDashboard }: PopupHomeProps) {
  return (
    <div className="flex flex-col gap-4 px-4 py-4">
      {tabState ? (
        <div className="flex items-center gap-4 rounded-2xl bg-cg-surface p-4 ring-1 ring-cg-border">
          <ScoreGauge score={tabState.score.score} label="/ 100" />
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold text-cg-text">{tabState.domain}</div>
            <div className="mt-1">
              <RiskBadge level={tabState.score.riskLevel} />
            </div>
            <div className="mt-1.5 text-xs text-cg-muted">
              {tabState.patterns.length} pattern{tabState.patterns.length === 1 ? '' : 's'} found
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl bg-cg-surface-2/50 p-6 text-center text-xs text-cg-muted">
          {loading ? 'Scanning page…' : 'No scan yet — click Rescan or reload the page.'}
        </div>
      )}

      <Button variant="secondary" icon={loading ? <Spinner size={13} /> : <RefreshCw size={13} />} onClick={onRescan} disabled={loading}>
        Rescan Page
      </Button>

      {tabState && tabState.patterns.length > 0 && (
        <div>
          <div className="mb-1 text-xs font-medium uppercase tracking-wide text-cg-muted">Patterns Found</div>
          <div className="flex max-h-72 flex-col gap-1 overflow-y-auto">
            {tabState.patterns.map((p) => (
              <PatternListItem
                key={p.id}
                type={p.type}
                severity={p.severity}
                confidence={p.confidence}
                evidenceText={p.evidenceText}
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
