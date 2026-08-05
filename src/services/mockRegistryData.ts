import type { DarkPatternType } from '@/types/patterns'
import type { DashboardStats, RegistryEntryDoc } from '@/types/registry'
import { buildDashboardStats } from './FirebaseService'

/**
 * Believable, self-contained sample data so the dashboard looks like a real
 * product on first install — before any real page has been scanned or
 * Firebase has been configured. Never uploaded anywhere; generated locally.
 */
const MOCK_DOMAINS: Array<{ domain: string; baseCommitments: number; patterns: DarkPatternType[] }> = [
  { domain: 'streamflix.example', baseCommitments: 2, patterns: ['subscription_commitment'] },
  { domain: 'fitclub.example', baseCommitments: 2, patterns: ['subscription_commitment'] },
  { domain: 'quickcart.example', baseCommitments: 1, patterns: ['checkout_addon'] },
  { domain: 'travelnow.example', baseCommitments: 2, patterns: ['subscription_commitment', 'checkout_addon'] },
  { domain: 'megasale-deals.com', baseCommitments: 2, patterns: ['checkout_addon'] },
  { domain: 'newsdaily.example', baseCommitments: 1, patterns: ['subscription_commitment'] },
  { domain: 'shopwise.example', baseCommitments: 1, patterns: ['checkout_addon'] },
  { domain: 'cloudstore.example', baseCommitments: 1, patterns: ['subscription_commitment'] },
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
      const patternSubset = site.patterns.filter(() => rand() > 0.25)
      const patternTypes = patternSubset.length > 0 ? patternSubset : [site.patterns[0]!]
      const commitmentCount = Math.max(0, site.baseCommitments + Math.round((rand() - 0.5) * 2))
      entries.push({
        id: `mock_${idCounter++}`,
        domain: site.domain,
        patternTypes,
        commitmentCount,
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
