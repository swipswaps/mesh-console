export type SourceState = 'live' | 'stale' | 'offline'

export interface SourceStatus {
  mirror: SourceState
  registry: SourceState
  local: SourceState
}

export interface MeshNode {
  name: string
  lan: string | null
  overlay: string | null
  updated_utc: string | null
}

export interface MeshStatus {
  nodes: MeshNode[]
  sources: SourceStatus
}
