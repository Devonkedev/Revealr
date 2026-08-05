import { ShieldCheck } from 'lucide-react'

export function DashboardHeader() {
  return (
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-cg-border px-8 py-5">
      <div className="flex items-center gap-2.5">
        <ShieldCheck size={22} className="text-cg-accent" />
        <div>
          <h1 className="text-lg font-semibold text-cg-text">Revealr Registry</h1>
          <p className="text-xs text-cg-muted">Aggregated, anonymous record of hidden subscriptions and checkout add-ons found across opted-in browsing.</p>
        </div>
      </div>
    </header>
  )
}
