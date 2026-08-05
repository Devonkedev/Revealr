import { useEffect, useState } from 'react'
import type { DashboardStats } from '@/types/registry'
import { buildDashboardStats, fetchRegistryEntries, isFirebaseConfigured } from '@/services/FirebaseService'
import { getMockDashboardStats } from '@/services/mockRegistryData'

interface DashboardStatsResult {
  stats: DashboardStats | null
  loading: boolean
  error: string | null
}

/** Loads dashboard data from Firestore when configured, otherwise (or on failure) falls back to bundled mock data. */
export function useDashboardStats(): DashboardStatsResult {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)
      try {
        if (!isFirebaseConfigured()) {
          if (!cancelled) setStats(getMockDashboardStats())
          return
        }
        const entries = await fetchRegistryEntries()
        if (!cancelled) setStats(entries.length > 0 ? buildDashboardStats(entries) : getMockDashboardStats())
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load registry data')
          setStats(getMockDashboardStats())
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  return { stats, loading, error }
}
