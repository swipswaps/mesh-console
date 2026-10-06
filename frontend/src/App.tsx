import { useCallback, useEffect, useState } from 'react'
import SecurityPanel from './components/SecurityPanel'
import { fetchMeshStatus, saveBackendOrigin, savedBackendOrigin } from './services/meshApi'
import type { MeshStatus } from './types'
import './App.css'

type LoadState = 'checking' | 'ready'

const INITIAL: MeshStatus = {
  nodes: [],
  sources: { mirror: 'offline', registry: 'offline', local: 'offline' },
}

const LABELS = { mirror: 'Public mirror', registry: 'Private registry', local: 'Local backend' } as const

const HINTS: Record<string, string> = {
  mirror: 'Mirror updates every 5 min from node heartbeats; stale means heartbeats stopped, not that nodes died — check recover.log.',
  registry: 'Login lands in Phase 2 (OAuth, memory-only token).',
  local: 'Run the backend where your nodes are: `docker compose up -d` in mesh-console, then set its address below (http://HOST:5180). Public https:// pages cannot reach LAN http (browser mixed-content block) — that is expected, not a bug.',
}

function summaryLine(status: MeshStatus): string {
  const live = (Object.keys(LABELS) as (keyof typeof LABELS)[]).filter(
    (key) => status.sources[key] === 'live',
  )
  if (live.length === 0) return 'All sources offline — showing fixtures, not data.'
  return `Live via ${live.map((key) => LABELS[key]).join(', ')}.`
}

export default function App() {
  const [status, setStatus] = useState<MeshStatus>(INITIAL)
  const [phase, setPhase] = useState<LoadState>('checking')
  const [backendInput, setBackendInput] = useState(savedBackendOrigin() ?? '')
  const [showHelp, setShowHelp] = useState<string | null>(null)

  const refresh = useCallback(() => {
    setPhase('checking')
    let alive = true
    fetchMeshStatus().then((s) => {
      if (alive) {
        setStatus(s)
        setPhase('ready')
      }
    })
    return () => {
      alive = false
    }
  }, [])

  useEffect(() => {
    const stop = refresh()
    return stop
  }, [refresh])

  const saveBackend = () => {
    const v = backendInput.trim()
    saveBackendOrigin(v || null)
    refresh()
  }

  return (
    <main className="app">
      <h1>Mesh Console</h1>
      {phase === 'checking' ? (
        <p className="sub">Checking sources…</p>
      ) : (
        <p className="sub">{summaryLine(status)}</p>
      )}
      <section className="badges">
        {(Object.keys(LABELS) as (keyof typeof LABELS)[]).map((key) => (
          <span key={key} className={`badge badge-${status.sources[key]}`}>
            {LABELS[key]}: {phase === 'checking' ? '…' : status.sources[key]}
          </span>
        ))}
        <button type="button" onClick={refresh}>
          Refresh
        </button>
      </section>
      {phase === 'ready' &&
        (Object.keys(LABELS) as (keyof typeof LABELS)[]).map((key) =>
          status.sources[key] === 'offline' ? (
            <p key={key} className="hint">
              {LABELS[key]} offline.{' '}
              <button type="button" onClick={() => setShowHelp(showHelp === key ? null : key)}>
                {showHelp === key ? 'hide' : 'why?'}
              </button>
              {showHelp === key ? ` ${HINTS[key]}` : null}
            </p>
          ) : null,
        )}
      <section className="backend-config">
        <label>
          Backend address (saved in this browser only, not a secret):
          <input
            value={backendInput}
            onChange={(e) => setBackendInput(e.target.value)}
            placeholder="http://192.168.4.24:5180"
            inputMode="url"
          />
        </label>
        <button type="button" onClick={saveBackend}>
          Use backend
        </button>
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
      <SecurityPanel />
    </main>
  )
}
