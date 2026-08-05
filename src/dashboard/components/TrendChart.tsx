import { useMemo, useState, type MouseEvent } from 'react'
import type { DashboardTrendPoint } from '@/types/registry'

interface TrendChartProps {
  data: DashboardTrendPoint[]
}

const WIDTH = 640
const HEIGHT = 220
const PAD = { top: 16, right: 16, bottom: 28, left: 32 }
const ACCENT = '#7c6cf6'

function formatDay(iso: string): string {
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

/**
 * Single-series line chart — avg Transparency Score over the last 14 days.
 * One series needs no legend box (the title says what's plotted); a
 * crosshair + shared tooltip drives hover, per the dataviz interaction spec.
 */
export function TrendChart({ data }: TrendChartProps) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null)

  const plotW = WIDTH - PAD.left - PAD.right
  const plotH = HEIGHT - PAD.top - PAD.bottom

  const points = useMemo(() => {
    if (data.length === 0) return []
    const step = data.length > 1 ? plotW / (data.length - 1) : 0
    return data.map((d, i) => ({
      ...d,
      x: PAD.left + step * i,
      y: PAD.top + plotH * (1 - d.avgScore / 100),
    }))
  }, [data, plotW, plotH])

  if (points.length === 0) {
    return <div className="flex h-[220px] items-center justify-center text-xs text-cg-muted">Not enough data yet.</div>
  }

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ')
  const areaPath = `${linePath} L ${points[points.length - 1]!.x.toFixed(1)} ${PAD.top + plotH} L ${points[0]!.x.toFixed(1)} ${PAD.top + plotH} Z`

  const gridTicks = [0, 50, 100]
  const hovered = hoverIndex !== null ? points[hoverIndex] : null

  const handleMove = (e: MouseEvent<SVGRectElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const relX = e.clientX - rect.left
    const step = plotW / Math.max(points.length - 1, 1)
    const idx = Math.round((relX - PAD.left) / step)
    setHoverIndex(Math.max(0, Math.min(points.length - 1, idx)))
  }

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full" role="img" aria-label="Average transparency score over the last 14 days">
        {gridTicks.map((tick) => {
          const y = PAD.top + plotH * (1 - tick / 100)
          return (
            <g key={tick}>
              <line x1={PAD.left} x2={WIDTH - PAD.right} y1={y} y2={y} stroke="#26262f" strokeWidth={1} />
              <text x={PAD.left - 8} y={y + 3} textAnchor="end" fontSize={10} fill="#9797a6">
                {tick}
              </text>
            </g>
          )
        })}

        <defs>
          <linearGradient id="cg-trend-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={ACCENT} stopOpacity={0.18} />
            <stop offset="100%" stopColor={ACCENT} stopOpacity={0} />
          </linearGradient>
        </defs>

        <path d={areaPath} fill="url(#cg-trend-fill)" stroke="none" />
        <path d={linePath} fill="none" stroke={ACCENT} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />

        {points.map((p, i) => (
          <text key={p.date} x={p.x} y={HEIGHT - 6} textAnchor="middle" fontSize={9} fill="#9797a6" opacity={i % 2 === 0 ? 1 : 0}>
            {formatDay(p.date)}
          </text>
        ))}

        {hovered && <line x1={hovered.x} x2={hovered.x} y1={PAD.top} y2={PAD.top + plotH} stroke="#9797a6" strokeWidth={1} strokeDasharray="3 3" />}

        {points.map((p, i) => (
          <circle
            key={p.date}
            cx={p.x}
            cy={p.y}
            r={hoverIndex === i ? 5 : 3}
            fill={ACCENT}
            stroke="#0b0b0f"
            strokeWidth={2}
            opacity={hoverIndex === null || hoverIndex === i ? 1 : 0.5}
          />
        ))}

        <rect x={PAD.left} y={0} width={plotW} height={HEIGHT} fill="transparent" onMouseMove={handleMove} onMouseLeave={() => setHoverIndex(null)} />
      </svg>

      {hovered && (
        <div
          className="pointer-events-none absolute top-2 rounded-lg border border-cg-border bg-cg-surface px-3 py-2 text-xs shadow-xl"
          style={{ left: `min(${(hovered.x / WIDTH) * 100}%, calc(100% - 140px))` }}
        >
          <div className="font-medium text-cg-text">{formatDay(hovered.date)}</div>
          <div className="text-cg-muted">
            Avg score: <span className="font-semibold text-cg-text">{hovered.avgScore}</span>
          </div>
          <div className="text-cg-muted">
            Scans: <span className="text-cg-text">{hovered.scans}</span>
          </div>
        </div>
      )}
    </div>
  )
}
