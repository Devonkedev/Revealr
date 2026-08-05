import type { DarkPatternType } from '@/types/patterns'
import type { DashboardStats, DashboardTopSite, DashboardTrendPoint, RegistryEntry, RegistryEntryDoc } from '@/types/registry'
import { isoDay } from '@/utils/format'

/**
 * Firebase (Firestore) backs the Registry dashboard — see
 * README "Firebase setup" for the one-time project creation + test-mode
 * rules this relies on. We talk to the Firestore REST API directly
 * (no firebase-js-sdk) so this works from an MV3 service worker without
 * bundling the SDK's DOM/iframe-dependent Auth code.
 */
const PROJECT_ID = import.meta.env.VITE_FIREBASE_PROJECT_ID as string | undefined
const COLLECTION = 'registry'

export function isFirebaseConfigured(): boolean {
  return Boolean(PROJECT_ID && PROJECT_ID.trim().length > 0)
}

function collectionUrl(): string {
  if (!PROJECT_ID) throw new Error('VITE_FIREBASE_PROJECT_ID is not set — see .env.example')
  return `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/${COLLECTION}`
}

type FirestoreValue =
  | { stringValue: string }
  | { integerValue: string }
  | { arrayValue: { values?: FirestoreValue[] } }

interface FirestoreDocument {
  name: string
  fields: Record<string, FirestoreValue>
}

function toFirestoreFields(entry: RegistryEntry): Record<string, FirestoreValue> {
  return {
    domain: { stringValue: entry.domain },
    patternTypes: { arrayValue: { values: entry.patternTypes.map((type) => ({ stringValue: type })) } },
    commitmentCount: { integerValue: String(entry.commitmentCount) },
    timestamp: { integerValue: String(entry.timestamp) },
  }
}

function stringField(fields: Record<string, FirestoreValue>, key: string, fallback: string): string {
  const value = fields[key]
  return value && 'stringValue' in value ? value.stringValue : fallback
}

function intField(fields: Record<string, FirestoreValue>, key: string, fallback: number): number {
  const value = fields[key]
  return value && 'integerValue' in value ? Number(value.integerValue) : fallback
}

function arrayField(fields: Record<string, FirestoreValue>, key: string): DarkPatternType[] {
  const value = fields[key]
  if (!value || !('arrayValue' in value)) return []
  return (value.arrayValue.values ?? [])
    .map((v) => ('stringValue' in v ? (v.stringValue as DarkPatternType) : null))
    .filter((v): v is DarkPatternType => v !== null)
}

function fromFirestoreDocument(doc: FirestoreDocument): RegistryEntryDoc {
  return {
    id: doc.name.split('/').pop() ?? doc.name,
    domain: stringField(doc.fields, 'domain', 'unknown'),
    patternTypes: arrayField(doc.fields, 'patternTypes'),
    commitmentCount: intField(doc.fields, 'commitmentCount', 0),
    timestamp: intField(doc.fields, 'timestamp', Date.now()),
  }
}

/** Uploads one anonymous, opt-in scan result. Requires Firestore rules that allow public writes (test mode). */
export async function uploadRegistryEntry(entry: RegistryEntry): Promise<void> {
  const response = await fetch(collectionUrl(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields: toFirestoreFields(entry) }),
  })
  if (!response.ok) {
    const body = await response.text().catch(() => '')
    throw new Error(`Firestore upload failed (${response.status}): ${body.slice(0, 300)}`)
  }
}

export async function fetchRegistryEntries(limit = 500): Promise<RegistryEntryDoc[]> {
  const url = `${collectionUrl()}?pageSize=${limit}&orderBy=${encodeURIComponent('timestamp desc')}`
  const response = await fetch(url)
  if (!response.ok) {
    const body = await response.text().catch(() => '')
    throw new Error(`Firestore fetch failed (${response.status}): ${body.slice(0, 300)}`)
  }
  const data = (await response.json()) as { documents?: FirestoreDocument[] }
  return (data.documents ?? []).map(fromFirestoreDocument)
}

/**
 * Pure aggregation — shared by the real Firestore path and the placeholder-data path
 * generator. This counts what was found; it never scores or ranks a site as
 * "good" or "bad" — sites are ordered by how many hidden commitments were
 * found, a fact, not a grade.
 */
export function buildDashboardStats(entries: RegistryEntryDoc[]): DashboardStats {
  const byDomain = new Map<string, RegistryEntryDoc[]>()
  const patternFrequency: Partial<Record<DarkPatternType, number>> = {}
  const byDay = new Map<string, { totalCommitments: number; scans: number }>()

  for (const entry of entries) {
    const domainEntries = byDomain.get(entry.domain) ?? []
    domainEntries.push(entry)
    byDomain.set(entry.domain, domainEntries)

    for (const type of entry.patternTypes) {
      patternFrequency[type] = (patternFrequency[type] ?? 0) + 1
    }

    const day = isoDay(entry.timestamp)
    const dayAgg = byDay.get(day) ?? { totalCommitments: 0, scans: 0 }
    dayAgg.totalCommitments += entry.commitmentCount
    dayAgg.scans += 1
    byDay.set(day, dayAgg)
  }

  const topSites: DashboardTopSite[] = Array.from(byDomain.entries())
    .map(([domain, domainEntries]) => {
      const totalCommitments = domainEntries.reduce((sum, e) => sum + e.commitmentCount, 0)
      const patternCounts = new Map<DarkPatternType, number>()
      for (const e of domainEntries) {
        for (const type of e.patternTypes) {
          patternCounts.set(type, (patternCounts.get(type) ?? 0) + 1)
        }
      }
      let mostCommonPattern: DarkPatternType | null = null
      let max = 0
      for (const [type, count] of patternCounts) {
        if (count > max) {
          max = count
          mostCommonPattern = type
        }
      }
      return { domain, totalCommitments, scans: domainEntries.length, mostCommonPattern }
    })
    .sort((a, b) => b.totalCommitments - a.totalCommitments)
    .slice(0, 10)

  const trend: DashboardTrendPoint[] = Array.from(byDay.entries())
    .map(([date, agg]) => ({ date, totalCommitments: agg.totalCommitments, scans: agg.scans }))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-14)

  return {
    topSites,
    trend,
    patternFrequency,
    totalScans: entries.length,
    totalDomains: byDomain.size,
    source: 'firestore',
  }
}
