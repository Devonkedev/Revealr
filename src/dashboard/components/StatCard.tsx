import type { LucideIcon } from 'lucide-react'

interface StatCardProps {
  label: string
  value: string | number
  icon: LucideIcon
  hint?: string
}

/** Small KPI tile — label, hero-ish value, optional hint. Used across the top of the dashboard. */
export function StatCard({ label, value, icon: Icon, hint }: StatCardProps) {
  return (
    <div className="flex flex-col gap-2 rounded-2xl bg-cg-surface p-5 ring-1 ring-cg-border">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-cg-muted">{label}</span>
        <Icon size={15} className="text-cg-muted" />
      </div>
      <span className="text-3xl font-semibold text-cg-text">{value}</span>
      {hint && <span className="text-xs text-cg-muted">{hint}</span>}
    </div>
  )
}
