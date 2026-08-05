import type { DarkPatternType } from '@/types/patterns'
import type { DashboardStats, RegistryEntryDoc } from '@/types/registry'
import { buildDashboardStats } from './FirebaseService'

/**
 * Believable, self-contained sample data so the dashboard looks like a real
 * product on first install — before any real page has been scanned or
 * Firebase has been configured. Never uploaded anywhere; generated locally.
 */
const MOCK_DOMAINS: Array<{ domain: string; baseScore: number; patterns: DarkPatternType[] }> = [
  { domain: 'megasale-deals.com', baseScore: 28, patterns: ['fake_urgency', 'confirmshaming', 'hidden_reject_cookies', 'multiple_modal_layers'] },
  { domain: 'streamflix.example', baseScore: 41, patterns: ['forced_continuity', 'hard_to_find_unsubscribe', 'hidden_recurring_billing'] },
  { domain: 'quickcart.example', baseScore: 52, patterns: ['sneak_into_basket', 'misleading_hierarchy'] },
  { domain: 'travelnow.example', baseScore: 35, patterns: ['fake_urgency', 'misleading_hierarchy', 'sneak_into_basket'] },
  { domain: 'newsdaily.example', baseScore: 63, patterns: ['hidden_reject_cookies', 'confirmshaming'] },
  { domain: 'fitclub.example', baseScore: 22, patterns: ['forced_continuity', 'hard_to_find_unsubscribe', 'confirmshaming', 'fake_urgency'] },
  { domain: 'shopwise.example', baseScore: 74, patterns: ['misleading_hierarchy'] },
  { domain: 'cloudstore.example', baseScore: 81, patterns: ['hidden_reject_cookies'] },
]

function seededRandom(seed: number) {
  let value = seed
  return () => {
    value = (value * 9301 + 49297) % 233280
    return value / 233280
  }
}

export function generateMockRegistryEntries(): RegistryEntryDoc[] {
  const entries: RegistryEntryDoc[] = []
  const rand = seededRandom(42)
  const now = Date.now()
  const DAY_MS = 24 * 60 * 60 * 1000

  let idCounter = 0
  for (const site of MOCK_DOMAINS) {
    const scanCount = 4 + Math.floor(rand() * 8)
    for (let i = 0; i < scanCount; i++) {
      const dayOffset = Math.floor(rand() * 14)
      const scoreJitter = Math.round((rand() - 0.5) * 16)
      const score = Math.max(4, Math.min(96, site.baseScore + scoreJitter))
      const patternSubset = site.patterns.filter(() => rand() > 0.25)
      entries.push({
        id: `mock_${idCounter++}`,
        domain: site.domain,
        patternTypes: patternSubset.length > 0 ? patternSubset : [site.patterns[0]!],
        score,
        timestamp: now - dayOffset * DAY_MS - Math.floor(rand() * DAY_MS),
      })
    }
  }

  return entries.sort((a, b) => b.timestamp - a.timestamp)
}

export function getMockDashboardStats(): DashboardStats {
  const stats = buildDashboardStats(generateMockRegistryEntries())
  return { ...stats, source: 'mock' }
}
