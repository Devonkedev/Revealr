import { ShieldCheck } from 'lucide-react'
import type { DashboardStats } from '@/types/registry'

interface DashboardHeaderProps {
  source: DashboardStats['source'] | null
}

export function DashboardHeader({ source }: DashboardHeaderProps) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-cg-border px-8 py-5">
      <div className="flex items-center gap-2.5">
        <ShieldCheck size={22} className="text-cg-accent" />
        <div>
          <h1 className="text-lg font-semibold text-cg-text">ChoiceGuard Registry</h1>
          <p className="text-xs text-cg-muted">Aggregated, anonymous record of hidden subscriptions and checkout add-ons found across opted-in browsing.</p>
        </div>
      </div>
      {source === 'mock' && (
        <span className="rounded-full bg-cg-warn/15 px-3 py-1 text-xs font-medium text-cg-warn ring-1 ring-cg-warn/30">
          Showing sample data — connect Firebase to see live results
        </span>
      )}
    </header>
  )
}
