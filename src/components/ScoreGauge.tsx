import { scoreColorClass } from './patternVisuals'

interface ScoreGaugeProps {
  score: number
  size?: number
  strokeWidth?: number
  label?: string
}

/** Circular 0–100 transparency score gauge, used in the popup, drawer, and floating badge. */
export function ScoreGauge({ score, size = 88, strokeWidth = 8, label }: ScoreGaugeProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const clamped = Math.max(0, Math.min(100, score))
  const offset = circumference * (1 - clamped / 100)
  const color = scoreColorClass(clamped)

  return (
    <div className="relative inline-flex flex-col items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" strokeWidth={strokeWidth} className="text-cg-border" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color.stroke}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.5s cubic-bezier(0.16, 1, 0.3, 1)' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`font-semibold tabular-nums ${color.text}`} style={{ fontSize: size * 0.32 }}>
          {clamped}
        </span>
        {label && <span className="text-[10px] text-cg-muted -mt-0.5">{label}</span>}
      </div>
    </div>
  )
}
