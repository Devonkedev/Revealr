import type { DarkPatternType, Severity } from '@/types/patterns'
import { SEVERITY_WEIGHT } from '@/types/patterns'
import type { TransparencyScoreResult } from '@/types/detection'
import { clamp } from '@/utils/format'

interface ScorablePattern {
  type: DarkPatternType
  severity: Severity
  confidence: number
}

/**
 * Transparency Score: starts at 100 (fully transparent) and loses points
 * per detected pattern, weighted by severity and confidence. Repeated
 * instances of the same pattern type count with diminishing returns so one
 * noisy detector can't tank the score on its own.
 */
export function calculateTransparencyScore(patterns: ScorablePattern[]): TransparencyScoreResult {
  const patternCounts: Partial<Record<DarkPatternType, number>> = {}
  let deduction = 0

  const countByType = new Map<DarkPatternType, number>()

  for (const p of patterns) {
    patternCounts[p.type] = (patternCounts[p.type] ?? 0) + 1
    const occurrence = countByType.get(p.type) ?? 0
    countByType.set(p.type, occurrence + 1)

    // Diminishing weight for repeats of the same pattern type: 1, 0.6, 0.36, ...
    const diminishing = Math.pow(0.6, occurrence)
    deduction += SEVERITY_WEIGHT[p.severity] * p.confidence * diminishing
  }

  const score = Math.round(clamp(100 - deduction, 0, 100))

  const riskLevel = score >= 75 ? 'low' : score >= 45 ? 'medium' : 'high'

  return {
    score,
    riskLevel,
    patternCounts,
    totalPatterns: patterns.length,
  }
}
