import type { MeshStatus, SourceState } from '../types'

const STALE_MS = 10 * 60 * 1000
const BACKEND_KEY = 'mesh-console.backend-origin'
// A backend *address* is not a secret (reachability, not authority),
// so persisting it in localStorage is safe. Tokens never go here.
export function savedBackendOrigin(): string | null {
  try {
    return window.localStorage.getItem(BACKEND_KEY)
  } catch {
    return null
  }
}

export function saveBackendOrigin(origin: string | null): void {
  try {
    if (origin) window.localStorage.setItem(BACKEND_KEY, origin)
    else window.localStorage.removeItem(BACKEND_KEY)
  } catch {
    // storage unavailable (private mode) — session-only fallback
  }
}

interface MirrorDoc {
  nodes?: Record<string, { lan?: string | null; overlay?: string | null; updated_utc?: string | null }>
  updated_utc?: string | null
}

function ageState(updatedUtc: string | null | undefined, now: number): SourceState {
  if (!updatedUtc) return 'stale'
  const t = Date.parse(updatedUtc)
  if (Number.isNaN(t)) return 'stale'
  return now - t > STALE_MS ? 'stale' : 'live'
}

async function fetchMirror(now: number): Promise<{ nodes: MeshStatus['nodes']; state: SourceState }> {
  const res = await fetch(`${import.meta.env.BASE_URL}endpoints.json`, { cache: 'no-store' })
  if (!res.ok) throw new Error(`mirror http ${res.status}`)
  const doc = (await res.json()) as MirrorDoc
  const nodes = Object.entries(doc.nodes ?? {}).map(([name, info]) => ({
    name,
    lan: info.lan ?? null,
    overlay: info.overlay ?? null,
    updated_utc: info.updated_utc ?? null,
  }))
  const newest = nodes
    .map((n) => (n.updated_utc ? Date.parse(n.updated_utc) : NaN))
    .filter((t) => !Number.isNaN(t))
  const state: SourceState =
    newest.length === 0 ? 'stale' : ageState(new Date(Math.max(...newest)).toISOString(), now)
  return { nodes, state }
}

function defaultBackendOrigin(): string | null {
  if (window.location.protocol !== 'http:') return null
  return `http://${window.location.hostname}:5180`
}

async function fetchLocal(origin: string | null): Promise<SourceState> {
  if (!origin) return 'offline'
  try {
    const res = await fetch(`${origin}/api/status`, { signal: AbortSignal.timeout(4000) })
    if (!res.ok) return 'stale'
    await res.json()
    return 'live'
  } catch {
    return 'offline'
  }
}

// Fallback order: mirror -> registry (Phase 2, OAuth) -> local.
// Registry stays offline until login lands; local degrades honestly.
export async function fetchMeshStatus(): Promise<MeshStatus> {
  const now = Date.now()
  let nodes: MeshStatus['nodes'] = []
  let mirror: SourceState = 'offline'
  try {
    const m = await fetchMirror(now)
    nodes = m.nodes
    mirror = m.state
  } catch {
    mirror = 'offline'
  }
  const local = await fetchLocal(savedBackendOrigin() ?? defaultBackendOrigin())
  return { nodes, sources: { mirror, registry: 'offline', local } }
}

export function badgeClass(state: SourceState): string {
  return `badge badge-${state}`
}
