import type { MeshStatus, SourceState } from '../types'

const OFFLINE: MeshStatus = {
  nodes: [],
  sources: { mirror: 'offline', registry: 'offline', local: 'offline' },
}

// Phase 0: fixture only. Phase 1+ replace each fetch with the real
// source in fallback order mirror -> registry -> local backend.
export async function fetchMeshStatus(): Promise<MeshStatus> {
  void fetch
  return OFFLINE
}

export function badgeClass(state: SourceState): string {
  return `badge badge-${state}`
}
