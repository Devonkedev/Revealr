import { ShieldCheck } from 'lucide-react'
import type { PageFindingsSummary } from '@/types/detection'

interface FloatingBadgeProps {
  findings: PageFindingsSummary
  onClick: () => void
  visible: boolean
}

/** Persistent bottom-right entry point. Shows a count when something was found — never a score or grade. */
export function FloatingBadge({ findings, onClick, visible }: FloatingBadgeProps) {
  if (!visible) return null

  return (
    <button
      type="button"
      onClick={onClick}
      className="animate-cg-pop fixed bottom-5 right-5 flex h-14 w-14 items-center justify-center rounded-full bg-cg-surface shadow-2xl ring-1 ring-cg-border transition-transform duration-150 hover:scale-105"
      style={{ zIndex: 2147483000 }}
      aria-label="Open Revealr"
      title={
        findings.totalCommitments > 0
          ? `Revealr found ${findings.totalCommitments} hidden commitment${findings.totalCommitments === 1 ? '' : 's'} on this page`
          : 'Revealr — nothing hidden found on this page'
      }
    >
      <ShieldCheck size={20} className="text-cg-accent" />
      {findings.totalCommitments > 0 && (
        <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-cg-danger px-1 text-[10px] font-bold text-white ring-2 ring-cg-bg">
          {findings.totalCommitments}
        </span>
      )}
    </button>
  )
}
