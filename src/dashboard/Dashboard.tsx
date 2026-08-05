import type { ReactNode } from 'react'
import { Activity, Globe2, TrendingUp } from 'lucide-react'
import { useDashboardStats } from './hooks/useDashboardStats'
import { DashboardHeader } from './components/DashboardHeader'
import { StatCard } from './components/StatCard'
import { TrendChart } from './components/TrendChart'
import { PatternFrequencyChart } from './components/PatternFrequencyChart'
import { TopSitesTable } from './components/TopSitesTable'
import { Spinner } from '@/components'

function SectionCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-2xl bg-cg-surface p-5 ring-1 ring-cg-border">
      <h2 className="mb-4 text-sm font-semibold text-cg-text">{title}</h2>
      {children}
    </div>
  )
}

export function Dashboard() {
  const { stats, loading } = useDashboardStats()

  if (loading || !stats) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-2 text-cg-muted">
        <Spinner size={22} />
        <span className="text-xs">Loading registry data…</span>
      </div>
    )
  }

  const avgScore = stats.topSites.length > 0 ? Math.round(stats.topSites.reduce((sum, s) => sum + s.avgScore, 0) / stats.topSites.length) : 0

  return (
    <div className="min-h-screen bg-cg-bg pb-16 text-cg-text">
      <DashboardHeader source={stats.source} />

      <main className="mx-auto max-w-5xl px-8 py-8">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard label="Total Scans" value={stats.totalScans.toLocaleString()} icon={Activity} hint="Opted-in page scans recorded" />
          <StatCard label="Domains Tracked" value={stats.totalDomains.toLocaleString()} icon={Globe2} hint="Unique sites in the registry" />
          <StatCard label="Avg Transparency Score" value={avgScore} icon={TrendingUp} hint="Across tracked domains, 0–100" />
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <SectionCard title="Transparency Score — Last 14 Days">
              <TrendChart data={stats.trend} />
            </SectionCard>
          </div>
          <div className="lg:col-span-2">
            <SectionCard title="Most Common Manipulation Types">
              <PatternFrequencyChart frequency={stats.patternFrequency} />
            </SectionCard>
          </div>
        </div>

        <div className="mt-6">
          <SectionCard title="Top Sites by Risk">
            <TopSitesTable sites={stats.topSites} />
          </SectionCard>
        </div>
      </main>
    </div>
  )
}
