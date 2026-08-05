import type { DarkPatternType } from './patterns'

/**
 * A single anonymous, opt-in upload to the Firestore "registry" collection.
 * No PII, no full URLs, no score/judgment — just what was found.
 */
export interface RegistryEntry {
  domain: string
  patternTypes: DarkPatternType[]
  commitmentCount: number
  timestamp: number
}

export interface RegistryEntryDoc extends RegistryEntry {
  id: string
}

export interface DashboardTopSite {
  domain: string
  totalCommitments: number
  scans: number
  mostCommonPattern: DarkPatternType | null
}

export interface DashboardTrendPoint {
  /** ISO date (day granularity). */
  date: string
  totalCommitments: number
  scans: number
}

export interface DashboardStats {
  topSites: DashboardTopSite[]
  trend: DashboardTrendPoint[]
  patternFrequency: Partial<Record<DarkPatternType, number>>
  totalScans: number
  totalDomains: number
  source: 'firestore' | 'mock'
}
