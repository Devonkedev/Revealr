import type { DashboardTopSite } from '@/types/registry'
import { PATTERN_META } from '@/types/patterns'
import { PATTERN_ICONS, scoreColorClass } from '@/components/patternVisuals'

interface TopSitesTableProps {
  sites: DashboardTopSite[]
}

/** Sites ranked worst-score-first — the ones most worth a second look. */
export function TopSitesTable({ sites }: TopSitesTableProps) {
  if (sites.length === 0) {
    return <div className="flex h-40 items-center justify-center text-xs text-cg-muted">No sites scanned yet.</div>
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-cg-border text-xs uppercase tracking-wide text-cg-muted">
            <th className="pb-2 font-medium">Site</th>
            <th className="pb-2 font-medium">Score</th>
            <th className="pb-2 font-medium">Scans</th>
            <th className="pb-2 font-medium">Most Common Pattern</th>
          </tr>
        </thead>
        <tbody>
          {sites.map((site) => {
            const colors = scoreColorClass(site.avgScore)
            const Icon = site.mostCommonPattern ? PATTERN_ICONS[site.mostCommonPattern] : null
            return (
              <tr key={site.domain} className="border-b border-cg-border/50 last:border-0">
                <td className="py-2.5 pr-3 font-medium text-cg-text">{site.domain}</td>
                <td className={`py-2.5 pr-3 font-semibold tabular-nums ${colors.text}`}>{site.avgScore}</td>
                <td className="py-2.5 pr-3 tabular-nums text-cg-muted">{site.scans}</td>
                <td className="py-2.5 text-cg-muted">
                  {site.mostCommonPattern && Icon ? (
                    <span className="inline-flex items-center gap-1.5">
                      <Icon size={13} /> {PATTERN_META[site.mostCommonPattern].shortLabel}
                    </span>
                  ) : (
                    '—'
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
