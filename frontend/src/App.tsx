import { useEffect, useState } from 'react'
import { fetchMeshStatus } from './services/meshApi'
import type { MeshStatus } from './types'
import './App.css'

const INITIAL: MeshStatus = {
  nodes: [],
  sources: { mirror: 'offline', registry: 'offline', local: 'offline' },
}

const LABELS = { mirror: 'Public mirror', registry: 'Private registry', local: 'Local backend' } as const

export default function App() {
  const [status, setStatus] = useState<MeshStatus>(INITIAL)

  useEffect(() => {
    let alive = true
    fetchMeshStatus().then((s) => {
      if (alive) setStatus(s)
    })
    return () => {
      alive = false
    }
  }, [])

  return (
    <main className="app">
      <h1>Mesh Console</h1>
      <p className="sub">All sources offline — showing fixtures, not data.</p>
      <section className="badges">
        {(Object.keys(LABELS) as (keyof typeof LABELS)[]).map((key) => (
          <span key={key} className={`badge badge-${status.sources[key]}`}>
            {LABELS[key]}: {status.sources[key]}
          </span>
        ))}
      </section>
      <section className="nodes">
        {status.nodes.length === 0 ? (
          <p>No nodes reported.</p>
        ) : (
          <ul>
            {status.nodes.map((n) => (
              <li key={n.name}>
                {n.name} — lan {n.lan ?? '?'} — overlay {n.overlay ?? '?'}
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  )
}
