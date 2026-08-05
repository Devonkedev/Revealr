import { ArrowLeft, ExternalLink, ShieldCheck, X } from 'lucide-react'
import type { DetectedPattern, TransparencyScoreResult } from '@/types/detection'
import { PATTERN_META } from '@/types/patterns'
import { PatternListItem, RiskBadge, ScoreGauge } from '@/components'
import { PATTERN_ICONS, SEVERITY_COLORS } from '@/components/patternVisuals'
import { ExplanationPanel } from './ExplanationPanel'

interface DrawerProps {
  open: boolean
  domain: string
  patterns: DetectedPattern[]
  score: TransparencyScoreResult
  selectedPattern: DetectedPattern | null
  onSelectPattern: (pattern: DetectedPattern | null) => void
  onClose: () => void
  onOpenDashboard: () => void
}

/** Right-side drawer: score summary + pattern list, drilling into an AI explanation per pattern. */
export function Drawer({ open, domain, patterns, score, selectedPattern, onSelectPattern, onClose, onOpenDashboard }: DrawerProps) {
  if (!open) return null

  const handleSelect = (pattern: DetectedPattern) => {
    onSelectPattern(pattern)
    pattern.element.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  return (
    <div
      className="animate-cg-slide-in pointer-events-auto fixed inset-y-0 right-0 flex w-[380px] max-w-[92vw] flex-col border-l border-cg-border bg-cg-bg text-cg-text shadow-2xl"
      style={{ zIndex: 2147483001 }}
    >
      <header className="flex items-center justify-between border-b border-cg-border px-4 py-3">
        <div className="flex items-center gap-2">
          <ShieldCheck size={16} className="text-cg-accent" />
          <span className="text-sm font-semibold">ChoiceGuard</span>
        </div>
        <button onClick={onClose} className="rounded-md p-1 text-cg-muted hover:bg-cg-surface-2 hover:text-cg-text" aria-label="Close">
          <X size={16} />
        </button>
      </header>

      {selectedPattern ? (
        <DrawerDetail pattern={selectedPattern} onBack={() => onSelectPattern(null)} />
      ) : (
        <DrawerOverview domain={domain} patterns={patterns} score={score} onSelect={handleSelect} />
      )}

      <footer className="border-t border-cg-border px-4 py-3">
        <button
          onClick={onOpenDashboard}
          className="flex w-full items-center justify-center gap-1.5 text-xs font-medium text-cg-muted hover:text-cg-accent"
        >
          Open ChoiceGuard Dashboard <ExternalLink size={12} />
        </button>
      </footer>
    </div>
  )
}

function DrawerOverview({
  domain,
  patterns,
  score,
  onSelect,
}: {
  domain: string
  patterns: DetectedPattern[]
  score: TransparencyScoreResult
  onSelect: (p: DetectedPattern) => void
}) {
  return (
    <div className="flex flex-1 flex-col overflow-y-auto px-4 py-4">
      <div className="flex items-center gap-4 rounded-2xl bg-cg-surface p-4 ring-1 ring-cg-border">
        <ScoreGauge score={score.score} label="/ 100" />
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold">{domain}</div>
          <div className="mt-1">
            <RiskBadge level={score.riskLevel} />
          </div>
          <div className="mt-1.5 text-xs text-cg-muted">{patterns.length} pattern{patterns.length === 1 ? '' : 's'} found on this page</div>
        </div>
      </div>

      <div className="mt-5 text-xs font-medium uppercase tracking-wide text-cg-muted">Patterns Found</div>
      <div className="mt-1 flex flex-col gap-1">
        {patterns.length === 0 && (
          <div className="rounded-xl bg-cg-surface-2/50 p-4 text-center text-xs text-cg-muted">
            No manipulative patterns detected yet. ChoiceGuard keeps watching as you browse.
          </div>
        )}
        {patterns.map((p) => (
          <PatternListItem
            key={p.id}
            type={p.type}
            severity={p.severity}
            confidence={p.confidence}
            evidenceText={p.evidenceText}
            onClick={() => onSelect(p)}
          />
        ))}
      </div>
    </div>
  )
}

function DrawerDetail({ pattern, onBack }: { pattern: DetectedPattern; onBack: () => void }) {
  const meta = PATTERN_META[pattern.type]
  const Icon = PATTERN_ICONS[pattern.type]
  const colors = SEVERITY_COLORS[pattern.severity]

  return (
    <div className="flex flex-1 flex-col overflow-y-auto px-4 py-4">
      <button onClick={onBack} className="mb-3 flex items-center gap-1.5 text-xs font-medium text-cg-muted hover:text-cg-text">
        <ArrowLeft size={13} /> All patterns
      </button>

      <div className="flex items-center gap-3">
        <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${colors.bg} ${colors.text}`}>
          <Icon size={18} />
        </span>
        <div>
          <div className="text-base font-semibold">{meta.label}</div>
          <div className="text-xs text-cg-muted">{meta.description}</div>
        </div>
      </div>

      <div className="mt-5">
        <ExplanationPanel pattern={pattern} />
      </div>
    </div>
  )
}
